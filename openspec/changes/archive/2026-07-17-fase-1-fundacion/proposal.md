# Proposal: Fase 1 — Fundación: Base de Datos & Plataforma

## Intent

Prerrequisito de TODO el roadmap. El schema Prisma está dentro de `identity/`, bloqueando a los demás módulos (WhatsApp, Portal, Loans) de tener sus propios modelos. Sin SharedModule global, cada módulo crearía conexiones duplicadas sin transacciones cross-módulo. Sin campos base ni auditoría, operaciones financieras no tienen trazabilidad.

## Scope

### In Scope
- Schema movido a `apps/api/prisma/schema.prisma` (incluyendo migrations)
- SharedModule @Global() con PrismaService singleton
- Campos base en todos los modelos: `organization_id?`, `deleted_at?`, `deleted_by?`, `version` (optimistic lock), `created_by`, `updated_by`
- Tabla `audit_logs` para trazabilidad centralizada de cambios
- Tabla `system_configurations` (key-value para feature flags)
- PrismaUserRepository actualizado para filtrar soft-delete
- Seed actualizado con campos base

### Out of Scope
- Módulo Organizations (`organization_id` nullable hasta Fase 2)
- Middleware de Prisma para audit logs (tabla aparte, control explícito desde application layer)
- Migración a snake_case (se mantiene camelCase — consistencia)
- BaseEntity compartida en dominio (entidades no se acoplan a infraestructura)

## Capabilities

### New Capabilities
- `database-foundation`: schema compartido, PrismaService global, campos base para todos los modelos
- `audit-logging`: tabla centralizada que registra actor, acción, entidad, y diff de cada cambio
- `system-configuration`: almacén key-value en DB para configuración dinámica sin redeploy

### Modified Capabilities
- `user-auth`: soft-delete en User afecta login, registro y perfil — `findByEmail` y `findById` deben excluir registros con `deleted_at IS NOT NULL`

## Approach

Schema se mueve de `identity/infrastructure/persistence/prisma/` a `apps/api/prisma/`. SharedModule se crea en `apps/api/src/shared/` con `@Global()` — su `PrismaService` usa el adapter `PrismaPg` (misma impl existente, relocalizada). Campos base se agregan vía migration estándar. `audit_logs` como tabla plana insertada desde casos de uso (no middleware, no magia). `system_configurations` para config sin archivos. Seed refleja nuevos campos.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `apps/api/prisma/` | New | Schema compartido + migrations + seed |
| `apps/api/src/shared/` | New | SharedModule @Global() + PrismaService |
| `apps/api/src/identity/` | Modified | PrismaUserRepository filtra soft-delete; schema movido |
| `apps/api/prisma.config.ts` | Modified | Apunta a nuevo schema path |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Mover schema rompe migraciones existentes | Med | Mover TODO el directorio `prisma/` (schema + migrations + seed) |
| Soft-delete en PrismaUserRepository causa datos huérfanos si se omite en una query | Med | Auditoría de todas las queries del repositorio; tests en verify |
| `organization_id` nullable posterga deuda técnica | Low | Aceptado — se vuelve NOT NULL cuando exista módulo Organizations |

## Rollback Plan

1. Revertir schema a `apps/api/src/identity/infrastructure/persistence/prisma/schema.prisma`
2. Revertir SharedModule y volver PrismaService a IdentityModule
3. `prisma migrate down` revierte migración de campos base + nuevas tablas
4. `git revert <commits>` — cambio encapsulado en commits atómicos

## Dependencies

- Ninguna externa. Prisma, NestJS, PostgreSQL ya instalados en Phase 0.

## Success Criteria

- [ ] `prisma generate` funciona desde `apps/api/prisma/schema.prisma`
- [ ] SharedModule exporta PrismaService y es injectable en cualquier módulo
- [ ] Migración aplica campos base, `audit_logs` y `system_configurations` sin errores
- [ ] Seed ejecuta correctamente con nuevos campos
- [ ] Login rechaza usuarios soft-deleted (devuelve 401)
- [ ] `pnpm lint && pnpm type-check && pnpm build` pasan limpios
