# Proposal: Admin Backoffice

## Intent

El backoffice admin actual solo tiene páginas sueltas de préstamos (`/admin/loans/*`) sin navegación entre secciones. Staff interno no puede ver customers, dejar notas internas, ni gestionar otros admins. Este cambio construye la infraestructura de backoffice: layout con sidebar, dashboard con métricas, browser de customers, notas internas, y gestión de usuarios admin.

## Scope

### In Scope
- Admin layout con sidebar (mismo patrón que portal layout)
- Dashboard con métricas clave (total loans, total disbursed, pending apps, active loans)
- Backend `GET /api/admin/stats` (lightweight, count queries)
- Customer browser: `GET /api/admin/customers` (search + pagination) + `GET /api/admin/customers/:id` (full detail)
- Frontend: admin customers list + detail pages
- Modelo `AdminNote` en Prisma + backend CRUD + frontend UI en customer detail
- Admin user management: `GET /api/admin/users` + `POST /api/admin/users` (crear admin)
- Frontend: admin users list + create page

### Out of Scope
- WhatsApp conversations viewer (depende de webhook — Fase 2)
- Loan product CRUD (requiere modelo de producto)
- System configuration UI
- Audit log viewer
- Charts/gráficas avanzadas

## Capabilities

### New Capabilities
- `admin-dashboard`: Endpoint de métricas + dashboard page con indicadores clave
- `customer-browser`: Búsqueda y detalle de customers desde admin
- `admin-notes`: Modelo AdminNote + CRUD backend + UI de notas en customer detail
- `admin-user-management`: Listar y crear usuarios admin

### Modified Capabilities
- `customer-management`: Agregar endpoints de lectura admin (`GET /api/admin/customers`, `GET /api/admin/customers/:id`)
- `user-auth`: Agregar `POST /api/admin/users` para crear admins (rol ADMIN)

## Approach

1. **Backend**: Módulo `BackofficeModule` en `apps/api/src/backoffice/` (Clean Architecture — domain/application/infrastructure/presentation). Reusa `PrismaService`, `AdminGuard`, `JwtAuthGuard`.
2. **AdminNote Prisma**: modelo nuevo (additive migration) — `id`, `customerId`, `authorId` (User), `content`, `createdAt`, `updatedAt`.
3. **Stats endpoint**: 4 count queries parallelizadas (`Promise.all`) — sin joins pesados.
4. **Frontend**: `apps/web/app/admin/layout.tsx` con sidebar + mobile nav (mismo patrón que portal). Páginas nuevas en `features/admin/` con hooks dedicados.
5. **Sin cambios a flujos existentes**: todo es aditivo.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `apps/api/prisma/schema.prisma` | **Modified** | +model `AdminNote` |
| `apps/api/src/backoffice/` | **New** | Módulo NestJS (stats, customers, users, notes) |
| `apps/api/src/backoffice/application/ports/` | **New** | Query ports: `StatsQuery`, `CustomerAdminQuery`, `AdminUserQuery` |
| `apps/api/src/app.module.ts` | **Modified** | Importar `BackofficeModule` |
| `apps/api/src/loans/presentation/admin.guard.ts` | **Modified** | Mover a shared o re-exportar para backoffice |
| `packages/shared/src/types/` | **Modified** | +`AdminStatsResponse`, +`AdminCustomerListItem`, +`AdminCustomerDetail`, +`AdminUserListItem` |
| `packages/shared/src/schemas/` | **Modified** | +Zod schemas para customer search, admin user create |
| `apps/web/app/admin/layout.tsx` | **New** | Sidebar + mobile nav + auth guard |
| `apps/web/app/admin/page.tsx` | **New** | Dashboard page con métricas |
| `apps/web/app/admin/customers/` | **New** | List + detail pages |
| `apps/web/app/admin/users/` | **New** | List + create pages |
| `apps/web/features/admin/hooks/` | **Modified** | +`useAdminDashboard`, +`useAdminCustomers`, +`useAdminUsers`, +`useAdminNotes` |
| `apps/web/features/admin/components/` | **Modified** | +`AdminSidebar`, +`AdminStatsCard`, +`AdminCustomerTable`, +`AdminCustomerDetail`, +`AdminUserTable`, +`AdminNoteForm` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Dashboard query performance | Bajo | 4 count queries en paralelo, cada una con índices existentes |
| Customer search sin índice de búsqueda | Med | Usar `contains` + `mode: insensitive` con paginación — aceptado para MVP |
| AdminNotes sin soft-delete | Bajo | Modelo sin `deletedAt` — notas internas, cascade delete con customer |

## Rollback Plan

- `prisma migrate down` para AdminNote (o simplemente no usar el modelo nuevo)
- Remover `BackofficeModule` de `app.module.ts`
- Eliminar archivos de frontend nuevos en `apps/web/app/admin/{customers,users}/`
- Todo es aditivo — no hay cambios a flujos existentes

## Dependencies

- Ninguna externa. Stack completo: NestJS, Prisma, Next.js, shadcn/ui, Zod.

## Success Criteria

- [ ] `/admin` renderiza dashboard con 4+ métricas reales desde DB
- [ ] `/admin/customers` lista customers con search + paginación
- [ ] `/admin/customers/:id` muestra detalle completo + notas internas
- [ ] Staff puede crear y ver notas en un customer
- [ ] `/admin/users` lista admins + permite crear nuevo admin
- [ ] Sidebar navega entre loans/dashboard/customers/users
- [ ] Todas las rutas admin protegidas por `AdminGuard`
- [ ] Migración Prisma additive — rollback sin pérdida de datos
