# Tasks: Fase 3 — Customer Portal Core + Clientes

## Review Workload Forecast

~1800-2500 líneas. Decision needed before apply: No. Chained PRs: Yes. Chain: stacked-to-main. Budget risk: High.

3 PRs: Schema+Módulo Base → Backend CRUD completo → Frontend Portal. Todos a main.

**PR 1** (~400-500 líneas): Schema + módulo Customers skeleton (entity, repo, guard, module).
**PR 2** (~600-800 líneas): All backend CRUD (customer profile, sub-entities, documents, simulator, register integration, shared schemas, tests).
**PR 3** (~800-1000 líneas): Frontend portal pages (layout, dashboard, profile, documents, simulator, hooks, 6 shadcn/ui components).

## PR 1 — Schema + Módulo Customers Base

### Phase 1: Schema + Migración

- [ ] 1.1 10 modelos en `schema.prisma` con sus relaciones: Customer → (CustomerAddress[], CustomerPhone[], CustomerEmail[], CustomerEmployment?, CustomerIncome[], CustomerBankAccount[], CustomerDocument[], LoanSimulation[], PortalAction[]). User→Customer 1:1.
- [ ] 1.2 `prisma migrate dev --name add_customer_tables` desde apps/api.
- [ ] 1.3 Verificar: `prisma migrate status` — database schema is up to date.

### Phase 2: Customer Domain + Infrastructure

- [ ] 2.1 `customers/domain/customer.entity.ts` — Customer aggregate: id, userId, personal data (firstName, lastName, document, etc.), status, kycStatus, createdAt/updatedAt.
- [ ] 2.2 `customers/domain/customer.repository.ts` — port interface: findByUserId, save, update.
- [ ] 2.3 `customers/domain/errors/customer.errors.ts` — CustomerNotFoundError, CustomerAlreadyExistsError.
- [ ] 2.4 `customers/domain/value-objects/document-number.vo.ts` — validación CI boliviano (opcional, solo formato básico).
- [ ] 2.5 `customers/infrastructure/persistence/prisma-customer.repository.ts` — implements CustomerRepository, incluye mapper. Usa PrismaService de SharedModule.
- [ ] 2.6 `customers/infrastructure/storage/local-document-storage.ts` — implementa DocumentStoragePort: base64 en DB (ponytail: S3 post-MVP).
- [ ] 2.7 `customers/presentation/guards/customer.guard.ts` — CustomerGuard: lee userId del JWT payload, busca Customer en DB, lo adjunta a `request.customer`. Cache por request. Si no existe → 404.

### Phase 3: Module Wiring

- [ ] 3.1 `customers.module.ts` — providers con tokens: CUSTOMER_REPOSITORY, DOCUMENT_STORAGE. Import SharedModule (PrismaService). Export CustomerGuard.
- [ ] 3.2 Wire en `app.module.ts` + export si es necesario.

### Phase 4: Tests

- [ ] 4.1 Unit: Customer entity creation, DocumentNumber VO valid/invalid.
- [ ] 4.2 Unit: PrismaCustomerRepository — save, findByUserId, update.
- [ ] 4.3 Unit: CustomerGuard — lookup success, 404 when no customer, cache per request.
- [ ] Verify: `pnpm lint`, `pnpm type-check`, `pnpm build` — all pass.

## PR 2 — Backend CRUD + Documents + Simulator + Register Hook

### Phase 1: Sub-Entity Application Ports + Zod Schemas

- [ ] 1.1 `packages/shared/src/schemas/customer.schema.ts` — Zod schemas:
  - `CustomerUpdateSchema` (firstName, middleName, lastName, etc. — todos opcionales)
  - `AddressSchema`, `PhoneSchema`, `EmailSchema`
  - `EmploymentSchema`, `IncomeSchema`, `BankAccountSchema`
  - `DocumentSchema` (type enum, notes opcional)
  - `SimulateLoanSchema` (amount positive, termMonths int 1-60, annualRate 0-50)
  - `PortalActionSchema` (action string, metadata Json opcional)
