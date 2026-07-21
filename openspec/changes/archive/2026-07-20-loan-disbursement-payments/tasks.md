# Tasks: Fase 5 — Préstamos Activos y Pagos

> Basado en `proposal.md`, `specs.md` y `design.md`.
> Sigue las convenciones DDD + Clean Architecture + @Inject() explícito.
> Ponytail activo: nada especulativo, lo mínimo que funciona.

---

## PR Split Strategy

Tres PRs encadenados, cada uno deployable y testeable independientemente:

| PR | Scope | Est. líneas | Depende de |
|----|-------|-------------|------------|
| **PR 1** | Foundation — Prisma + Domain + Amortization + DisburseHandler | ~680 | Ninguna |
| **PR 2** | Operations — PaymentHandler + Queries + Controllers | ~720 | PR 1 |
| **PR 3** | Frontend — Portal + Admin + Stories | ~700 | PR 1+2 |

PRs chicos (~600-700 líneas cada uno) = revisables en <30 min. No hay beneficio en fusionarlos — el budget es ilimitado pero la revisión es el cuello de botella.

---

## PR 1: Foundation — Data + Domain + Disbursement

### LOAN-01 — Prisma Schema + Migration

**Dependencias**: Ninguna

**Files**:
- `apps/api/prisma/schema.prisma` — modificar (agregar modelos Loan, Installment, LoanTransaction al final)
- `apps/api/prisma/migrations/` — generar migración `add-loan-disbursement-tables`

**Acceptance Criteria**:
- [ ] Modelo `Loan` creado con todos los campos según `design.md §1.1`: id, applicationId (unique), customerId, amount, termMonths, annualRate, monthlyPayment, totalInterest, totalPayment, outstandingBalance, status (default ACTIVE), disbursedAt, paidAt, createdAt, updatedAt
- [ ] `Loan.applicationId` es `@unique` y referencia `LoanApplication`
- [ ] `Loan.customerId` referencia `Customer`
- [ ] Índices en `customerId`, `status`, `createdAt`
- [ ] Modelo `Installment` creado: id, loanId, number, dueDate, paidAt, status, amount, interest, principal, balanceBefore, balanceAfter
- [ ] `Installment.@@unique([loanId, number])` — evita duplicados en el schedule
- [ ] Índices en `loanId`, `status`, `dueDate`
- [ ] Modelo `LoanTransaction` creado: id, loanId, type, amount, method, installmentId (opcional), reference, notes, recordedById (ref User), createdAt
- [ ] Índices en `loanId`, `type`, `recordedById`
- [ ] `pnpm exec prisma migrate dev --name add-loan-disbursement-tables` ejecutado sin errores
- [ ] `pnpm exec prisma generate` ejecutado sin errores

**Estimated lines**: ~60 (schema) + migrations (auto)

---

### LOAN-02 — Domain VOs, Entities, Errors

**Dependencias**: LOAN-01 (necesita los modelos mentales, pero el código es independiente de Prisma)

**Files nuevos**:
- `apps/api/src/loans/domain/value-objects/active-loan-status.ts`
- `apps/api/src/loans/domain/value-objects/installment-status.ts`
- `apps/api/src/loans/domain/value-objects/payment-method.ts`
- `apps/api/src/loans/domain/value-objects/transaction-type.ts`
- `apps/api/src/loans/domain/loan.entity.ts`
- `apps/api/src/loans/domain/installment.entity.ts`
- `apps/api/src/loans/domain/loan-transaction.vo.ts`
- `apps/api/src/loans/domain/loan.errors.ts`

**Files modificados**:
- `apps/api/src/loans/domain/value-objects/loan-status.ts` — agregar `ACTIVE` al enum y transición `APPROVED: ['ACTIVE']`

