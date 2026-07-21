# Specs: Fase 5 — Préstamos Activos y Pagos

## Preámbulo: Cambios al modelo existente

### LoanStatus — Nuevos estados para Loan (no LoanApplication)

Se agrega un enum separado `ActiveLoanStatus` en `packages/shared` para el ciclo de vida del préstamo desembolsado. LoanApplication conserva su `LoanStatus` actual.

```typescript
// packages/shared/src/types/loan.types.ts
export type ActiveLoanStatus = 'ACTIVE' | 'PAID' | 'DEFAULTED' | 'WRITTEN_OFF';
```

### LoanApplication status — Se agrega ACTIVE al enum

El estado `APPROVED` ya no es terminal. Cuando se desembolsa, LoanApplication.status pasa a `ACTIVE`.

En `packages/shared/src/schemas/loan.schema.ts`:
```typescript
export const LoanStatusEnum = z.enum([
  'DRAFT', 'PENDING', 'IN_REVIEW', 'INFO_REQUESTED',
  'APPROVED', 'REJECTED', 'CANCELLED', 'ACTIVE',
]);
```

En `apps/api/src/loans/domain/value-objects/loan-status.ts`:
```typescript
APPROVED: ['ACTIVE'],  // ← se agrega esta transición
ACTIVE: [],
```

### Prisma — Nuevas tablas

Ver modelo en `proposal.md`. No se repite aquí. Puntos clave:
- `Loan.applicationId` es `@unique` — garantiza un solo desembolso por aplicación
- `Installment.amount` = cuota fija (sistema francés), no cambia
- `Installment.interest` y `principal` son los componentes calculados al desembolsar
- `Installment.balanceBefore` y `balanceAfter` permiten reconstruir el schedule
- `LoanTransaction.type` = `'DISBURSEMENT' | 'PAYMENT' | 'ADJUSTMENT'`
- `LoanTransaction.method` = `'MANUAL'` (único valor en esta fase)

---

## Capability 1: Loan Disbursement

### Descripción
Admin desembolsa una solicitud de préstamo APPROVED. Crea un Loan (ACTIVE), genera N cuotas (sistema francés), registra la transacción de desembolso, y actualiza la aplicación a ACTIVE.

### Triggers
- POST `/api/admin/loans/:id/disburse`
- Autenticación: JWT + AdminGuard
- Solo aplicaciones con status `APPROVED`

### Given/When/Then

**Escenario 1: Desembolso exitoso**
- Given: una aplicación APPROVED de $10,000 a 12 meses, 12% anual
- When: admin hace POST `/api/admin/loans/:id/disburse`
- Then: se crea Loan con status ACTIVE, outstandingBalance = $10,000
- And: se generan 12 installments con cuota fija de $888.49
- And: se crea LoanTransaction tipo DISBURSEMENT por $10,000
- And: aplicación pasa a status ACTIVE
- And: primera cuota vence en 30 días desde disbursedAt

**Escenario 2: Aplicación no encontrada**
- Given: un ID de aplicación que no existe
- When: admin hace POST al endpoint
- Then: responde 404 con LOAN_NOT_FOUND

**Escenario 3: Aplicación no está APPROVED**
- Given: una aplicación en status PENDING
- When: admin hace POST al endpoint
- Then: responde 409 con LOAN_STATUS_TRANSITION_ERROR

**Escenario 4: Doble desembolso (race condition)**
- Given: una aplicación APPROVED que ya fue desembolsada (otro admin)
- When: admin hace POST al endpoint simultáneamente
- Then: responde 409 con LOAN_ALREADY_DISBURSED
- And: no se crean duplicados (unique constraint en applicationId)

**Escenario 5: Términos extremos — monto mínimo**
- Given: una aplicación APPROVED de $100 a 3 meses, 12% anual
- When: admin desembolsa
- Then: se crean 3 installments, todas con valores > 0

**Escenario 6: Términos extremos — plazo máximo**
- Given: una aplicación APPROVED de $50,000 a 120 meses, 10% anual
- When: admin desembolsa
- Then: se crean 120 installments correctamente calculadas

