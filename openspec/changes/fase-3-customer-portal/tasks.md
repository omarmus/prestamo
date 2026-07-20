# Tasks: Fase 3 — Customer Portal Core + Clientes

## Review Workload Forecast

~3104 líneas implementadas (commit `44fb8ce`). Faltan tests, stories, y extracción de componentes inline.
Decision needed before apply: No. Chained PRs: Yes (stacked-to-main).

**PR 1** — Schema + módulo Customers Base: ✅ COMPLETO.
**PR 2** — Backend CRUD: ✅ 29 handlers en 9 sub-dominios. Tests unitarios cubriendo entity, VO, guard, y 5 handlers.
**PR 3** — Frontend Portal: ✅ 7 componentes extraídos + 7 stories + 4 suites de test (16 tests).

---

## PR 1 — Schema + Módulo Customers Base

### Phase 1: Schema + Migración

- [x] 1.1 10 modelos en `schema.prisma` con sus relaciones: Customer → (CustomerAddress[], CustomerPhone[], CustomerEmail[], CustomerEmployment?, CustomerIncome[], CustomerBankAccount[], CustomerDocument[], LoanSimulation[], PortalAction[]). User→Customer 1:1.
- [x] 1.2 `prisma migrate dev --name add_customer_tables` desde apps/api.
- [x] 1.3 Verificar: `prisma migrate status` — database schema is up to date.

### Phase 2: Customer Domain + Infrastructure

- [x] 2.1 `customers/domain/customer.entity.ts` — Customer aggregate: id, userId, personal data, status, kycStatus, createFromUser factory.
- [x] 2.2 `customers/domain/customer.repository.ts` — port interface: findByUserId, save, update.
- [x] 2.3 `customers/domain/errors/customer.errors.ts` — CustomerAlreadyExistsError + CustomerNotFoundError. ✅
- [x] 2.4 `customers/domain/value-objects/document-number.vo.ts` — implementado.
- [x] 2.5 `customers/infrastructure/persistence/prisma-customer.repository.ts` — implements CustomerRepository.
- [x] 2.6 `customers/infrastructure/storage/local-document-storage.ts` — implementado.
- [x] 2.7 `customers/presentation/guards/customer.guard.ts` — CustomerGuard funcional.

### Phase 3: Module Wiring

- [x] 3.1 `customers.module.ts` — providers: CUSTOMER_REPOSITORY, CUSTOMER_CREATOR. Export CustomerGuard.
- [x] 3.2 Wire en `app.module.ts`.

### Phase 4: Tests

- [x] 4.1 Unit: Customer entity creation, DocumentNumber VO valid/invalid. ✅ Hecho.
- [x] 4.2 Unit: CustomerGuard — lookup success, 404. ✅ Hecho (PrismaRepository no tiene mock — depende de PrismaService en integración).
- [x] 4.3 Unit: CustomerGuard — lookup success, 404. ✅ Hecho.
- [x] Verify: `pnpm lint` (0 errors), `pnpm type-check` (pass), `pnpm build` (pass). ✅

---

## PR 2 — Backend CRUD + Documents + Simulator + Register Hook

### Phase 1: Sub-Entity Application Ports + Zod Schemas

- [x] 1.1 `packages/shared/src/schemas/customer.schema.ts` — Zod schemas completos.
- [x] 1.2 `packages/shared/src/types/customer.types.ts` — CustomerResponse, etc.
- [x] 1.3 Re-exportar en `packages/shared/src/index.ts`.
- [x] 1.4 `customers/application/ports/customer-query.port.ts` — implementado.
- [x] 1.5 `customers/application/ports/document-storage.port.ts` — implementado.

### Phase 2: Application Handlers (Commands + Queries)

- [x] 2.1 `customer-register.handler.ts` + `customer-creator.port.ts` — crear Customer desde register (implementado como `CustomerRegisterHandler`).
- [x] 2.2-2.9 Implementados como 29 handlers separados en subdirectorios por sub-dominio.
- [x] 2.10 `upload-document.handler.ts` — implementado.
- [x] 2.11 `loan-calculator.ts` — cálculo francés implementado como utilidad separada.
- [x] 2.12 `track-action.handler.ts` — implementado.

### Phase 3: Presentation — Customers Controller

- [x] 3.1 Controladores implementados (split en 3 archivos):
  - `customer-profile.controller.ts` — todos los endpoints de perfil (addresses, phones, emails, employment, incomes, bank-accounts).
  - `customer-document.controller.ts` — upload, list, download, delete documentos.
  - `customer-simulation.controller.ts` — simulate + list simulations.
  - ✅ `POST /api/customers/me/actions` (track-action) implementado.
- [x] 3.2 DTOs — usa ZodValidationPipe + schemas de shared en línea (ponytail: sin archivos DTO separados).
- [x] 3.3 `customers.module.ts` actualizado con controllers.

### Phase 4: Register Hook — Auto-Create Customer

- [x] 4.1 `customer-register.handler.ts` — crea Customer vía `CustomerRegisterHandler` después de crear User.
- [x] 4.2 CustomerRepository inyectado como `CUSTOMER_CREATOR` token.
- [x] 4.3 `Customer.createFromUser(user)` factory static implementada.

