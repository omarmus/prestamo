# Tasks: Fase 1 — Fundación

## Review Workload Forecast

| Metric | Value |
|--------|-------|
| **Estimated lines changed** | ~550 (new) + ~160 (moved) |
| **Lines within 1500 budget?** | Sí — ~710 de 1500 (47%) |
| **Chained PRs recommended?** | No |
| **Decision needed before apply** | `organization_id` nullable validation — ver spec `database-foundation` §Base Fields |
| **Chain strategy** | N/A |
| **400-line budget risk** | Ninguno — cada fase individual está bajo 400. El bloque más grande (~250 líneas) es Phase 2 (schema + migration). |

---

## Phase 1: Schema + SharedModule

**Dependency**: Ninguna (arranca desde Phase 0 existente)

### 1.1 Mover directorio Prisma ✅

Mover `apps/api/src/identity/infrastructure/persistence/prisma/` → `apps/api/prisma/` completo (schema, migrations, seed). Sin cambios de contenido en este paso.

- **Paths**: `apps/api/prisma/schema.prisma`, `apps/api/prisma/migrations/`, `apps/api/prisma/seed.ts`
- **Verificar**: `pnpm --filter @prestamos/api exec prisma generate` funciona desde nueva ruta

### 1.2 Actualizar prisma.config.ts ✅

- **Path**: `apps/api/prisma.config.ts`
- **Cambio**: `schema` → `prisma/schema.prisma`, `migrations.path` → `prisma/migrations`, `seed` → `prisma/seed.ts`
- **Verificar**: `pnpm --filter @prestamos/api exec prisma format` pasa

### 1.3 Crear SharedModule + PrismaService global ✅

- **Paths**: `apps/api/src/shared/shared.module.ts` (`@Global()`), `apps/api/src/shared/prisma/prisma.service.ts`
- **PrismaService**: Copiar impl existente + agregar `OnApplicationShutdown` con `$disconnect()`
- **Verificar**: `pnpm type-check` compila sin errores

### 1.4 Conectar SharedModule en AppModule ✅

- **Path**: `apps/api/src/app.module.ts`
- **Cambio**: Importar `SharedModule` en imports
- **Path**: `apps/api/src/identity/identity.module.ts`
- **Cambio**: Remover `PrismaService` de `providers` y `exports` (viene de SharedModule)
- **Verificar**: `pnpm build` exitoso

### 1.5 Eliminar archivos old Prisma en identity ✅

- **Paths a eliminar**: `prisma.service.ts` (old), `schema.prisma` (old), `seed.ts` (old) bajo `identity/infrastructure/persistence/prisma/`
- **Verificar**: No quedan referencias a rutas old en imports

---

## Phase 2: Campos base + nuevas tablas

**Dependency**: Phase 1 (schema en nueva ubicación)

### 2.1 Agregar campos base a schema ✅

- **Path**: `apps/api/prisma/schema.prisma`
- **Modelos a modificar**: `User`, `Role`, `FailedLoginAttempt`
- **Campos**: `organizationId` (nullable), `deletedAt` (nullable), `deletedById` (nullable), `version` (Int @default(1)), `createdById`, `updatedById`
- **Relaciones**: `createdBy` → User?, `updatedBy` → User?, `deletedBy` → User?
- **Verificar**: `prisma validate` pasa

### 2.2 Agregar modelo audit_logs ✅

- **Path**: `apps/api/prisma/schema.prisma`
- **Campos**: `id` (autoincrement), `entityType`, `entityId`, `action` (String), `actorId`, `changes` (Json), `sourceIp`?, `createdAt`
- **Verificar**: Modelo compila en `prisma generate`

### 2.3 Agregar modelo system_configurations ✅

- **Path**: `apps/api/prisma/schema.prisma`
- **Campos**: `key` (@id String), `value` (Json), `description`?, `updatedById`, `updatedAt`
- **Relación**: `updatedBy` → User?
- **Verificar**: Modelo compila en `prisma generate`

### 2.4 Generar migración ✅

- **Comando**: `pnpm --filter @prestamos/api exec prisma migrate dev --name add-base-fields`
- **Verificar**: Migración aplica en DB local, `prisma generate` regenera cliente

---

## Phase 3: Servicios + soft-delete + seed

**Dependency**: Phase 2 (modelos existen)

### 3.1 Crear AuditService ✅

- **Paths**: `apps/api/src/shared/audit/audit.service.ts`
- **Métodos**: `record()` y `find()` (filtros + paginación), exportar desde SharedModule
- **Verificar**: Servicio injectable desde cualquier módulo

### 3.2 Crear ConfigurationService ✅

- **Paths**: `apps/api/src/shared/configuration/configuration.service.ts`, `configuration-not-found.error.ts`
- **Métodos**: `get<T>()` con default opcional (lanza `ConfigurationNotFoundError` si falta), `set()` con upsert + invalidación de cache en memoria
- **Verificar**: `get` con key inexistente sin default lanza error

### 3.3 Actualizar PrismaUserRepository ✅

- **Path**: `apps/api/src/identity/infrastructure/persistence/prisma-user.repository.ts`
- **Cambio**: `findByEmail` y `findById` agregan `deletedAt: null` al where; usa `findFirst` (en vez de `findUnique`) porque `deletedAt` no es unique
- **Verificar**: Import corregido a `shared/prisma/prisma.service`

### 3.4 Actualizar seed ✅

- **Path**: `apps/api/prisma/seed.ts`
- **Cambio**: Seed actualizado con posición (misma ruta). `createdById`/`updatedById` se omiten (null) en seed bootstrap por FK constraints — se llenan en operaciones reales con auth context
- **Verificar**: `pnpm --filter @prestamos/api seed` ejecuta sin errores

---

## Phase 4: Testing

**Dependency**: Phase 3 (código implementado)

### 4.1 Unit tests — AuditService ✅

- **Path**: `apps/api/src/shared/audit/audit.service.spec.ts`
- **Casos**: record inserta row, validateAction rechaza action inválida, include sourceIp cuando se provee, find con paginación, find con date range

### 4.2 Unit tests — ConfigurationService ✅

- **Path**: `apps/api/src/shared/configuration/configuration.service.spec.ts`
- **Casos**: get retorna valor cuando key existe, get con default retorna default si key no existe, get sin default lanza ConfigurationNotFoundError, cache tras primera lectura, set upserts valor, set invalida cache

### 4.3 Integration — PrismaUserRepository soft-delete ✅

- **Path**: `apps/api/test/integration/identity/prisma-user.repository.spec.ts`
- **Casos nuevos**: findByEmail con usuario soft-deleted retorna null, findById con usuario soft-deleted retorna null

### 4.4 E2E — Auth soft-delete ✅

- **Path**: `apps/api/test/e2e/auth.e2e-spec.ts`
- **Casos nuevos**: Login con usuario soft-deleted → 401, re-registro de email soft-deleted → 201

### 4.5 Verify build ✅

- **Comando**: `pnpm lint && pnpm type-check && pnpm build && pnpm test`
- **Check**: Todo pasa limpio (lint 0 warnings, type-check ok, build ok, 54 tests pass). Migración `20260717035731_add_base_fields` en `prisma/migrations/`