### Validation Rules
| Regla | Error |
|-------|-------|
| `application.status === 'APPROVED'` | LoanStatusTransitionError (409) |
| `application.reviewerId === adminId` | LoanNotOwnedByCustomerError (404) |
| `Loan.applicationId` unique constraint | LoanAlreadyDisbursedError (409) |
| `amount > 0` | (validado por dominio de LoanApplication, se reusa) |
| `termMonths >= 3 && termMonths <= 120` | (validado por LoanApplication) |

### Error Cases
| Error | Código | HTTP | Causa |
|-------|--------|------|-------|
| LoanNotFoundError | LOAN_NOT_FOUND | 404 | Aplicación no existe |
| LoanStatusTransitionError | LOAN_STATUS_TRANSITION_ERROR | 409 | Aplicación no está APPROVED o transición inválida |
| LoanNotOwnedByCustomerError | LOAN_NOT_OWNED | 404 | Admin no es el reviewer asignado |
| LoanAlreadyDisbursedError | LOAN_ALREADY_DISBURSED | 409 | La aplicación ya tiene un Loan asociado |

### Data Contracts

#### Request
```typescript
// POST /api/admin/loans/:id/disburse
// Body: vacío (no requiere datos adicionales)
```

#### Response — 201 Created
```typescript
interface DisburseLoanResponse {
  loan: {
    id: string;
    applicationId: string;
    customerId: string;
    amount: number;
    termMonths: number;
    annualRate: number;
    monthlyPayment: number;
    totalInterest: number;
    totalPayment: number;
    outstandingBalance: number;
    status: 'ACTIVE';
    disbursedAt: string;       // ISO 8601
    paidAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
  installments: InstallmentItemResponse[];
  transaction: {
    id: string;
    type: 'DISBURSEMENT';
    amount: number;
    method: 'MANUAL' | null;
    reference: string | null;
    recordedAt: string;
  };
}

interface InstallmentItemResponse {
  id: string;
  number: number;
  dueDate: string;         // ISO 8601
  amount: number;          // cuota fija
  interest: number;
  principal: number;
  balanceBefore: number;
  balanceAfter: number;
  status: 'PENDING';
}
```

#### Cálculo de amortización — Detalle

```
r = annualRate / 12 / 100
cuota = P * (r * (1 + r)^n) / ((1 + r)^n - 1)

Para cada período i (1..n):
  interés_i     = balance_{i-1} * r          (redondeado a 2 decimales)
  principal_i   = cuota - interés_i          (redondeado a 2 decimales)
  balance_i     = balance_{i-1} - principal_i (redondeado a 2 decimales)

Si balance_i < 0 por redondeo → balance_i = 0
Si la suma de principal_i ≠ P original → ajustar última cuota
```

`ponytail: El cálculo reusa la función `calculateLoan()` existente en `shared/loan-calculator.ts`. Se genera el schedule inline en el handler, no como servicio separado. Extraer cuando haya múltiples métodos de amortización.`

---

## Capability 2: Installment Schedule

### Descripción
Generación del cronograma de pagos al desembolsar un préstamo. Produce N cuotas mensuales fijas (sistema francés) que se persisten como registros `Installment`.

### Triggers
- Es parte del flujo de desembolso (Capability 1), no es un endpoint independiente
- Se ejecuta dentro de la transacción de desembolso

### Given/When/Then

**Escenario 1: Schedule 12 meses estándar**
- Given: Loan de $10,000, 12% anual, 12 meses, cuota de $888.49
- When: se genera el schedule
- Then: 12 cuotas, cada una de $888.49
- And: suma de all principal = $10,000
- And: suma de all interest = $661.85 (totalInterest redondeado)
- And: balanceAfter de la cuota 12 = $0.00
- And: primera cuota: dueDate = disbursedAt + 30 días
- And: cuota 12: dueDate = disbursedAt + 360 días

**Escenario 2: Ajuste de la última cuota por redondeo**
- Given: un cálculo donde la suma de principal no cuadra exactamente por redondeo
- When: se genera el schedule
- Then: la última cuota se ajusta para que balanceAfter = 0
- And: la diferencia de ajuste es < $0.02
- `ponytail: No se persiste un schedule JSON. Se reconstruye desde las cuotas si es necesario.`