**Acceptance Criteria**:
- [ ] `ActiveLoanStatus` = `'ACTIVE' | 'PAID' | 'DEFAULTED' | 'WRITTEN_OFF'`
- [ ] `ACTIVE_LOAN_TRANSITIONS` define: ACTIVE→[PAID, DEFAULTED], PAID→[], DEFAULTED→[WRITTEN_OFF], WRITTEN_OFF→[]
- [ ] `canTransitionActiveLoan()` function existe
- [ ] `InstallmentStatus` = `'PENDING' | 'PAID' | 'OVERDUE' | 'DEFAULTED'`
- [ ] `PaymentMethod` = `'MANUAL' | 'CASH' | 'TRANSFER'`
- [ ] `TransactionType` = `'DISBURSEMENT' | 'PAYMENT' | 'ADJUSTMENT'`
- [ ] `Loan` entity: campos según diseño + método `close()` que setea status='PAID', paidAt=now, outstandingBalance=0
- [ ] `Installment` entity: campos según diseño + método `markAsPaid()` que setea status='PAID', paidAt=now
- [ ] `LoanTransaction`: VO inmutable, todos readonly
- [ ] Errores de dominio definidos: `LoanNotFoundError` (404), `LoanAlreadyDisbursedError` (409), `LoanAlreadyPaidError` (409), `PaymentAmountInvalidError` (422), `PartialPaymentNotSupportedError` (422), `NoPendingInstallmentsError` (409)
- [ ] Cada error tiene `statusCode`, `code` string, y `message`
- [ ] `loan-status.ts` actualizado: `LOAN_STATUSES` incluye `'ACTIVE'`, `VALID_TRANSITIONS` tiene `APPROVED: ['ACTIVE']` y `ACTIVE: []`

**Estimated lines**: ~250

---

### LOAN-03 — Amortization Calculator + Tests

**Dependencias**: LOAN-02 (usa tipos de dominio)

**Files nuevos**:
- `apps/api/src/loans/domain/value-objects/amortization.ts`
- `apps/api/src/loans/domain/value-objects/amortization.spec.ts`

**Acceptance Criteria**:
- [ ] `calculateAmortization(amount, annualRate, termMonths, disbursedAt)` función pura exportada
- [ ] Retorna `AmortizationResult` con: `monthlyPayment`, `totalInterest`, `totalPayment`, `schedule[]`
- [ ] Cada `AmortizationRow` tiene: number, dueDate (ISO), amount, interest, principal, balanceBefore, balanceAfter
- [ ] Fórmula correcta: `cuota = P * r(1+r)^n / ((1+r)^n - 1)` con `r = annualRate/12/100`
- [ ] Redondeo a 2 decimales en cada operación
- [ ] Última cuota ajustada para que `balanceAfter = 0` (absorbe diferencia de redondeo)
- [ ] `dueDate = disbursedAt + (30 * number)` días — no calendario exacto (ponytail)
- [ ] **Test**: P=10000, r=12%, n=12 → monthlyPayment=888.49, totalInterest=661.85
- [ ] **Test**: schedule[0].interest = 100.00, schedule[0].principal = 788.49, schedule[0].balanceAfter = 9211.51
- [ ] **Test**: Última cuota balanceAfter = 0.00
- [ ] **Test**: Tasa 0% → cuota = P/n, totalInterest = 0 (dale, no debería pasar en prod pero la función lo maneja)
- [ ] **Test**: P=100, r=12%, n=3 → valores positivos
- [ ] **Test**: P=50000, r=10%, n=120 → 120 cuotas generadas correctamente
- [ ] Suma de principal_i ≈ P original (diferencia < n*0.01 por redondeo)

**Estimated lines**: ~80 (function) + ~60 (tests)

---

### LOAN-04 — Repository Ports + Query Ports + DI Tokens

**Dependencias**: LOAN-02 (usa entities + errors)

**Files nuevos**:
- `apps/api/src/loans/domain/loan.repository.ts`
- `apps/api/src/loans/application/ports/active-loan-query.port.ts`

**Files modificados**:
- `apps/api/src/loans/loans.tokens.ts` — agregar tokens

**Acceptance Criteria**:
- [ ] `LoanRepository` port: `findById`, `findByCustomerId`, `findByApplicationId`, `save(loan, installments[], transaction)`, `updateStatus(id, fromStatus, toStatus)`, `updateOutstandingBalance`
- [ ] `InstallmentRepository` port: `findByLoanId`, `findNextPending`, `markAsPaid`, `countByStatus`
- [ ] `ActiveLoanQuery` port: `listByCustomerId` → `ActiveLoanListResponse`, `getDetail` → `ActiveLoanDetailResponse | null`
- [ ] `AdminActiveLoanQuery` port: `list(params)` → `AdminActiveLoanListResponse`, `getDetail` → `AdminActiveLoanDetailResponse | null`
- [ ] Tokens nuevos en `loans.tokens.ts`:
  ```typescript
  export const LOAN_REPOSITORY = Symbol('LOAN_REPOSITORY');
  export const INSTALLMENT_REPOSITORY = Symbol('INSTALLMENT_REPOSITORY');
  export const ACTIVE_LOAN_QUERY = Symbol('ACTIVE_LOAN_QUERY');
  export const ADMIN_ACTIVE_LOAN_QUERY = Symbol('ADMIN_ACTIVE_LOAN_QUERY');
  ```

