# Design: Fase 1 — Fundación: Base de Datos & Plataforma

## Technical Approach

Mover el directorio `prisma/` completo (schema, migrations, seed) de `identity/` a `apps/api/prisma/`. Crear `SharedModule` con `@Global()` que provea `PrismaService` como singleton conectado vía `PrismaPg`. Agregar campos base (`organizationId?`, `deletedAt?`, `deletedById?`, `version`, `createdById`, `updatedById`) a los modelos existentes (`User`, `Role`, `FailedLoginAttempt`) + nuevas tablas `audit_logs` y `system_configurations`. Actualizar `PrismaUserRepository` para excluir soft-deletes en queries de auth. Seed se actualiza con `createdById: "system"`.

## Architecture Decisions

| Decisión | Opciones (tradeoff) | Elección |
|----------|---------------------|----------|
| **Schema location** | a) Per-module (cada módulo su schema → fragmentación, migraciones separadas) b) **Shared `apps/api/prisma/`** (único schema, migraciones atómicas) | b) Un solo `schema.prisma` en `apps/api/prisma/`. Migraciones cross-module como una unidad. |
| **SharedModule scope** | a) `@Global()` (una import en AppModule, cualquier módulo inyecta sin import) b) Per-import (explícito pero verboso, cada módulo debe importar SharedModule) | a) `@Global()` — un pool compartido, sin duplicación de conexiones. Patrón probado en NestJS. |
| **Base field naming** | a) camelCase en Prisma + `@map` a snake_case en DB b) **camelCase en ambos** (consistencia con schema actual) | b) La DB ya usa camelCase (ver migration.sql). `@map` agrega ceremonia sin beneficio. |
| **Audit recording** | a) Prisma middleware (automático, opaco — difícil de depurar, problemas transaccionales) b) **Application layer explícito** (cada use case llama `auditService.record()`) | b) Control explícito. El use case sabe QUÉ cambió y POR QUÉ antes de persistir. |
| **Soft-delete enforcement** | a) Prisma middleware (global — peligroso, olvidos en queries nuevas) b) **Repository filter** (cada método agrega `where: { deletedAt: null }`) c) BaseRepository abstracto (DRY pero premature) | b) Por ahora, filtro directo en `findByEmail` y `findById`. Si 3+ modelos necesitan soft-delete, se extrae un helper. |

## Data Flow

```
AppModule
  ├── SharedModule (@Global)
  │   ├── PrismaService ────────→ PostgreSQL (pool único)
  │   ├── AuditService ─────────→ audit_logs table
  │   └── ConfigurationService ─→ system_configurations (+ cache en memoria)
  │
  └── IdentityModule
      ├── AuthController
      ├── LoginUseCase ──→ AuditService.record() (fallos de login)
      └── PrismaUserRepository ──→ PrismaService (queries con deletedAt: null)

Otros módulos (futuro):
  └── LoansModule ──→ PrismaService (global, sin importar SharedModule)
```

## File Changes

| File | Acción | Descripción |
|------|--------|-------------|
| `apps/api/prisma/schema.prisma` | Create | Schema único central con campos base + `audit_logs` + `system_configurations` |
| `apps/api/prisma/seed.ts` | Create | Seed actualizado con campos base y `createdById: "system"` |
| `apps/api/prisma/migrations/` | Move | Migración existente movida desde `identity/infrastructure/persistence/prisma/migrations/` |
| `apps/api/src/shared/shared.module.ts` | Create | `@Global()` — provee y exporta PrismaService, AuditService, ConfigurationService |
| `apps/api/src/shared/prisma/prisma.service.ts` | Create | PrismaService con `OnModuleInit` + `OnApplicationShutdown`, adapter `PrismaPg` |
| `apps/api/src/shared/audit/audit.service.ts` | Create | `record(entityType, entityId, action, actorId, changes, sourceIp?)` + queries filtradas |
| `apps/api/src/shared/configuration/configuration.service.ts` | Create | Key-value store con cache en memoria e invalidación por escritura |
| `apps/api/prisma.config.ts` | Modify | `schema`, `migrations.path`, `seed.path` apuntan a `apps/api/prisma/` |
| `apps/api/src/app.module.ts` | Modify | Agregar `SharedModule` a imports |
| `apps/api/src/identity/identity.module.ts` | Modify | Remover `PrismaService` de providers y exports (viene de SharedModule) |
| `apps/api/src/identity/infrastructure/persistence/prisma-user.repository.ts` | Modify | `findByEmail` y `findById` agregan `deletedAt: null` al where |
| `apps/api/src/identity/infrastructure/persistence/prisma/prisma.service.ts` | Delete | Reemplazado por shared/prisma/prisma.service.ts |
| `apps/api/src/identity/infrastructure/persistence/prisma/schema.prisma` | Delete | Reemplazado por `apps/api/prisma/schema.prisma` |
| `apps/api/src/identity/infrastructure/persistence/prisma/seed.ts` | Delete | Reemplazado por `apps/api/prisma/seed.ts` |