**Escenario 3: Fecha de vencimiento en fin de mes**
- Given: desembolso el 31 de enero
- When: se generan cuotas
- Then: cuota 1 vence el 2 de marzo (31 enero + 30 días = 2 marzo, o 28 feb si febrero tiene 28? ¡no! 30 días después de 31 enero es 2 marzo)
- `ponytail: dueDate = disbursedAt + (30 * number) días. Simple, no calendario exacto. Suficiente para cuotas mensuales. Si se requiere mes calendario exacto, implementar luego.`

### Validation Rules

| Regla | Motivo |
|-------|--------|
| `termMonths` entre 3 y 120 | Límites de producto |
| `amount` > 0 | Sin préstamos de $0 |
| `annualRate` > 0 y <= 36 | Tasa máxima legal |

---

## Capability 3: Active Loan Query

### Descripción
Cliente autenticado consulta sus préstamos activos. Incluye listado, detalle con cronograma de cuotas, y dashboard con resumen.

### Triggers
- GET `/api/loans/active` — Listar préstamos activos del cliente
- GET `/api/loans/active/:id` — Detalle de un préstamo con cuotas
- Autenticación: JWT + CustomerGuard

### Given/When/Then

**Escenario 1: Listar préstamos activos — hay resultados**
- Given: customer con 2 préstamos activos (status ACTIVE)
- When: GET `/api/loans/active`
- Then: responde 200 con array de 2 préstamos
- And: cada item incluye: id, amount, monthlyPayment, outstandingBalance, status, nextInstallment (monto + fecha), totalPaid, totalPending, progress (paid / total installments)

**Escenario 2: Listar préstamos activos — sin resultados**
- Given: customer sin préstamos activos
- When: GET `/api/loans/active`
- Then: responde 200 con `{ data: [] }`

**Escenario 3: Listar excluye préstamos PAID/DEFAULTED**
- Given: customer con 1 ACTIVE, 1 PAID, 1 DEFAULTED
- When: GET `/api/loans/active`
- Then: solo retorna el ACTIVE

**Escenario 4: Detalle con cronograma completo**
- Given: un préstamo activo con 12 cuotas (3 PAID, 9 PENDING)
- When: GET `/api/loans/active/:id`
- Then: responde 200 con loan detail + installments[]
- And: installments ordenados por number ASC
- And: cada installment tiene status, dueDate, amount, paidAt si aplica

**Escenario 5: Detalle de préstamo que no pertenece al cliente**
- Given: un préstamo que pertenece a otro customer
- When: customer autenticado hace GET `/api/loans/active/:id`
- Then: responde 404 con LOAN_NOT_FOUND (no revelar existencia)

**Escenario 6: Dashboard — saldo total**
- Given: customer con ACTIVE loans
- When: GET `/api/loans/active`
- Then: campo `summary` con: totalOutstandingBalance, nextPaymentAmount, nextPaymentDate, totalActiveLoans

### Validation Rules

| Regla | Error |
|-------|-------|
| `loan.customerId === customer.id` | LoanNotFoundError (404) — no revelar pertenencia |

### Error Cases
| Error | HTTP | Causa |
|-------|------|-------|
| LoanNotFoundError | 404 | ID no existe o no pertenece al customer |
| — | 401 | Token inválido/expirado |
| — | 403 | Cliente no tiene Customer asociado |

### Data Contracts

#### Response — GET /api/loans/active
```typescript
interface ActiveLoanListResponse {
  data: ActiveLoanSummary[];
  summary: {
    totalOutstandingBalance: number;
    nextPaymentAmount: number;
    nextPaymentDate: string | null;
    totalActiveLoans: number;
  };
}

interface ActiveLoanSummary {
  id: string;
  amount: number;
  monthlyPayment: number;
  outstandingBalance: number;
  status: ActiveLoanStatus;
  disbursedAt: string;
  nextInstallment: {
    number: number;
    dueDate: string;
    amount: number;
    status: string;
  } | null;
  progress: {
    paidCount: number;
    totalCount: number;
    percentage: number;  // 0–100
  };
}
```