**Estimated lines**: ~50

---

### LOAN-05 — Prisma Repositories + DisburseLoanHandler + Shared Types (Core)

**Dependencias**: LOAN-01 (Prisma generate), LOAN-03 (amortization), LOAN-04 (ports + tokens)

**Files nuevos**:
- `apps/api/src/loans/infrastructure/persistence/prisma-loan.repository.ts`
- `apps/api/src/loans/infrastructure/persistence/prisma-installment.repository.ts`
- `apps/api/src/loans/application/disburse-loan/disburse-loan.handler.ts`
- `apps/api/src/loans/application/disburse-loan/disburse-loan.handler.spec.ts`

**Files modificados**:
- `packages/shared/src/types/loan.types.ts` — agregar `ActiveLoanStatus`, `DisburseLoanResponse`, `InstallmentItemResponse`
- `packages/shared/src/schemas/loan.schema.ts` — agregar `ACTIVE` a `LoanStatusEnum`
- `packages/shared/src/index.ts` — re-exportar (auto)

**Acceptance Criteria**:

**PrismaLoanRepository**:
- [ ] `findById(id)` con `include: { installments, transactions }` → Loan entity o null
- [ ] `findByCustomerId(customerId)` filtra por `{ customerId, status: { in: ['ACTIVE'] } }`
- [ ] `findByApplicationId(applicationId)` busca por `applicationId` unique
- [ ] `save(loan, installments[], transaction)` escribe Loan + Installments.createMany + Transaction.create en una operación
- [ ] `updateStatus(id, fromStatus, toStatus)` usa `updateMany` con `where: { id, status: fromStatus }` para optimistic locking
- [ ] `updateOutstandingBalance(id, newBalance)` actualiza el balance
- [ ] `toEntity()` mapea row → Loan entity con `Number()` para Decimal fields
- [ ] Inline row shape (no Prisma generated type) — mismo patrón que `PrismaLoanApplicationRepository`

**PrismaInstallmentRepository**:
- [ ] `findByLoanId(loanId)` ordenado por number ASC
- [ ] `findNextPending(loanId)` busca first `{ status: { in: ['PENDING', 'OVERDUE'] } }` ordenado por number ASC
- [ ] `markAsPaid(id)` setea status='PAID', paidAt=now
- [ ] `countByStatus(loanId, status)` count query

**DisburseLoanHandler**:
- [ ] `@Injectable()` con `@Inject(LOAN_APPLICATION_REPOSITORY)`, `@Inject(LOAN_REPOSITORY)`, `@Inject(PrismaService)`
- [ ] `execute(adminId, applicationId)`:
  1. Lee aplicación — si no existe, `LoanNotFoundError`
  2. Si `app.reviewerId !== adminId`, `LoanNotOwnedByCustomerError`
  3. Calcula amortización con `calculateAmortization(amount, annualRate, termMonths, new Date())`
  4. Dentro de `prisma.$transaction`:
     a. `appRepo.updateStatus(app.id, 'APPROVED', 'ACTIVE')` — si false, `LoanAlreadyDisbursedError`
     b. `loanRepo.save(loan, installments, disbursementTx)`
  5. Retorna `DisburseLoanResponse`
- [ ] Genera UUIDs para Loan, Installments[], y LoanTransaction (usando `randomUUID` de `node:crypto`)
- [ ] LoanTransaction.type = 'DISBURSEMENT', method = null, reference = null, notes = 'Desembolso inicial', recordedById = adminId
- [ ] **Test**: desembolso exitoso → verifica loan creado, installments creados, transaction creada, app.status=ACTIVE
- [ ] **Test**: aplicación no APPROVED → lanza LoanStatusTransitionError
- [ ] **Test**: race condition (updateStatus returns false) → lanza LoanAlreadyDisbursedError
- [ ] **Test**: aplicación no existe → lanza LoanNotFoundError