### Phase 5: Tests

- [x] 5.1 `customer.entity.spec.ts` — aggregate invariants (create, createFromUser, reconstitute).
- [x] 5.2 `document-number.vo.spec.ts` — valid/invalid formats, equality.
- [x] 5.3 `customer.guard.spec.ts` — with mocked CustomerRepository.
- [x] 5.4 `update-profile.handler.spec.ts` — update fields, customer not found.
- [x] 5.5 `create-address.handler.spec.ts` — create address, customer not found.
- [x] 5.6 `create-simulation.handler.spec.ts` — create simulation with calculator, customer not found.
- [x] 5.7 `upload-document.handler.spec.ts` — create document, customer not found.
- [x] 5.8 `track-action.handler.spec.ts` — create portal action, customer not found.
- [x] Verify: `pnpm lint` (0 errors), `pnpm type-check` (pass), `pnpm build` (pass), `pnpm test` (122/130 pass; 8 integration tests saltan sin DB). ✅

---

## PR 3 — Frontend Portal

### Phase 0: Install 6 shadcn/ui components

- [x] 0.1 `npx shadcn@latest add table`
- [x] 0.2 `npx shadcn@latest add tabs`
- [x] 0.3 `npx shadcn@latest add sheet`
- [x] 0.4 `npx shadcn@latest add dropdown-menu`
- [x] 0.5 `npx shadcn@latest add progress`
- [x] 0.6 `npx shadcn@latest add skeleton`
- [x] +separator, sonner, textarea (adicionales)

### Phase 1: Portal Layout + API Client + Hooks

- [x] 1.1 `features/portal/components/portal-sidebar.tsx` — sidebar extraída del layout con Avatar + nav + logout + mobile nav.
- [x] 1.2 `app/portal/layout.tsx` — layout protegido con sidebar + header.
- [x] 1.3 `app/portal/page.tsx` — redirect a `/portal/dashboard`.
- [x] 1.4 `lib/api-client.ts` — fetch wrappers (nombre distinto al spec: `api-client.ts` vs `api/customer.ts`).
- [x] 1.5 `features/portal/hooks/use-customer.ts` — hook `useCustomer()` + `useUpdateCustomer()`.
- [x] 1.6 `features/portal/hooks/use-documents.ts` — hook `useDocuments()`.
- [x] 1.7 `features/portal/hooks/use-simulator.ts` — hook `useSimulator()`.

### Phase 2: Dashboard Page

- [x] 2.1 `app/portal/dashboard/page.tsx` — implementado (116 líneas).

### Phase 3: Profile Page

- [x] 3.1 `features/portal/components/customer-form.tsx` — formulario extraído incluyendo SubEntitySection reutilizable para addresses/phones/emails/bank-accounts.
- [x] 3.2 `app/portal/profile/page.tsx` — renderiza CustomerForm (~23 líneas).

### Phase 4: Documents Page

- [x] 4.1 `features/portal/components/document-list.tsx` — tabla con badges de estado, skeleton loading, estado vacío.
- [x] 4.2 `features/portal/components/document-uploader.tsx` — upload con FileReader + base64 + type selector.
- [x] 4.3 `app/portal/documents/page.tsx` — renderiza DocumentUploader + DocumentList (~24 líneas).

### Phase 5: Simulator Page

- [x] 5.1 `features/portal/components/simulator-form.tsx` — form con amount/term/rate inputs + Simular button.
- [x] 5.2 `features/portal/components/amortization-table.tsx` — summary cards + amortization table + pagination (12 rows) + Tabs (Tabla/Resumen) + Progress bar.
- [x] 5.3 `features/portal/components/simulation-history.tsx` — acordeón "Simulaciones Anteriores" con últimas 5, click rellena formulario.
- [x] 5.4 `app/portal/simulator/page.tsx` — renderiza los 3 componentes (~86 líneas).

### Phase 6: Tests + Stories

- [x] 6.1 **Stories** ✅ — 7 stories para portal:
  - PortalSidebar (Default, ActiveProfile, Mobile)
  - SimulatorForm (Default, Loading, WithInitialValues)
  - AmortizationTable (Default, LongerSchedule)
  - DocumentList (Default, Loading, Empty, Error)
  - DocumentUploader (Default)
  - SimulationHistory (Default, Loading, Empty)
  - CustomerForm (Default, WithFullProfile)
- [x] 6.2-6.5 **Tests** ✅ — 4 suites, 16 tests:
  - simulator-form.test.tsx (4 tests) — renders, calls onSimulate, loading, initialValues sync
  - document-list.test.tsx (4 tests) — loading, error, empty, data
  - simulation-history.test.tsx (5 tests) — loading, empty, expand, onSelect
  - portal-sidebar.test.tsx (3 tests) — user info, active nav, nav links
- [x] Verify: `pnpm build` (pass), `pnpm type-check` (pass), `pnpm test` (26/26 frontend, 122/130 backend). ✅