#### Response — GET /api/loans/active/:id
```typescript
interface ActiveLoanDetailResponse {
  id: string;
  amount: number;
  termMonths: number;
  annualRate: number;
  monthlyPayment: number;
  totalInterest: number;
  totalPayment: number;
  outstandingBalance: number;
  status: ActiveLoanStatus;
  disbursedAt: string;
  paidAt: string | null;
  installments: InstallmentItemResponse[];
  transactions: TransactionSummary[];
}

interface InstallmentItemResponse {
  id: string;
  number: number;
  dueDate: string;
  amount: number;
  interest: number;
  principal: number;
  balanceBefore: number;
  balanceAfter: number;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  paidAt: string | null;
}

interface TransactionSummary {
  id: string;
  type: 'DISBURSEMENT' | 'PAYMENT' | 'ADJUSTMENT';
  amount: number;
  method: 'MANUAL' | null;
  reference: string | null;
  createdAt: string;
}
```

---

## Capability 4: Payment Registration

### Descripción
Admin registra un pago manual de una cuota. Aplica el pago a la siguiente cuota no pagada, crea un LoanTransaction tipo PAYMENT, actualiza el balance del Loan, y si todas las cuotas están pagadas, marca el Loan como PAID.

### Triggers
- POST `/api/admin/payments`
- Body: `{ loanId: string, amount: number, method: 'CASH' | 'TRANSFER', reference?: string, notes?: string }`
- Autenticación: JWT + AdminGuard

### Given/When/Then

**Escenario 1: Pago completo de cuota vigente**
- Given: Loan ACTIVE, cuota #3 es PENDING, cuota #3.amount = $888.49
- When: admin registra pago de $888.49
- Then: installment #3.status = PAID, paidAt = now
- And: Loan.outstandingBalance -= $888.49 (componente principal de la cuota)
- And: LoanTransaction tipo PAYMENT creado con amount $888.49
- And: LoanTransaction.installmentId apunta a cuota #3

**Escenario 2: Pago mayor a la cuota — pago adelantado**
- Given: cuota #3 PENDING por $888.49
- Given: cuota #4 PENDING por $888.49
- When: admin registra pago de $1,776.98
- Then: cuota #3 se marca PAID
- Then: cuota #4 se marca PAID
- And: se crea un solo LoanTransaction por $1,776.98
- `ponytail: El pago se aplica secuencialmente a las siguientes cuotas no pagadas (FIFO). No hay asignación manual por cuota. Si sobra después de pagar todas las cuotas pendientes, el excedente se ignora (se registra pero no se aplica).`

**Escenario 3: Pago completo de todas las cuotas → Loan PAID**
- Given: Loan ACTIVE con 1 cuota PENDING restante, outstandingBalance = $500
- When: admin paga la última cuota
- Then: installment.status = PAID
- And: Loan.outstandingBalance = 0
- And: Loan.status = 'PAID'
- And: Loan.paidAt = now

**Escenario 4: Pago en cuota con status OVERDUE**
- Given: cuota #3 tiene status OVERDUE (venció y no se pagó)
- When: admin registra pago
- Then: cuota #3 se marca PAID normalmente
- And: no hay mora/cargo extra (out of scope en esta fase)
- `ponytail: No hay cálculo de mora en esta fase. Installment OVERDUE se comporta igual que PENDING para pagos.`

**Escenario 5: Pago en préstamo ya PAID**
- Given: Loan con status PAID
- When: admin registra pago
- Then: responde 409 con LOAN_ALREADY_PAID

**Escenario 6: Pago de $0**
- Given: cuota PENDING
- When: admin registra pago de $0
- Then: responde 422 con PAYMENT_AMOUNT_INVALID
- `ponytail: Se valida amount > 0 en el schema Zod.`

**Escenario 7: Pago parcial (menor a la cuota)**
- Given: cuota #3 PENDING por $888.49
- When: admin registra pago de $500.00
- Then: responde 422 con PARTIAL_PAYMENT_NOT_SUPPORTED
- And: no se modifica ningún installment
- `ponytail: Fuera de scope en esta fase. Solo pago completo de cuota(s).`

**Escenario 8: Préstamo no encontrado**
- Given: loanId que no existe
- When: admin registra pago
- Then: responde 404 con LOAN_NOT_FOUND

**Escenario 9: Pago en cuota ya PAID**
- Given: cuota #3 ya tiene status PAID
- When: admin registra pago que cubre cuota #3
- Then: se salta cuota #3 (ya está pagada) y aplica a cuota #4 (la siguiente PENDING)
- And: si el monto solo alcanza para cuotas ya pagadas, responde 409 con NO_PENDING_INSTALLMENTS

### Validation Rules