**Shared**:
- [ ] `ActiveLoanStatus` type agregado
- [ ] `DisburseLoanResponse` interface completa (loan, installments[], transaction)
- [ ] `InstallmentItemResponse` interface completa
- [ ] `LoanStatusEnum` incluye `'ACTIVE'`

**Estimated lines**: ~200 (repos) + ~100 (handler) + ~60 (tests) + ~30 (shared)

---

## PR 2: Operations — Payment + Queries + Controllers

### LOAN-06 — RegisterPaymentHandler + Tests

**Dependencias**: LOAN-05 (necesita LoanRepository, InstallmentRepository implementados)

**Files nuevos**:
- `apps/api/src/loans/application/register-payment/register-payment.handler.ts`
- `apps/api/src/loans/application/register-payment/register-payment.handler.spec.ts`

**Acceptance Criteria**:
- [ ] `@Injectable()` con `@Inject(LOAN_REPOSITORY)`, `@Inject(INSTALLMENT_REPOSITORY)`, `@Inject(PrismaService)`
- [ ] `execute(adminId, input: RegisterPaymentInput) → RegisterPaymentResponse`
- [ ] **Validaciones**:
  - `input.amount > 0` → si no, `PaymentAmountInvalidError`
  - Loan existe → si no, `LoanNotFoundError`
  - Loan.status === 'ACTIVE' → si no, `LoanAlreadyPaidError`
  - Hay al menos una cuota PENDING/OVERDUE → si no, `NoPendingInstallmentsError`
- [ ] **Aplicación FIFO**:
  - Obtiene cuotas PENDING/OVERDUE ordenadas por number ASC
  - Itera: si `remaining >= installment.amount`, marca como PAID, resta del remaining
  - Si `remaining > 0` pero `remaining < nextInstallment.amount` → `PartialPaymentNotSupportedError`
  - Una sola LoanTransaction creada por todo el pago (aunque pague múltiples cuotas)
- [ ] **Transacción atómica** (dentro de `prisma.$transaction`):
  - Marcar cuota(s) como PAID
  - Crear LoanTransaction tipo PAYMENT con method, reference, notes
  - Actualizar `loan.outstandingBalance -= sum(installment.principal for each paid)`
  - Si todas las cuotas están PAID → `loan.close()` y persistir
- [ ] **Test**: pago exacto de una cuota → PAID, balance decrementado
- [ ] **Test**: pago que cubre 2 cuotas → ambas PAID, balance decrementado por principal de ambas
- [ ] **Test**: pago en cuota OVERDUE → PAID (sin mora, out of scope)
- [ ] **Test**: pago que completa todas las cuotas → Loan.status='PAID', paidAt set
- [ ] **Test**: pago parcial (amount < cuota) → PartialPaymentNotSupportedError
- [ ] **Test**: pago en loan PAID → LoanAlreadyPaidError
- [ ] **Test**: amount = 0 → PaymentAmountInvalidError
- [ ] **Test**: todas las cuotas ya pagadas → NoPendingInstallmentsError

**Estimated lines**: ~120 (handler) + ~80 (tests)

---

### LOAN-07 — Query Implementations (Portal + Admin)

**Dependencias**: LOAN-01 (Prisma models)

**Files nuevos**:
- `apps/api/src/loans/infrastructure/active-loan-query/prisma-active-loan-query.impl.ts`
- `apps/api/src/loans/infrastructure/active-loan-query/prisma-admin-active-loan-query.impl.ts`

**Acceptance Criteria**:

**PrismaActiveLoanQueryImpl** (portal — cliente):
- [ ] `listByCustomerId(customerId)`:
  - Filtra `{ customerId, status: { in: ['ACTIVE'] } }`
  - Include installments ordenados por number ASC
  - Para cada loan calcula: paidCount, totalCount, nextInstallment (primer PENDING/OVERDUE)
  - Retorna `ActiveLoanListResponse` con `data[]` + `summary`
  - Summary: totalOutstandingBalance (suma), nextPaymentAmount (menor del próximo), nextPaymentDate (más próxima), totalActiveLoans
- [ ] `getDetail(customerId, loanId)`:
  - `findFirst({ where: { id, customerId } })` — no revela pertenencia (404 si no coincide)
  - Include installments + transactions ordenados
  - Retorna `ActiveLoanDetailResponse` con installments[] y transactions[]