- [ ] 1.2 `packages/shared/src/types/customer.types.ts` — CustomerResponse, AddressResponse, etc.
- [ ] 1.3 Re-exportar en `packages/shared/src/index.ts`.
- [ ] 1.4 `customers/application/ports/customer-query.port.ts` — interfaz para queries complejas (getFullProfile).
- [ ] 1.5 `customers/application/ports/document-storage.port.ts` — interfaz: save(file)→id, get(id)→content.

### Phase 2: Application Handlers (Commands + Queries)

- [ ] 2.1 `create-customer.command.ts` + `create-customer.handler.ts` — crear desde register (userId, firstName, phone inicial).
- [ ] 2.2 `update-customer.command.ts` + `update-customer.handler.ts` — actualizar perfil, solo document si está vacío.
- [ ] 2.3 `get-customer.query.ts` — query para obtener perfil completo con sub-entities.
- [ ] 2.4 `manage-address/` — add-address.handler, delete-address.handler, set-primary.handler.
- [ ] 2.5 `manage-phone/` — add-phone.handler, delete-phone.handler.
- [ ] 2.6 `manage-email/` — add-email.handler, delete-email.handler.
- [ ] 2.7 `manage-employment/` — upsert-employment.handler.
- [ ] 2.8 `manage-income/` — add-income.handler, delete-income.handler.
- [ ] 2.9 `manage-bank-account/` — add-bank-account.handler, delete-bank-account.handler.
- [ ] 2.10 `upload-document.command.ts` + `upload-document.handler.ts` — multipart → base64 → DB persist. Límite 5MB.
- [ ] 2.11 `simulate-loan.command.ts` + `simulate-loan.handler.ts` — cálculo francés + persist + schedule.
- [ ] 2.12 `track-action.command.ts` + `track-action.handler.ts` — insert-only portal action.

### Phase 3: Presentation — Customers Controller

- [ ] 3.1 `customers.controller.ts`:
  - `GET /api/customers/me` — perfil completo (200/404)
  - `PUT /api/customers/me` — actualizar perfil (200)
  - `POST /api/customers/me/addresses` — crear dirección (201)
  - `DELETE /api/customers/me/addresses/:id` — eliminar dirección (204)
  - `POST /api/customers/me/phones` — crear teléfono (201)
  - `DELETE /api/customers/me/phones/:id` — eliminar teléfono (204)
  - `POST /api/customers/me/emails` — crear email (201)
  - `DELETE /api/customers/me/emails/:id` — eliminar email (204)
  - `PUT /api/customers/me/employment` — upsert empleo (200)
  - `POST /api/customers/me/incomes` — crear ingreso (201)
  - `DELETE /api/customers/me/incomes/:id` — eliminar ingreso (204)
  - `POST /api/customers/me/bank-accounts` — crear cuenta bancaria (201)
  - `DELETE /api/customers/me/bank-accounts/:id` — eliminar cuenta (204)
  - `POST /api/customers/me/documents` — subir documento multipart (201, max 5MB)
  - `GET /api/customers/me/documents` — listar documentos (200, filter `?type=`)
  - `GET /api/customers/me/documents/:id` — descargar documento con content (200, 404)
  - `DELETE /api/customers/me/documents/:id` — eliminar documento (204, 404)
  - `POST /api/customers/me/simulate` — simular préstamo (201, schedule incluido)
  - `GET /api/customers/me/simulations` — historial simulaciones (200, sin schedule)
  - `POST /api/customers/me/actions` — trackear acción portal (201)
- [ ] 3.2 DTOs en `customers/presentation/dto/` — CreateCustomerDto, UpdateCustomerDto, CustomerResponseDto, UploadDocumentDto, SimulateLoanDto, etc. Usan Zod schemas de shared.
- [ ] 3.3 `customers.module.ts` actualizado — registrar todos los handlers + controller.

### Phase 4: Register Hook — Auto-Create Customer

