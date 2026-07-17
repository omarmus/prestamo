# Proposal: Fase 3 — Customer Portal Core + Clientes

## Intent

El MVP post-WhatsApp necesita un portal web donde los clientes gestionen su perfil, documentos y vean su estado financiero. Sin esto, el onboarding termina en WhatsApp sin continuidad web. Segundo eje del MVP: el módulo Customers unifica datos del cliente hoy dispersos en identity + whatsapp.

## Scope

### In Scope
- Módulo Customers (NestJS, Clean Architecture, 10 tablas Prisma)
- Portal frontend protegido: /portal/dashboard, /portal/profile, /portal/documents, /portal/simulator
- CRUD de datos personales, documentos, empleo, ingresos, cuentas bancarias
- Simulador de préstamos (loan_simulations)
- Zod schemas compartidos en packages/shared
- shadcn/ui: Table, Tabs, Sheet, DropdownMenu, Progress, Skeleton, Sonner

### Out of Scope
- Admin backoffice para gestionar clientes
- Préstamos activos, desembolsos, pagos
- Subida real de documentos a S3 (local file system MVP)
- Documentos legales / firmas electrónicas

## Capabilities

### New Capabilities
- `customer-management`: CRUD completo del cliente y sus datos asociados
- `customer-portal`: Layout protegido + navegación del portal del cliente
- `document-upload`: Subida y listado de documentos del cliente
- `loan-simulator`: Simulación de préstamos con cálculo de cuotas

### Modified Capabilities
- `user-auth`: Al crear un user (register), crear Customer 1:1 automáticamente

## Approach

1. **Backend** — Clonar patrón del módulo `identity`: `customers/` con domain (entity, repository port, value objects), application (commands + handlers), infrastructure (PrismaRepo), presentation (controller + DTOs). Relación User→Customer 1:1 agregada en `schema.prisma`.
2. **Frontend** — `app/portal/layout.tsx` con AuthProvider y sidebar navigation. `features/portal/` con hooks (useCustomer, useDocuments, useSimulator) + componentes. Las rutas del portal son lazy-loaded.
3. **Shared** — Schemas Zod de Customer, Document, Simulation en `packages/shared/src/schemas/`.
4. **shadcn/ui** — Agregar vía CLI los componentes necesarios desde `apps/web/`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `apps/api/prisma/schema.prisma` | Modified | +10 tablas, User→Customer 1:1 |
| `apps/api/src/customers/` | New | Módulo Clean Architecture completo |
| `apps/api/src/identity/application/register/` | Modified | Crear Customer al registrar User |
| `apps/web/app/portal/` | New | 4 rutas protegidas |
| `apps/web/features/portal/` | New | Hooks + componentes del portal |
| `apps/web/components/atoms/ui/` | Modified | +6 componentes shadcn/ui |
| `apps/web/providers/auth-provider.tsx` | Modified | Redirect a portal si hay Customer |
| `packages/shared/src/` | Modified | +3 schemas Zod |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Users sin Customer tras migración | High | Seed script + hook en AuthProvider que crea Customer on first login |
| Upload documentos (multipart) sin soporte NestJS | Med | Usar `multer` de NestJS + almacenar como buffer/base64 en DB (ponytail: S3 después) |
| Schema size crece 10 tablas en un cambio | Med | Migración reversible con `prisma migrate dev --create-only` |

## Rollback Plan

- `prisma migrate down` revierte las 10 tablas
- Feature flag `FF_PORTAL` en `app/portal/layout.tsx` — desactivar deja las rutas inertes
- En código: el cambio en register handler es aditivo (no rompe sin Customer)

## Dependencies

Ninguna externa. Todo el stack necesario ya está instalado (NestJS, Prisma, shadcn/ui CLI).

## Success Criteria

- [ ] 10 tablas Prisma creadas + migración aplicada en desarrollo
- [ ] CRUD Customers desde API con tests (POST, GET, PUT)
- [ ] 4 rutas del portal renderizan con layout protegido
- [ ] Simulador calcula cuota fija y amortización
- [ ] Todos los tests existentes siguen pasando (95+)
- [ ] Schemas Zod compilados y consumidos desde web y api