| Regla | Error | HTTP |
|-------|-------|------|
| `amount > 0` | PAYMENT_AMOUNT_INVALID | 422 |
| `method` in ['CASH', 'TRANSFER'] | Zod validation | 400 |
| `loanId` existe | LoanNotFoundError | 404 |
| `loan.status === 'ACTIVE'` | LoanAlreadyPaidError | 409 |
| amount >= nextPendingInstallment.amount | PARTIAL_PAYMENT_NOT_SUPPORTED | 422 |
| Hay al menos una cuota PENDING | NO_PENDING_INSTALLMENTS | 409 |

### Error Cases
| Error | Código | HTTP | Causa |
|-------|--------|------|-------|
| LoanNotFoundError | LOAN_NOT_FOUND | 404 | loanId inválido |
| LoanAlreadyPaidError | LOAN_ALREADY_PAID | 409 | Loan ya está PAID |
| PaymentAmountInvalidError | PAYMENT_AMOUNT_INVALID | 422 | amount <= 0 |
| PartialPaymentNotSupportedError | PARTIAL_PAYMENT_NOT_SUPPORTED | 422 | amount < installment.amount |
| NoPendingInstallmentsError | NO_PENDING_INSTALLMENTS | 409 | Todas las cuotas ya están pagadas |

### Data Contracts

#### Request
```typescript
// POST /api/admin/payments
interface RegisterPaymentInput {
  loanId: string;          // UUID
  amount: number;          // > 0, debe ser >= nextPendingInstallment.amount
  method: 'CASH' | 'TRANSFER';
  reference?: string;      // número de recibo/referencia externa (max 100 chars)
  notes?: string;          // opcional (max 500 chars)
}
```

Schema Zod en `packages/shared/src/schemas/loan.schema.ts`:
```typescript
export const RegisterPaymentSchema = z.object({
  loanId: z.string().uuid(),
  amount: z.number().positive(),
  method: z.enum(['CASH', 'TRANSFER']),
  reference: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});
```

#### Response — 201 Created
```typescript
interface RegisterPaymentResponse {
  transaction: {
    id: string;
    loanId: string;
    type: 'PAYMENT';
    amount: number;
    method: 'CASH' | 'TRANSFER';
    reference: string | null;
    notes: string | null;
    installmentId: string;
    recordedById: string;
    createdAt: string;
  };
  installmentsPaid: Array<{
    id: string;
    number: number;
    status: 'PAID';
    paidAt: string;
  }>;
  loanStatus: 'ACTIVE' | 'PAID';
  outstandingBalance: number;
}
```

---

## Capability 5: Admin Loan Management

### Descripción
Admin lista y ve detalle de préstamos desembolsados. Incluye filtros de estado, fechas y búsqueda. El detalle muestra el cronograma completo, transacciones, y datos del cliente.

### Triggers
- GET `/api/admin/loans/active` — Listar préstamos desembolsados
- GET `/api/admin/loans/active/:id` — Detalle de un préstamo con cuotas y transacciones
- Autenticación: JWT + AdminGuard

### Given/When/Then

**Escenario 1: Listar préstamos con filtros**
- Given: 20 préstamos en DB con varios estados
- When: GET `/api/admin/loans/active?status=ACTIVE&page=1&limit=10`
- Then: responde 200 con paginación, 10 items por página
- And: solo préstamos con status ACTIVE

**Escenario 2: Filtro por fechas**
- Given: préstamos desembolsados en diferentes meses
- When: GET `/api/admin/loans/active?dateFrom=2025-01-01&dateTo=2025-03-31`
- Then: solo préstamos con disbursedAt en ese rango

**Escenario 3: Detalle con datos completos**
- Given: préstamo activo con cuotas y transacciones
- When: GET `/api/admin/loans/active/:id`
- Then: responde con loan detail, installments[], transactions[], y customer data (firstName, lastName, documentNumber, phone)
- And: installments ordenados por number ASC

**Escenario 4: Detalle de préstamo inexistente**
- Given: ID que no existe
- When: GET `/api/admin/loans/active/:id`
- Then: responde 404 con LOAN_NOT_FOUND