**PrismaAdminActiveLoanQueryImpl** (admin):
- [ ] `list(params)` con:
  - Filtro opcional por status
  - Filtro opcional por dateFrom/dateTo en disbursedAt
  - Search opcional por nombre de cliente o documento (JOIN con Customer)
  - Paginación (skip/take)
  - Retorna `AdminActiveLoanListResponse` con pagination
  - Cada item incluye customer: { id, firstName, lastName, documentNumber }
  - Progress: paidCount/totalCount
- [ ] `getDetail(loanId)`:
  - Include loan data + installments[] + transactions[] + customer data
  - Retorna `AdminActiveLoanDetailResponse` o null

**Estimated lines**: ~150 (portal query) + ~120 (admin query)

---

### LOAN-08 — GetActiveLoanHandler + ListActiveLoansHandler

**Dependencias**: LOAN-07 (necesita query implementations)

**Files nuevos**:
- `apps/api/src/loans/application/get-active-loan/get-active-loan.handler.ts`
- `apps/api/src/loans/application/list-active-loans/list-active-loans.handler.ts`

**Acceptance Criteria**:

**GetActiveLoanHandler** (portal):
- [ ] `@Injectable()` con `@Inject(ACTIVE_LOAN_QUERY)`
- [ ] `list(customerId)` → delega a `query.listByCustomerId`
- [ ] `detail(customerId, loanId)` → delega a `query.getDetail`, si null → `LoanNotFoundError`

**ListActiveLoansHandler** (admin):
- [ ] `@Injectable()` con `@Inject(ADMIN_ACTIVE_LOAN_QUERY)`
- [ ] `list(params)` → delega a `query.list`
- [ ] `detail(loanId)` → delega a `query.getDetail`, si null → `LoanNotFoundError`

**Estimated lines**: ~40 (portal) + ~40 (admin)

---

### LOAN-09 — Controllers + Module Wiring

**Dependencias**: LOAN-05 (DisburseLoanHandler), LOAN-06 (RegisterPaymentHandler), LOAN-08 (handlers)

**Files nuevos**:
- `apps/api/src/loans/presentation/active-loan.controller.ts`
- `apps/api/src/loans/presentation/admin-payment.controller.ts`

**Files modificados**:
- `apps/api/src/loans/loans.module.ts` — registrar nuevos controllers, handlers, repos, queries

**Acceptance Criteria**:

**ActiveLoanController**:
- [ ] `@Controller('api/loans/active')` con `@UseGuards(JwtAuthGuard, CustomerGuard)`
- [ ] `GET /api/loans/active` → `GetActiveLoanHandler.list(req.customer.id)`
- [ ] `GET /api/loans/active/:id` → `GetActiveLoanHandler.detail(req.customer.id, id)`
- [ ] Usa `RequestWithCustomer` type (existente)

**AdminPaymentController**:
- [ ] `@Controller('api/admin')` con `@UseGuards(JwtAuthGuard, AdminGuard)`
- [ ] `POST /api/admin/loans/:id/disburse` → `DisburseLoanHandler.execute(user.sub, id)` con `@HttpCode(201)`
- [ ] `POST /api/admin/payments` → `RegisterPaymentHandler.execute(user.sub, body)` con `@HttpCode(201)` y `@Body(ZodValidationPipe(RegisterPaymentSchema))`
- [ ] `GET /api/admin/loans/active` → `ListActiveLoansHandler.list(query)` con `@Query(ZodValidationPipe(AdminActiveLoanQuerySchema))`
- [ ] `GET /api/admin/loans/active/:id` → `ListActiveLoansHandler.detail(id)`
- [ ] Usa `@CurrentUser()` decorator (existente)

**LoansModule**:
- [ ] Controllers registrados: `ActiveLoanController`, `AdminPaymentController` (además de los existentes)
- [ ] Providers nuevos:
  ```typescript
  { provide: LOAN_REPOSITORY, useClass: PrismaLoanRepository },
  { provide: INSTALLMENT_REPOSITORY, useClass: PrismaInstallmentRepository },
  { provide: ACTIVE_LOAN_QUERY, useClass: PrismaActiveLoanQueryImpl },
  { provide: ADMIN_ACTIVE_LOAN_QUERY, useClass: PrismaAdminActiveLoanQueryImpl },
  DisburseLoanHandler,
  RegisterPaymentHandler,
  GetActiveLoanHandler,
  ListActiveLoansHandler,
  ```