- [ ] 4.1 Modificar `identity/application/register/register-user.handler.ts` — después de crear User, llamar `customerRepository.save(Customer.createFromUser(user))`. Si falla, rollback transaccional (usar Prisma `$transaction`).
- [ ] 4.2 Inyectar CustomerRepository en el IdentityModule para el handler.
- [ ] 4.3 `Customer.createFromUser(user)` — factory static: `{ userId: user.id, firstName: user.name, phone: user.phone, status: "REGISTERED", kycStatus: "NOT_STARTED" }`.

### Phase 5: Tests

- [ ] 5.1 Unit: RegisterUserHandler — éxito crea Customer, fallo rollback (mock repository).
- [ ] 5.2 Unit: UpdateCustomerHandler — actualiza perfil, document lock, sub-entity CRUD.
- [ ] 5.3 Unit: SimulateLoanHandler — fórmula francesa correcta, zero rate, schedule generation.
- [ ] 5.4 Unit: UploadDocumentHandler — éxito, 5MB limit, invalid type.
- [ ] 5.5 Integration: Prisma CRUD — save + findByUserId + update + sub-entities (CustomerAddress, CustomerPhone, etc.).
- [ ] 5.6 Integration: Document upload via supertest — multipart, base64 storage, download, delete, access control (own vs other).
- [ ] 5.7 Integration: Simulation via supertest — POST/GET, schedule correctness.
- [ ] 5.8 Integration: Register → Customer created (POST /api/auth/register → GET /api/customers/me returns 200).
- [ ] Verify: `pnpm lint` (0 errors), `pnpm type-check` (pass), `pnpm test` (existing + new 100+ pass).

## PR 3 — Frontend Portal

### Phase 0: Install 6 shadcn/ui components

- [ ] 0.1 `npx shadcn@latest add table` desde `apps/web/`
- [ ] 0.2 `npx shadcn@latest add tabs`
- [ ] 0.3 `npx shadcn@latest add sheet`
- [ ] 0.4 `npx shadcn@latest add dropdown-menu`
- [ ] 0.5 `npx shadcn@latest add progress`
- [ ] 0.6 `npx shadcn@latest add skeleton`

### Phase 1: Portal Layout + API Client + Hooks

- [ ] 1.1 `features/portal/components/portal-sidebar.tsx` — sidebar con nav links: Dashboard, Mi Perfil, Documentos, Simulador. Iconos Lucide. Current route highlight. Estado responsive (collapsible en mobile vía Sheet).
- [ ] 1.2 `app/portal/layout.tsx` — layout protegido: verifica sesión, redirect a `/login?redirect=` si no. Renderiza PortalSidebar + header con nombre/avatar del Customer. `POST /api/customers/me/actions` en cada navegación para tracking.
- [ ] 1.3 `app/portal/page.tsx` — redirect a `/portal/dashboard`.
- [ ] 1.4 `lib/api/customer.ts` — fetch wrappers: `getProfile()`, `updateProfile()`, `uploadDocument()`, `getDocuments()`, `downloadDocument()`, `deleteDocument()`, `simulateLoan()`, `getSimulations()`, `trackAction()`, `addAddress()`, `deleteAddress()`, `addPhone()`, `deletePhone()`, `addEmail()`, `deleteEmail()`, `updateEmployment()`, `addIncome()`, `deleteIncome()`, `addBankAccount()`, `deleteBankAccount()`. Usa apiClient con refresh automático.
- [ ] 1.5 `features/portal/hooks/use-customer.ts` — hook `useCustomer()`: fetch GET /customers/me, cache, refetch. `useUpdateCustomer()` mutation.
- [ ] 1.6 `features/portal/hooks/use-documents.ts` — hook `useDocuments()`: fetch list, upload, delete, download (base64 → Blob URL). Filtro por type.
- [ ] 1.7 `features/portal/hooks/use-simulator.ts` — hook `useSimulator()`: cálculo local (método francés, sin API), `useRunSimulation()` mutation, `useSimulations()` list.

### Phase 2: Dashboard Page

- [ ] 2.1 `app/portal/dashboard/page.tsx` — nombre del cliente, progreso documentos (Progress bar), cards de acción rápida. Banner de perfil incompleto si `status === "REGISTERED"` y faltan datos (firstName, lastName, documentNumber, phone). Cada card navega a su ruta. Skeleton mientras carga.