**Escenario 5: Botón desembolsar en Review Detail**
- Given: GET `/api/admin/loans/:id` retorna aplicación APPROVED
- Then: el frontend muestra botón "Desembolsar"
- And: al hacer clic, POST a `/api/admin/loans/:id/disburse`
- `ponytail: El admin query existente ya retorna application.status. El frontend decide si mostrar el botón. No hay cambio en el backend.`

### Validation Rules

| Regla | Error |
|-------|-------|
| Paginación: page >= 1, limit 1–100 | Zod validation |
| Fechas en ISO 8601 | Zod validation |

### Error Cases
| Error | HTTP | Causa |
|-------|------|-------|
| LoanNotFoundError | 404 | ID de préstamo no existe |
| Zod validation | 400 | Parámetros de query inválidos |

### Data Contracts

#### Query — GET /api/admin/loans/active
```typescript
interface AdminActiveLoanQuery {
  status?: ActiveLoanStatus;
  page?: number;        // default 1
  limit?: number;       // default 20, max 100
  dateFrom?: string;    // ISO 8601
  dateTo?: string;      // ISO 8601
  search?: string;      // búsqueda por nombre de cliente o documento
}
```

Schema Zod:
```typescript
export const AdminActiveLoanQuerySchema = z.object({
  status: z.enum(['ACTIVE', 'PAID', 'DEFAULTED', 'WRITTEN_OFF']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().max(100).optional(),
});
```

#### Response — GET /api/admin/loans/active
```typescript
interface AdminActiveLoanListResponse {
  data: AdminActiveLoanListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface AdminActiveLoanListItem {
  id: string;
  amount: number;
  monthlyPayment: number;
  outstandingBalance: number;
  status: ActiveLoanStatus;
  disbursedAt: string;
  termMonths: number;
  customer: {
    id: string;
    firstName: string;
    lastName: string | null;
    documentNumber: string | null;
  };
  progress: {
    paidCount: number;
    totalCount: number;
  };
}
```

#### Response — GET /api/admin/loans/active/:id
```typescript
interface AdminActiveLoanDetailResponse {
  loan: {
    id: string;
    applicationId: string;
    amount: number;
    termMonths: number;
    annualRate: number;
    monthlyPayment: number;
    totalInterest: number;
    totalPayment: number;
    outstandingBalance: number;
    status: ActiveLoanStatus;
    disbursedAt: string;
    paidAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
  customer: {
    id: string;
    firstName: string;
    lastName: string | null;
    documentType: string | null;
    documentNumber: string | null;
    phone: string | null;
  };
  installments: InstallmentItemResponse[];
  transactions: TransactionSummary[];
}
```

---

## Capability 6: Amortization Calculator (Domain Utility)

### Descripción
Función pura de dominio que calcula cuota fija y schedule completo (sistema francés). Se ejecuta al desembolsar.

### Ubicación
`apps/api/src/loans/domain/value-objects/amortization.ts`

### Given/When/Then

**Escenario 1: Cálculo estándar**
- Given: P = 10000, r = 12%/año (1% mensual), n = 12
- When: calculateAmortization(10000, 12, 12)
- Then: monthlyPayment = 888.49
- And: totalInterest = 661.85
- And: totalPayment = 10661.85
- And: schedule[0] = { period: 1, payment: 888.49, interest: 100.00, principal: 788.49, balance: 9211.51 }

**Escenario 2: Última cuota salda exactamente**
- Given: schedule[11] (última cuota)
- Then: principal_12 = balanceBefore_12 (salda exacto)
- And: balanceAfter_12 = 0

**Escenario 3: Redondeo — diferencia absorbida en última cuota**
- Given: cualquier cálculo donde la suma de principal != P por redondeo
- Then: la última cuota se ajusta para que balanceAfter = 0
- And: la diferencia de ajuste es < n * 0.01

**Escenario 4: Tasa 0%**
- Given: r = 0
- When: calculateAmortization(10000, 0, 12)
- Then: monthlyPayment = 833.33 (10000 / 12)
- And: totalInterest = 0
- And: cada cuota principal = 833.33, interest = 0
- `ponytail: Tasa 0 no debería ocurrir en producción (el producto mínimo es > 0), pero la función lo maneja correctamente sin división por cero.`

### Firma