- [ ] PrismaService no necesita registro (ya es global)

**Estimated lines**: ~80 (portal controller) + ~80 (admin controller) + ~20 (module)

---

### LOAN-10 — Shared Types/Schemas (Remaining)

**Dependencias**: Ninguna técnica, pero estas types se consumen en PR 3

**Files modificados**:
- `packages/shared/src/types/loan.types.ts` — agregar tipos restantes
- `packages/shared/src/schemas/loan.schema.ts` — agregar schemas restantes
- `packages/shared/src/index.ts` — re-exportar

**Acceptance Criteria**:

**Types nuevos**:
- [ ] `ActiveLoanListResponse` con `data: ActiveLoanSummary[]` + `summary`
- [ ] `ActiveLoanSummary`: id, amount, monthlyPayment, outstandingBalance, status, disbursedAt, nextInstallment (con number, dueDate, amount, status) | null, progress (paidCount, totalCount, percentage)
- [ ] `ActiveLoanDetailResponse`: id, amount, termMonths, annualRate, monthlyPayment, totalInterest, totalPayment, outstandingBalance, status, disbursedAt, paidAt, installments[], transactions[]
- [ ] `TransactionSummary`: id, type, amount, method, reference, createdAt
- [ ] `RegisterPaymentInput`: loanId (uuid), amount (positive), method ('CASH'|'TRANSFER'), reference?, notes?
- [ ] `RegisterPaymentResponse`: transaction, installmentsPaid[] (id, number, status, paidAt), loanStatus, outstandingBalance
- [ ] `AdminActiveLoanListResponse`: data[] + pagination
- [ ] `AdminActiveLoanListItem`: id, amount, monthlyPayment, outstandingBalance, status, disbursedAt, termMonths, customer (id, firstName, lastName, documentNumber), progress
- [ ] `AdminActiveLoanDetailResponse`: loan (full data), customer (full data), installments[], transactions[]

**Schemas nuevos**:
- [ ] `ActiveLoanStatusEnum` = z.enum(['ACTIVE', 'PAID', 'DEFAULTED', 'WRITTEN_OFF'])
- [ ] `RegisterPaymentSchema` con validaciones: loanId uuid, amount positive, method enum, reference max(100), notes max(500)
- [ ] `AdminActiveLoanQuerySchema` con: status opcional, page default 1, limit default 20 max 100, dateFrom/dateTo opcional, search max(100) opcional

**Estimated lines**: ~120

---

## PR 3: Frontend — Portal + Admin

### LOAN-11 — Portal Active Loans (Hooks + Components)

**Dependencias**: LOAN-10 (shared types)

**Files nuevos**:
- `apps/web/features/loans/hooks/use-active-loans.ts`
- `apps/web/features/loans/components/active-loan-list.tsx`
- `apps/web/features/loans/components/active-loan-detail.tsx`

**Acceptance Criteria**:

**useActiveLoans hook**:
- [ ] `useActiveLoans()` retorna: `{ data, detail, isLoading, error, list, getDetail }`
- [ ] `list()` → GET `/api/loans/active` → `ActiveLoanListResponse`
- [ ] `getDetail(id)` → GET `/api/loans/active/:id` → `ActiveLoanDetailResponse`
- [ ] Manejo de error con `ApiError`
- [ ] Mismo patrón que `useAdminLoans` existente

**ActiveLoanList component**:
- [ ] Toma `data: ActiveLoanListResponse` como prop
- [ ] Summary arriba: totalOutstandingBalance, nextPayment, nextPaymentDate, totalActiveLoans
- [ ] Lista de tarjetas con: monto, cuota mensual, saldo pendiente, progreso (paid/total + barra %), próxima cuota
- [ ] Cada tarjeta es Link a `/portal/loans/active/[id]`
- [ ] Empty state: "No tenés préstamos activos"

**ActiveLoanDetail component**:
- [ ] Toma `detail: ActiveLoanDetailResponse` como prop
- [ ] Encabezado: monto, plazo, tasa, cuota fija, saldo pendiente
- [ ] Barra de progreso (cuotas pagadas / total)
- [ ] Tabla de cronograma: #, fecha vencimiento, monto, interés, capital, saldo, estado (badge color)
- [ ] Badge de estado: PAID=verde, PENDING=amarillo, OVERDUE=rojo
- [ ] Loading/error states