### Phase 3: Profile Page

- [ ] 3.1 `features/portal/components/customer-form.tsx` — formulario multi-tab (shadcn/ui Tabs):
  - **Datos personales**: firstName, middleName, lastName, birthDate, gender, maritalStatus, occupation, documentType, documentNumber. Zod validation.
  - **Dirección**: type (select HOME/WORK/CORRESPONDENCE), department, city, zone, street, number, isPrimary. Multiples direcciones con agregar/eliminar.
  - **Teléfonos**: lista con agregar/eliminar. phone (validación +591), isWhatsApp, isPrimary.
  - **Emails**: lista con agregar/eliminar. email, isPrimary.
  - **Empleo**: employer, position, employmentStatus (select), monthlySalary, yearsWorking.
  - **Ingresos**: lista fuente/monto/frecuencia con agregar/eliminar.
  - **Cuentas bancarias**: lista banco/tipo/número/titular con agregar/eliminar.
  Cada tab con botón "Guardar" independiente. Zod validation inline. Sonner toasts en éxito/error. Skeleton loading.
- [ ] 3.2 `app/portal/profile/page.tsx` — renderiza CustomerForm.

### Phase 4: Documents Page

- [ ] 4.1 `features/portal/components/document-list.tsx` — tabla (shadcn/ui Table) con columnas: Tipo, Nombre, Fecha, Estado (badge colored: PENDING yellow, VERIFIED green, REJECTED red), Acciones (descargar, eliminar). Filtro por tipo. Delete con confirmación Dialog.
- [ ] 4.2 `features/portal/components/document-uploader.tsx` — Dialog con: file input (max 5MB), type selector (select: CI_FRONT, CI_BACK, SELFIE, PAYSLIP, BANK_STATEMENT, SERVICE_BILL), notes textarea opcional, "Subir" button con loading state.
- [ ] 4.3 `app/portal/documents/page.tsx` — renderiza DocumentUploader + DocumentList.

### Phase 5: Simulator Page

- [ ] 5.1 `features/portal/components/simulator-form.tsx` — sliders/inputs para: Monto (100-50000, step 100), Plazo (1-60, step 1), Tasa anual (0-50%, step 0.5). Cálculo instantáneo de cuota estimada (frontend-only, sin API). "Simular" button deshabilitado si validación falla. Rate > 50% → error "Tasa máxima 50%".
- [ ] 5.2 `features/portal/components/amortization-table.tsx` — tabla scrollable con columnas: Mes, Cuota, Interés, Capital, Saldo. Resumen abajo: Total a Pagar, Total Intereses. Última fila saldo 0.
- [ ] 5.3 Historial simulaciones: acordeón "Simulaciones anteriores" con últimas 5, cada item muestra monto, plazo, cuota, fecha. Click → rellena formulario.
- [ ] 5.4 `app/portal/simulator/page.tsx` — renderiza SimulatorForm + AmortizationTable + history.

### Phase 6: Tests + Stories

- [ ] 6.1 **Stories**: PortalSidebar (3 estados: collapsed, expanded, mobile), CustomerForm (cada tab), DocumentList (con/sin datos, status variants), DocumentUploader, SimulatorForm (valores default, error), AmortizationTable (12 rows, 1 row, empty).
- [ ] 6.2 **Unit**: useCustomer hook — fetch success, 404, error retry.
- [ ] 6.3 **Unit**: useDocuments hook — upload, list, delete.
- [ ] 6.4 **Unit**: useSimulator hook — calculation matches backend formula, zero rate, schedule generation.
- [ ] 6.5 **Unit**: Portal Layout — redirect without session, show sidebar with session.
- [ ] 6.6 **Snapshot**: Dashboard page renders skeleton → data → banner states.
- [ ] 6.7 **Integration**: API client — customer.ts fetch wrappers (mocked).
- [ ] Verify: `pnpm lint` (0 errors), `pnpm type-check` (pass), `pnpm test` (100+ tests pass), `pnpm --filter @prestamos/web storybook` (builds without errors).