## Interfaces / Contracts

### SharedModule (estructura)

```typescript
@Global()
@Module({
  providers: [
    PrismaService,
    AuditService,
    ConfigurationService,
  ],
  exports: [PrismaService, AuditService, ConfigurationService],
})
export class SharedModule {}
```

### AuditService

```typescript
@Injectable()
export class AuditService {
  record(params: {
    entityType: string;
    entityId: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    actorId: string;
    changes: Record<string, { from: unknown; to: unknown }>;
    sourceIp?: string;
  }): Promise<void>;

  find(filters: {
    entityType?: string;
    entityId?: string;
    actorId?: string;
    action?: string;
    from?: Date;
    to?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ rows: AuditLog[]; total: number }>;
}
```

### ConfigurationService

```typescript
@Injectable()
export class ConfigurationService {
  get<T = unknown>(key: string, defaultValue?: T): Promise<T>;
  // Lanza ConfigurationNotFoundError si no existe y no hay default

  set(key: string, value: unknown, description?: string, updatedById: string): Promise<void>;
  // Upsert por key + invalida cache en memoria
}
```

### PrismaUserRepository (cambio en queries)

```typescript
// findByEmail ahora excluye soft-delete:
const record = await this.prisma.user.findUnique({
  where: { email: email.getValue(), deletedAt: null },
  include: { role: true },
});

// findById igual:
const record = await this.prisma.user.findUnique({
  where: { id, deletedAt: null },
  include: { role: true },
});
```

## Testing Strategy

| Layer | Qué probar | Cómo |
|-------|-----------|------|
| Unit | AuditService.validateAction(), ConfigurationService cache invalidation | Mock PrismaService, testear lógica de negocio en aislamiento |
| Integration | PrismaService.connect/disconnect, SharedModule providers resolution | Test NestJS `Test.createTestingModule` con SharedModule real contra testcontainer o BD local |
| Integration | PrismaUserRepository.findByEmail con soft-delete (debe retornar null) | Seed un user soft-deleted, verificar que login lo rechaza |
| E2E | POST /api/auth/login con usuario soft-deleted → 401 | Request real contra app levantada con BD de test |

## Migration / Rollout

1. **Mover directorio**: `mv apps/api/src/identity/infrastructure/persistence/prisma apps/api/prisma/` (todo: schema, migrations, seed)
2. **Crear SharedModule + nuevo PrismaService** en `apps/api/src/shared/`
3. **Actualizar `prisma.config.ts`** con nuevas rutas
4. **Generar migración nueva**: `pnpm --filter @prestamos/api exec prisma migrate dev --name add-base-fields`
   - Agrega `organizationId?`, `deletedAt?`, `deletedById?`, `version`, `createdById?`, `updatedById?` a User, Role, FailedLoginAttempt
   - Crea `audit_logs` y `system_configurations`
5. **Seed** se ejecuta con `createdById: "system"`
6. **Rollback**: Si migración falla → restaurar directorio prisma/ + revertir `prisma.config.ts` + `git revert` commits

**Riesgo**: La columna `version` defaultValue=1 no afecta registros existentes (se llena con 1 automáticamente). `organizationId` nullable no rompe queries existentes. Rollback es seguro.