```typescript
// apps/api/src/loans/domain/value-objects/amortization.ts

export interface AmortizationRow {
  number: number;
  dueDate: string;       // ISO 8601
  amount: number;        // cuota fija
  interest: number;
  principal: number;
  balanceBefore: number;
  balanceAfter: number;
}

export interface AmortizationResult {
  monthlyPayment: number;
  totalInterest: number;
  totalPayment: number;
  schedule: AmortizationRow[];
}

export function calculateAmortization(
  amount: number,
  annualRate: number,
  termMonths: number,
  disbursedAt: Date,
): AmortizationResult;
```

`ponytail: Reusa `calculateLoan()` de `shared/loan-calculator.ts` internamente. La capa de dominio llama a esta función, no a la de shared directamente, para mantener el cálculo dentro del módulo loans y facilitar ajustes futuros específicos de amortización.`

---

## Efectos Colaterales

### Frontend — Resumen de cambios

| Ruta | Cambio |
|------|--------|
| `/portal/loans` | Nueva sección "Préstamos Activos" arriba de "Solicitudes" |
| `/portal/loans/active/[id]` | Nueva página: detalle con cronograma de cuotas |
| `/admin/loans/[id]` | Botón "Desembolsar" cuando status === APPROVED |
| `/admin/payments` | Nueva página: lista de préstamos activos + modal de pago |

### Backend — Nuevos archivos

```
apps/api/src/loans/
├── domain/
│   ├── loan.entity.ts                # Entidad Loan
│   ├── loan.errors.ts                # LoanAlreadyDisbursedError, LoanAlreadyPaidError, etc.
│   ├── loan.repository.ts            # Puerto repositorio
│   ├── installment.entity.ts         # Entidad Installment
│   ├── loan-transaction.vo.ts        # VO LoanTransaction
│   └── value-objects/
│       └── amortization.ts           # Cálculo amortización francés
├── application/
│   ├── disburse-loan/
│   │   └── disburse-loan.handler.ts
│   ├── register-payment/
│   │   └── register-payment.handler.ts
│   ├── get-active-loan/
│   │   └── get-active-loan.handler.ts
│   └── list-active-loans/
│       └── list-active-loans.handler.ts
├── infrastructure/
│   └── persistence/
│       └── prisma-loan.repository.ts
├── presentation/
│   ├── active-loan.controller.ts     # Cliente: GET /api/loans/active
│   └── admin-payment.controller.ts   # Admin: POST /api/admin/payments, GET /api/admin/loans/active
└── loans.tokens.ts                   # + LOAN_REPOSITORY, ACTIVE_LOAN_QUERY
```

### Shared — Nuevos tipos y schemas

```
packages/shared/src/
├── types/loan.types.ts      # + ActiveLoanResponse, InstallmentResponse, PaymentResponse, etc.
├── schemas/loan.schema.ts   # + RegisterPaymentSchema, AdminActiveLoanQuerySchema
└── index.ts                 # (auto, re-exporta lo nuevo)
```

---

## Pruebas de aprobación (curl)

### Desembolso exitoso
```bash
# 1. Obtener token admin
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"phone":"77777777","password":"admin123"}' | jq -r '.accessToken')

# 2. Crear y aprobar aplicación (simplificado — asume customer existe)
APP_ID="<application-id-APPROVED>"

# 3. Desembolsar
curl -s -X POST "http://localhost:3001/api/admin/loans/$APP_ID/disburse" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' | jq .

# Verificar: response tiene loan, installments[], transaction
# Verificar: installments.length === application.termMonths
# Verificar: installments[0].dueDate es ~30 días después
```

### Doble desembolso
```bash
# Debe fallar con 409
curl -s -o /dev/null -w "%{http_code}" \
  -X POST "http://localhost:3001/api/admin/loans/$APP_ID/disburse" \
  -H "Authorization: Bearer $TOKEN"
# → 409
```

### Registrar pago
```bash
curl -s -X POST http://localhost:3001/api/admin/payments \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "loanId": "<loan-id>",
    "amount": 888.49,
    "method": "CASH",
    "reference": "REC-001"
  }' | jq .

# Verificar: transaction.type === "PAYMENT"
# Verificar: installmentsPaid[0].status === "PAID"
# Verificar: outstandingBalance decrementó
```

### Listar préstamos activos (cliente)
```bash
CUSTOMER_TOKEN="..."
curl -s http://localhost:3001/api/loans/active \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" | jq .
```