**Estimated lines**: ~60 (hook) + ~80 (list) + ~100 (detail)

---

### LOAN-12 — Admin Payments (Hooks + Components)

**Dependencias**: LOAN-10 (shared types)

**Files nuevos**:
- `apps/web/features/admin/hooks/use-admin-payments.ts`
- `apps/web/features/admin/components/admin-loan-active-table.tsx`
- `apps/web/features/admin/components/payment-dialog.tsx`

**Acceptance Criteria**:

**useAdminPayments hook**:
- [ ] `useAdminPayments()` retorna: `{ loans, pagination, isLoading, error, listActive, disburse, registerPayment }`
- [ ] `listActive(params?)` → GET `/api/admin/loans/active` con query params
- [ ] `disburse(applicationId)` → POST `/api/admin/loans/:id/disburse`
- [ ] `registerPayment(input)` → POST `/api/admin/payments`
- [ ] Manejo de error con `ApiError`

**AdminLoanActiveTable component**:
- [ ] Tabla de préstamos activos con columnas: cliente, monto, cuota, saldo, estado, progreso (paid/total)
- [ ] Paginación (usando `pagination` del response)
- [ ] Cada fila es link a `/admin/payments/[id]`
- [ ] Filtros: status (select), fechas (date range), búsqueda (input)

**PaymentDialog component**:
- [ ] Modal (shadcn Dialog) para registrar pago
- [ ] Props: `loanId`, `nextAmount`, `onSuccess`, `onError`
- [ ] Muestra próxima cuota: número, monto, fecha
- [ ] Inputs: method (select: EFECTIVO | TRANSFERENCIA), reference (opcional), notes (opcional)
- [ ] Botón "Registrar Pago" con loading state
- [ ] Validación básica: amount se hardcodea al monto de la próxima cuota (no input libre)
- [ ] On success: toast + callback

**Estimated lines**: ~60 (hook) + ~80 (table) + ~80 (dialog)

---

### LOAN-13 — Disbursement Button in Admin Review

**Dependencias**: LOAN-12 (useAdminPayments hook), LOAN-10 (shared types)

**Files nuevos**:
- `apps/web/features/admin/components/disbursement-button.tsx`

**Files modificados**:
- `apps/web/features/admin/components/admin-loan-review.tsx` — agregar botón condicional
- `apps/web/app/admin/loans/[id]/page.tsx` — pasar props de desembolso

**Acceptance Criteria**:

**DisbursementButton**:
- [ ] Componente que recibe `applicationId`, `onDisbursed(loanId)` callback
- [ ] Se renderiza solo cuando `application.status === 'APPROVED'`
- [ ] Botón "Desembolsar" con icono (lucide `HandCoins` o similar)
- [ ] Confirmación en Dialog: "¿Estás seguro de desembolsar este préstamo?" con detalle del monto
- [ ] Al confirmar: llama a `useAdminPayments().disburse(applicationId)`
- [ ] Loading state en el botón durante la operación
- [ ] En éxito: redirige a `/admin/payments/[loanId]` o muestra toast
- [ ] En error: muestra mensaje de error (ej: "Ya fue desembolsado" para 409)

**AdminLoanReview modificado**:
- [ ] Nueva prop opcional `onDisburse?: (applicationId: string) => Promise<string | null>`
- [ ] Renderiza `<DisbursementButton>` cuando `application.status === 'APPROVED'` en lugar de los botones de review
- [ ] El review detail page pasa el handler de desembolso

**Estimated lines**: ~60 (button) + ~20 (review mod)

---

### LOAN-14 — Portal + Admin Pages

**Dependencias**: LOAN-11, LOAN-12, LOAN-13

**Files nuevos**:
- `apps/web/app/portal/loans/active/[id]/page.tsx`
- `apps/web/app/admin/payments/page.tsx`
- `apps/web/app/admin/payments/[id]/page.tsx`

**Files modificados**:
- `apps/web/app/portal/loans/page.tsx` — agregar sección de préstamos activos
- `apps/web/app/admin/loans/[id]/page.tsx` — integrar DisbursementButton

**Acceptance Criteria**:

**Portal `/portal/loans` (modificado)**:
- [ ] Sección "Préstamos Activos" arriba (usando `useActiveLoans` + `ActiveLoanList`)
- [ ] Sección "Solicitudes" abajo (existente, sin cambios)
- [ ] Loading/error states independientes por sección

**Portal `/portal/loans/active/[id]` (nuevo)**:
- [ ] Usa `useActiveLoans().getDetail(id)`
- [ ] Renderiza `ActiveLoanDetail`
- [ ] Botón "Volver" a `/portal/loans`
- [ ] Loading/error states

**Admin `/admin/payments` (nuevo)**:
- [ ] Header: "Gestión de Pagos"
- [ ] Renderiza `AdminLoanActiveTable`
- [ ] Carga datos al montar con `useAdminPayments().listActive()`

**Admin `/admin/payments/[id]` (nuevo)**:
- [ ] Carga detalle del préstamo activo (GET `/api/admin/loans/active/:id`)
- [ ] Muestra datos del préstamo + cronograma + transacciones
- [ ] Incluye `PaymentDialog` para registrar pago
- [ ] Recarga datos después de un pago exitoso
- [ ] Botón "Volver" a `/admin/payments`

**Admin `/admin/loans/[id]` (modificado)**:
- [ ] Integra `DisbursementButton` cuando `application.status === 'APPROVED'`
- [ ] Props: `onDisburse` que usa `useAdminPayments().disburse()`

**Estimated lines**: ~20 (portal mod) + ~40 (portal detail page) + ~30 (admin payments page) + ~40 (admin payment detail page)

---

### LOAN-15 — Stories

**Dependencias**: LOAN-11, LOAN-12, LOAN-13 (componentes ya implementados)

**Files nuevos**:
- `apps/web/stories/ActiveLoanList.stories.tsx`
- `apps/web/stories/ActiveLoanDetail.stories.tsx`
- `apps/web/stories/DisbursementButton.stories.tsx`
- `apps/web/stories/PaymentDialog.stories.tsx`

**Acceptance Criteria**:
- [ ] `ActiveLoanList.stories.tsx`: estado con datos (2 préstamos), empty state, loading state
- [ ] `ActiveLoanDetail.stories.tsx`: estado con cronograma (3 PAID + 9 PENDING), loading
- [ ] `DisbursementButton.stories.tsx`: estado normal, confirmación abierta, loading
- [ ] `PaymentDialog.stories.tsx`: estado inicial, con datos precargados
- [ ] Todas las stories siguen el patrón CSF3 (component story format)
- [ ] Stories pasan `pnpm storybook` sin errores

**Estimated lines**: ~100

---

## Dependency Graph

```
PR 1:
  LOAN-01 ──► LOAN-02 ──► LOAN-03 ──► LOAN-04 ──► LOAN-05
                                                      │
PR 2:                                                 │
  LOAN-06 ◄───────────────────────────────────────────┤
  LOAN-07 ◄────────── LOAN-01                         │
  LOAN-08 ◄────────── LOAN-07                         │
  LOAN-09 ◄────────── LOAN-05 + LOAN-06 + LOAN-08     │
  LOAN-10 (independiente, puede ir en cualquier PR)   │
                                                      │
PR 3:                                                 │
  LOAN-11 ◄────────── LOAN-10                         │
  LOAN-12 ◄────────── LOAN-10                         │
  LOAN-13 ◄────────── LOAN-12 + LOAN-11               │
  LOAN-14 ◄────────── LOAN-11 + LOAN-12 + LOAN-13     │
  LOAN-15 ◄────────── LOAN-11 + LOAN-12 + LOAN-13     │
```

---

## Estimated Total

| PR | Tareas | Líneas estimadas |
|----|--------|-----------------|
| PR 1 | LOAN-01 a LOAN-05 | ~680 |
| PR 2 | LOAN-06 a LOAN-10 | ~720 |
| PR 3 | LOAN-11 a LOAN-15 | ~700 |
| **Total** | **15 tareas** | **~2100** |

---

## Post-Implementation Checklist

- [ ] Probar cada endpoint con curl según `specs.md` §Pruebas de aprobación
- [ ] `codegraph sync` antes de cada commit
- [ ] Actualizar `docs/okf/log.md` con los cambios de Fase 5
- [ ] Verificar que `pnpm build` pasa sin errores en api y web
- [ ] Verificar que `pnpm type-check` pasa en web
