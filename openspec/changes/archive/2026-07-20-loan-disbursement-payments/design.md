# Design: Fase 5 — Préstamos Activos y Pagos

> Basado en `proposal.md` y `specs.md`. Sigue las convenciones existentes del módulo `loans/`.
> Todas las decisiones `ponytail:` están marcadas.

---

## 1. Data Model — Prisma

### 1.1 Tablas nuevas

Se agregan al final de `apps/api/prisma/schema.prisma`, antes del modelo `PortalAction` (o al final del archivo, sin romper el orden alfabético existente).

```prisma
// --- Loan Disbursement & Payments (Fase 5) ---

model Loan {
  id                 String   @id @default(uuid())
  applicationId      String   @unique
  application        LoanApplication @relation(fields: [applicationId], references: [id])
  customerId         String
  customer           Customer @relation(fields: [customerId], references: [id])
  amount             Decimal  @db.Decimal(18, 2)
  termMonths         Int
  annualRate         Decimal  @db.Decimal(10, 6)
  monthlyPayment     Decimal  @db.Decimal(18, 2)
  totalInterest      Decimal  @db.Decimal(18, 2)
  totalPayment       Decimal  @db.Decimal(18, 2)
  outstandingBalance Decimal  @db.Decimal(18, 2)
  status             String   @default("ACTIVE")  // ACTIVE | PAID | DEFAULTED | WRITTEN_OFF
  disbursedAt        DateTime @default(now())
  paidAt             DateTime?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  installments Installment[]
  transactions LoanTransaction[]

  @@index([customerId])
  @@index([status])
  @@index([createdAt])
}

model Installment {
  id            String   @id @default(uuid())
  loanId        String
  loan          Loan     @relation(fields: [loanId], references: [id], onDelete: Cascade)
  number        Int      // 1-indexed
  dueDate       DateTime
  paidAt        DateTime?
  status        String   @default("PENDING")  // PENDING | PAID | OVERDUE | DEFAULTED

  amount        Decimal  @db.Decimal(18, 2)   // cuota fija (sistema francés)
  interest      Decimal  @db.Decimal(18, 2)   // componente interés
  principal     Decimal  @db.Decimal(18, 2)   // componente capital
  balanceBefore Decimal  @db.Decimal(18, 2)   // saldo antes de pagar esta cuota
  balanceAfter  Decimal  @db.Decimal(18, 2)   // saldo después de pagar esta cuota

  payment       LoanTransaction?  // ponytail: relación 1:1 opcional, se completa al pagar

  @@unique([loanId, number])
  @@index([loanId])
  @@index([status])
  @@index([dueDate])
}

model LoanTransaction {
  id            String   @id @default(uuid())
  loanId        String
  loan          Loan     @relation(fields: [loanId], references: [id], onDelete: Cascade)
  type          String   // DISBURSEMENT | PAYMENT | ADJUSTMENT
  amount        Decimal  @db.Decimal(18, 2)
  method        String?  // MANUAL | CASH | TRANSFER (null para DISBURSEMENT)
  installmentId String?
  installment   Installment? @relation(fields: [installmentId], references: [id])
  reference     String?  // número de recibo/referencia externa
  notes         String?
  recordedById  String
  recordedBy    User     @relation(fields: [recordedById], references: [id])
  createdAt     DateTime @default(now())

  @@index([loanId])
  @@index([type])
  @@index([recordedById])
}
```

### 1.2 Cambios a modelos existentes

**`LoanApplication`**: Agregar `ACTIVE` al estado. No requiere nueva columna — el string `"ACTIVE"` ya es válido. El `@@index([status])` existente cubre la búsqueda.

**`Loan` references `Customer`**: Loan.customerId referencia Customer.id, no User.id. Esto es consistente con LoanApplication.customerId.

### 1.3 Relaciones clave

```
LoanApplication 1──0..1 Loan 1──* Installment
                          1──* LoanTransaction
```

- `Loan.applicationId @unique`: garantiza un único desembolso por aplicación.
- `Installment.@@unique([loanId, number])`: evita duplicados en el schedule.
- `LoanTransaction.installmentId`: opcional, se setea solo para transacciones PAYMENT.

### 1.4 Índices cubiertos

| Tabla | Índice | Query que soporta |
|-------|--------|--------------------|
| Loan | `@@index([customerId])` | GET /api/loans/active (lista del cliente) |
| Loan | `@@index([status])` | GET /api/admin/loans/active?status=... |
| Loan | `@@index([createdAt])` | GET /api/admin/loans/active?dateFrom=...&dateTo=... |
| Installment | `@@index([loanId])` | GET /api/loans/active/:id (cargar cuotas) |
| Installment | `@@index([status])` | Filtrar cuotas OVERDUE, contar PAID |
| Installment | `@@index([dueDate])` | Próxima cuota por vencer (dashboard) |
| LoanTransaction | `@@index([loanId])` | Historial de transacciones del préstamo |
| LoanTransaction | `@@index([type])` | Estadísticas por tipo |

---

## 2. Domain Model

### 2.1 Value Objects

**`ActiveLoanStatus`** — enum separado del LoanStatus de aplicaciones.

```typescript
// apps/api/src/loans/domain/value-objects/active-loan-status.ts
export const ACTIVE_LOAN_STATUSES = ['ACTIVE', 'PAID', 'DEFAULTED', 'WRITTEN_OFF'] as const;
export type ActiveLoanStatus = typeof ACTIVE_LOAN_STATUSES[number];

export const ACTIVE_LOAN_TRANSITIONS: Record<ActiveLoanStatus, ActiveLoanStatus[]> = {
  ACTIVE:       ['PAID', 'DEFAULTED'],
  PAID:         [],
  DEFAULTED:    ['WRITTEN_OFF'],
  WRITTEN_OFF:  [],
};

export function canTransitionActiveLoan(from: ActiveLoanStatus, to: ActiveLoanStatus): boolean {
  return ACTIVE_LOAN_TRANSITIONS[from]?.includes(to) ?? false;
}
```

**`InstallmentStatus`** — status de cuotas.

```typescript
// apps/api/src/loans/domain/value-objects/installment-status.ts
export const INSTALLMENT_STATUSES = ['PENDING', 'PAID', 'OVERDUE', 'DEFAULTED'] as const;
export type InstallmentStatus = typeof INSTALLMENT_STATUSES[number];
```

**`PaymentMethod`** — métodos de pago (solo MANUAL, CASH, TRANSFER en esta fase).

```typescript
// apps/api/src/loans/domain/value-objects/payment-method.ts
export const PAYMENT_METHODS = ['MANUAL', 'CASH', 'TRANSFER'] as const;
export type PaymentMethod = typeof PAYMENT_METHODS[number];
```

**`TransactionType`** — tipos de transacción financiera.

```typescript
// apps/api/src/loans/domain/value-objects/transaction-type.ts
export const TRANSACTION_TYPES = ['DISBURSEMENT', 'PAYMENT', 'ADJUSTMENT'] as const;
export type TransactionType = typeof TRANSACTION_TYPES[number];
```

**`AmortizationCalculator`** — función pura de dominio (ver sección 4.2).

### 2.2 Entities

#### Loan Entity

```typescript
// apps/api/src/loans/domain/loan.entity.ts
import type { ActiveLoanStatus } from './value-objects/active-loan-status';
import type { Installment } from './installment.entity';
import type { LoanTransaction } from './loan-transaction.vo';

export class Loan {
  constructor(
    public readonly id: string,
    public readonly applicationId: string,
    public readonly customerId: string,
    public amount: number,
    public termMonths: number,
    public annualRate: number,
    public monthlyPayment: number,
    public totalInterest: number,
    public totalPayment: number,
    public outstandingBalance: number,
    public status: ActiveLoanStatus,
    public readonly disbursedAt: string,
    public paidAt: string | null,
    public readonly createdAt: string,
    public readonly updatedAt: string,
    public installments: Installment[],
    public transactions: LoanTransaction[],
  ) {}

  close(): void {
    this.status = 'PAID';
    this.paidAt = new Date().toISOString();
    this.outstandingBalance = 0;
  }
}
```

`ponytail: Loan no tiene métodos de dominio complejos más allá de `close()`. No hay eventos, no hay validación de transiciones inline (se hace en el handler). Agregar cuando haya reglas de negocio en la entidad misma.`

#### Installment Entity

```typescript
// apps/api/src/loans/domain/installment.entity.ts
import type { InstallmentStatus } from './value-objects/installment-status';

export class Installment {
  constructor(
    public readonly id: string,
    public readonly loanId: string,
    public readonly number: number,
    public readonly dueDate: string,
    public paidAt: string | null,
    public status: InstallmentStatus,
    public readonly amount: number,      // cuota fija
    public readonly interest: number,    // componente interés (fijo al crear)
    public readonly principal: number,   // componente capital (fijo al crear)
    public readonly balanceBefore: number,
    public readonly balanceAfter: number,
  ) {}

  markAsPaid(): void {
    this.status = 'PAID';
    this.paidAt = new Date().toISOString();
  }
}
```

`ponytail: interés/principal se persisten al desembolsar. No se recalculan. Si se requiere refinanciamiento, será un nuevo préstamo.`

#### LoanTransaction (Value Object)

```typescript
// apps/api/src/loans/domain/loan-transaction.vo.ts
import type { TransactionType } from './value-objects/transaction-type';
import type { PaymentMethod } from './value-objects/payment-method';

export class LoanTransaction {
  constructor(
    public readonly id: string,
    public readonly loanId: string,
    public readonly type: TransactionType,
    public readonly amount: number,
    public readonly method: PaymentMethod | null,
    public readonly installmentId: string | null,
    public readonly reference: string | null,
    public readonly notes: string | null,
    public readonly recordedById: string,
    public readonly createdAt: string,
  ) {}
}
```

`ponytail: Value Object inmutable. No tiene métodos de dominio. Es un ledger entry, no un aggregate.`

### 2.3 Domain Errors

```typescript
// apps/api/src/loans/domain/loan.errors.ts

export class LoanNotFoundError extends Error {
  readonly statusCode = 404;
  readonly code = 'LOAN_NOT_FOUND';
  constructor(id: string) {
    super(`Préstamo no encontrado: ${id}`);
    this.name = 'LoanNotFoundError';
  }
}

export class LoanAlreadyDisbursedError extends Error {
  readonly statusCode = 409;
  readonly code = 'LOAN_ALREADY_DISBURSED';
  constructor() {
    super('Esta solicitud ya fue desembolsada');
    this.name = 'LoanAlreadyDisbursedError';
  }
}

export class LoanAlreadyPaidError extends Error {
  readonly statusCode = 409;
  readonly code = 'LOAN_ALREADY_PAID';
  constructor() {
    super('El préstamo ya está pagado');
    this.name = 'LoanAlreadyPaidError';
  }
}

export class PaymentAmountInvalidError extends Error {
  readonly statusCode = 422;
  readonly code = 'PAYMENT_AMOUNT_INVALID';
  constructor() {
    super('El monto del pago debe ser mayor a 0');
    this.name = 'PaymentAmountInvalidError';
  }
}

export class PartialPaymentNotSupportedError extends Error {
  readonly statusCode = 422;
  readonly code = 'PARTIAL_PAYMENT_NOT_SUPPORTED';
  constructor(amount: number, required: number) {
    super(`El monto (${amount}) debe ser al menos ${required} para cubrir la(s) cuota(s) pendiente(s). Pagos parciales no están soportados.`);
    this.name = 'PartialPaymentNotSupportedError';
  }
}

export class NoPendingInstallmentsError extends Error {
  readonly statusCode = 409;
  readonly code = 'NO_PENDING_INSTALLMENTS';
  constructor() {
    super('No hay cuotas pendientes por pagar');
    this.name = 'NoPendingInstallmentsError';
  }
}
```

### 2.4 Repository Ports

```typescript
// apps/api/src/loans/domain/loan.repository.ts
import type { Loan } from './loan.entity';
import type { ActiveLoanStatus } from './value-objects/active-loan-status';

export interface LoanRepository {
  findById(id: string): Promise<Loan | null>;
  findByCustomerId(customerId: string): Promise<Loan[]>;
  findByApplicationId(applicationId: string): Promise<Loan | null>;
  save(loan: Loan, installments: Installment[], transaction: LoanTransaction): Promise<void>;
  updateStatus(id: string, fromStatus: ActiveLoanStatus, toStatus: string): Promise<boolean>;
  updateOutstandingBalance(id: string, newBalance: number): Promise<void>;
}

export interface InstallmentRepository {
  findByLoanId(loanId: string): Promise<Installment[]>;
  findNextPending(loanId: string): Promise<Installment | null>;
  markAsPaid(id: string): Promise<void>;
  countByStatus(loanId: string, status: string): Promise<number>;
}
```

`ponytail: LoanRepository.save() es transaccional (prisma.$transaction). Recibe Loan + Installments[] + LoanTransaction y los persiste en una sola tx.`

### 2.5 Query Ports

```typescript
// apps/api/src/loans/application/ports/active-loan-query.port.ts
import type {
  ActiveLoanListResponse,
  ActiveLoanDetailResponse,
  AdminActiveLoanListResponse,
  AdminActiveLoanDetailResponse,
} from '@prestamos/shared';

export const ACTIVE_LOAN_QUERY = Symbol('ACTIVE_LOAN_QUERY');

export interface ActiveLoanQuery {
  listByCustomerId(customerId: string): Promise<ActiveLoanListResponse>;
  getDetail(customerId: string, loanId: string): Promise<ActiveLoanDetailResponse | null>;
}

export interface AdminActiveLoanQuery {
  list(params: {
    status?: string;
    page: number;
    limit: number;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  }): Promise<AdminActiveLoanListResponse>;
  getDetail(loanId: string): Promise<AdminActiveLoanDetailResponse | null>;
}
```

---

## 3. Application Layer

### 3.1 Handler: DisburseLoanHandler

```typescript
// apps/api/src/loans/application/disburse-loan/disburse-loan.handler.ts

@Injectable()
export class DisburseLoanHandler {
  constructor(
    @Inject(LOAN_APPLICATION_REPOSITORY) private readonly appRepo: LoanApplicationRepository,
    @Inject(LOAN_REPOSITORY) private readonly loanRepo: LoanRepository,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async execute(adminId: string, applicationId: string): Promise<DisburseLoanResponse> {
    // 1. Leer aplicación — debe existir y estar APPROVED
    // 2. Verificar que el admin sea el reviewer asignado
    // 3. Calcular amortización (sistema francés) usando calculateAmortization()
    // 4. Dentro de prisma.$transaction:
    //    a. Verificar app.status === 'APPROVED' (optimistic lock vía updateMany)
    //    b. Crear Loan + Installments[] + LoanTransaction(DISBURSEMENT)
    //    c. Actualizar app.status a 'ACTIVE'
    // 5. Retornar response con loan + installments + transaction
  }
}
```

**Flujo detallado**:

1. `this.appRepo.findById(applicationId)` — si no existe, lanza `LoanNotFoundError`
2. Si `app.reviewerId !== adminId`, lanza `LoanNotOwnedByCustomerError`
3. `calculateAmortization(amount, annualRate, termMonths, disbursedAt)` — genera schedule
4. Transacción atómica:
   - `this.appRepo.updateStatus(app.id, 'APPROVED', 'ACTIVE', { ... })` — si retorna false, la aplicación cambió de estado (race condition) → lanza `LoanAlreadyDisbursedError`
   - `this.loanRepo.save(loan, installments, disbursementTx)` — crea todo
5. Retorna `DisburseLoanResponse`

**Optimistic locking**: El `updateStatus` en LoanApplication usa `updateMany` con `where: { id, status: 'APPROVED' }`. Si otro admin ya desembolsó, el count será 0 y se detecta la race condition. El `@@unique` en `Loan.applicationId` es la segunda línea de defensa.

`ponytail: El schedule se calcula inline en el handler llamando a calculateAmortization(). No hay un servicio separado. Extraer cuando haya múltiples métodos de amortización.`

### 3.2 Handler: RegisterPaymentHandler

```typescript
// apps/api/src/loans/application/register-payment/register-payment.handler.ts

@Injectable()
export class RegisterPaymentHandler {
  constructor(
    @Inject(LOAN_REPOSITORY) private readonly loanRepo: LoanRepository,
    @Inject(INSTALLMENT_REPOSITORY) private readonly installmentRepo: InstallmentRepository,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async execute(adminId: string, input: RegisterPaymentInput): Promise<RegisterPaymentResponse> {
    // 1. Validar loan existe y está ACTIVE
    // 2. Obtener cuotas PENDING ordenadas por number ASC
    // 3. Aplicar pago FIFO: consumir cuotas hasta agotar el monto
    //    - Si amount < nextPending.amount → lanza PartialPaymentNotSupportedError
    //    - Si no hay PENDING → lanza NoPendingInstallmentsError
    // 4. Dentro de transacción:
    //    a. Marcar cuota(s) como PAID
    //    b. Crear LoanTransaction PAYMENT (única transacción aunque pague múltiples cuotas)
    //    c. Actualizar outstandingBalance del Loan
    //    d. Si todas las cuotas están PAID → Loan.status = 'PAID'
    // 5. Retornar response
  }
}
```

**Reglas de pago** (FIFO):
- El sistema toma las cuotas pendientes ordenadas por `number ASC`
- Si `amount >= installment.amount`, se marca como PAID y se resta del monto
- Se repite hasta que el monto se agote o no haya más cuotas pendientes
- Si `amount > sumOfAllPending` (sobra después de pagar todas), el excedente se ignora — se registra la transacción pero no se aplica a cuotas futuras
- `ponytail: Sin sobrepagos, sin pagos parciales, sin asignación manual por cuota en esta fase`

**Cálculo de outstandingBalance**:
`outstandingBalance -= sum(installment.principal for each paid installment)`

`ponytail: El balance se decrementa por el principal de cada cuota pagada, no por el monto total del pago. Así el outstandingBalance refleja fielmente el saldo de capital.`

### 3.3 Handler: GetActiveLoanHandler

```typescript
// apps/api/src/loans/application/get-active-loan/get-active-loan.handler.ts

@Injectable()
export class GetActiveLoanHandler {
  constructor(
    @Inject(ACTIVE_LOAN_QUERY) private readonly query: ActiveLoanQuery,
  ) {}

  async list(customerId: string): Promise<ActiveLoanListResponse> {
    return this.query.listByCustomerId(customerId);
  }

  async detail(customerId: string, loanId: string): Promise<ActiveLoanDetailResponse> {
    const result = await this.query.getDetail(customerId, loanId);
    if (!result) throw new LoanNotFoundError(loanId);
    return result;
  }
}
```

### 3.4 Handler: ListActiveLoansHandler (admin)

```typescript
// apps/api/src/loans/application/list-active-loans/list-active-loans.handler.ts

@Injectable()
export class ListActiveLoansHandler {
  constructor(
    @Inject(ADMIN_ACTIVE_LOAN_QUERY) private readonly query: AdminActiveLoanQuery,
  ) {}

  async list(params: AdminActiveLoanQueryInput): Promise<AdminActiveLoanListResponse> {
    return this.query.list(params);
  }

  async detail(loanId: string): Promise<AdminActiveLoanDetailResponse> {
    const result = await this.query.getDetail(loanId);
    if (!result) throw new LoanNotFoundError(loanId);
    return result;
  }
}
```

---

## 4. Infrastructure

### 4.1 Repositories

**PrismaLoanRepository**

```typescript
// apps/api/src/loans/infrastructure/persistence/prisma-loan.repository.ts

@Injectable()
export class PrismaLoanRepository implements LoanRepository {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async findById(id: string): Promise<Loan | null> {
    const row = await this.prisma.loan.findUnique({
      where: { id },
      include: { installments: { orderBy: { number: 'asc' } }, transactions: { orderBy: { createdAt: 'asc' } } },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByCustomerId(customerId: string): Promise<Loan[]> {
    const rows = await this.prisma.loan.findMany({
      where: { customerId, status: { in: ['ACTIVE'] } },
      include: { installments: { orderBy: { number: 'asc' } } },
      orderBy: { disbursedAt: 'desc' },
    });
    return rows.map(r => this.toEntity(r));
  }

  async findByApplicationId(applicationId: string): Promise<Loan | null> {
    const row = await this.prisma.loan.findUnique({
      where: { applicationId },
    });
    return row ? this.toEntity(row) : null;
  }

  async save(
    loan: Loan,
    installments: Installment[],
    transaction: LoanTransaction,
  ): Promise<void> {
    // Se ejecuta dentro de prisma.$transaction llamada desde el handler
    await this.prisma.loan.create({
      data: {
        id: loan.id,
        applicationId: loan.applicationId,
        customerId: loan.customerId,
        amount: loan.amount,
        termMonths: loan.termMonths,
        annualRate: loan.annualRate,
        monthlyPayment: loan.monthlyPayment,
        totalInterest: loan.totalInterest,
        totalPayment: loan.totalPayment,
        outstandingBalance: loan.outstandingBalance,
        status: loan.status,
        disbursedAt: new Date(loan.disbursedAt),
        paidAt: null,
        installments: {
          create: installments.map(i => ({
            id: i.id,
            number: i.number,
            dueDate: new Date(i.dueDate),
            amount: i.amount,
            interest: i.interest,
            principal: i.principal,
            balanceBefore: i.balanceBefore,
            balanceAfter: i.balanceAfter,
            status: i.status,
          })),
        },
        transactions: {
          create: {
            id: transaction.id,
            type: transaction.type,
            amount: transaction.amount,
            method: transaction.method,
            recordedById: transaction.recordedById,
            reference: transaction.reference,
            notes: transaction.notes,
          },
        },
      },
    } as never);
  }

  async updateStatus(id: string, fromStatus: ActiveLoanStatus, toStatus: string): Promise<boolean> {
    const result = await this.prisma.loan.updateMany({
      where: { id, status: fromStatus },
      data: { status: toStatus, paidAt: toStatus === 'PAID' ? new Date() : undefined },
    });
    return result.count > 0;
  }

  async updateOutstandingBalance(id: string, newBalance: number): Promise<void> {
    await this.prisma.loan.update({
      where: { id },
      data: { outstandingBalance: newBalance },
    });
  }

  private toEntity(row: PrismaLoanRow): Loan {
    return new Loan(
      row.id, row.applicationId, row.customerId,
      Number(row.amount), row.termMonths, Number(row.annualRate),
      Number(row.monthlyPayment), Number(row.totalInterest), Number(row.totalPayment),
      Number(row.outstandingBalance),
      row.status as ActiveLoanStatus,
      row.disbursedAt.toISOString(),
      row.paidAt?.toISOString() ?? null,
      row.createdAt.toISOString(),
      row.updatedAt.toISOString(),
      (row.installments ?? []).map(i => this.toInstallment(i)),
      (row.transactions ?? []).map(t => this.toTransaction(t)),
    );
  }
}
```

`ponytail: Inline row shape (PrismaLoanRow) en lugar de tipo generado por Prisma — evita problemas de import antes de generar. Mismo patrón que PrismaLoanApplicationRepository.`

**PrismaInstallmentRepository**

```typescript
// apps/api/src/loans/infrastructure/persistence/prisma-installment.repository.ts

@Injectable()
export class PrismaInstallmentRepository implements InstallmentRepository {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async findByLoanId(loanId: string): Promise<Installment[]> {
    const rows = await this.prisma.installment.findMany({
      where: { loanId },
      orderBy: { number: 'asc' },
    });
    return rows.map(r => this.toEntity(r));
  }

  async findNextPending(loanId: string): Promise<Installment | null> {
    const row = await this.prisma.installment.findFirst({
      where: { loanId, status: { in: ['PENDING', 'OVERDUE'] } },
      orderBy: { number: 'asc' },
    });
    return row ? this.toEntity(row) : null;
  }

  async markAsPaid(id: string): Promise<void> {
    await this.prisma.installment.update({
      where: { id },
      data: { status: 'PAID', paidAt: new Date() },
    });
  }

  async countByStatus(loanId: string, status: string): Promise<number> {
    return this.prisma.installment.count({
      where: { loanId, status },
    });
  }

  private toEntity(row: PrismaInstallmentRow): Installment {
    return new Installment(
      row.id, row.loanId, row.number,
      row.dueDate.toISOString(),
      row.paidAt?.toISOString() ?? null,
      row.status as InstallmentStatus,
      Number(row.amount), Number(row.interest), Number(row.principal),
      Number(row.balanceBefore), Number(row.balanceAfter),
    );
  }
}
```

### 4.2 Amortization Calculator

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
): AmortizationResult {
  const monthlyRate = annualRate / 100 / 12;

  // Sistema francés: cuota fija
  const payment =
    (amount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
    (Math.pow(1 + monthlyRate, termMonths) - 1);
  const monthlyPayment = Math.round(payment * 100) / 100;

  let balance = amount;
  const schedule: AmortizationRow[] = [];

  for (let i = 1; i <= termMonths; i++) {
    const interest = Math.round(balance * monthlyRate * 100) / 100;
    const principal = Math.round((monthlyPayment - interest) * 100) / 100;
    const balanceBefore = balance;
    balance = Math.round((balance - principal) * 100) / 100;

    // Última cuota: ajustar para que balanceAfter = 0
    if (i === termMonths) {
      const adjustment = balance; // puede ser negativo por redondeo
      balance = 0;
      schedule.push({
        number: i,
        dueDate: new Date(disbursedAt.getTime() + i * 30 * 24 * 60 * 60 * 1000).toISOString(),
        amount: Math.round((principal + interest + adjustment) * 100) / 100,
        interest,
        principal: Math.round((principal + adjustment) * 100) / 100,
        balanceBefore: balanceBefore,
        balanceAfter: 0,
      });
    } else {
      if (balance < 0) balance = 0;
      schedule.push({
        number: i,
        dueDate: new Date(disbursedAt.getTime() + i * 30 * 24 * 60 * 60 * 1000).toISOString(),
        amount: monthlyPayment,
        interest,
        principal,
        balanceBefore: balanceBefore,
        balanceAfter: balance,
      });
    }
  }

  const totalPayment = Math.round(monthlyPayment * termMonths * 100) / 100;
  const totalInterest = Math.round((totalPayment - amount) * 100) / 100;

  return { monthlyPayment, totalInterest, totalPayment, schedule };
}
```

`ponytail: dueDate = disbursedAt + (30 * number) días. No es calendario exacto. Suficiente para cuotas mensuales. Si se requiere mes calendario exacto (ej: 31 enero → 28 feb), implementar luego.`

`ponytail: Reusa internamente la lógica de `calculateLoan()` de shared/loan-calculator.ts. Esta función de dominio agrega el cálculo de dueDate y wrapping del schedule para el módulo loans.`

### 4.3 Query Implementations

**PrismaActiveLoanQueryImpl** — para el portal del cliente.

```typescript
// apps/api/src/loans/infrastructure/active-loan-query/prisma-active-loan-query.impl.ts

@Injectable()
export class PrismaActiveLoanQueryImpl implements ActiveLoanQuery {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async listByCustomerId(customerId: string): Promise<ActiveLoanListResponse> {
    const loans = await this.prisma.loan.findMany({
      where: { customerId, status: { in: ['ACTIVE'] } },
      include: {
        installments: { orderBy: { number: 'asc' } },
      },
      orderBy: { disbursedAt: 'desc' },
    });

    const data = loans.map(loan => {
      const installments = loan.installments;
      const paidCount = installments.filter(i => i.status === 'PAID').length;
      const totalCount = installments.length;
      const nextInstallment = installments.find(i => i.status === 'PENDING' || i.status === 'OVERDUE');

      return {
        id: loan.id,
        amount: Number(loan.amount),
        monthlyPayment: Number(loan.monthlyPayment),
        outstandingBalance: Number(loan.outstandingBalance),
        status: loan.status as ActiveLoanStatus,
        disbursedAt: loan.disbursedAt.toISOString(),
        nextInstallment: nextInstallment ? {
          number: nextInstallment.number,
          dueDate: nextInstallment.dueDate.toISOString(),
          amount: Number(nextInstallment.amount),
          status: nextInstallment.status,
        } : null,
        progress: {
          paidCount,
          totalCount,
          percentage: totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0,
        },
      };
    });

    const summary = {
      totalOutstandingBalance: data.reduce((s, l) => s + l.outstandingBalance, 0),
      nextPaymentAmount: data.reduce((min, l) => {
        if (!l.nextInstallment) return min;
        return min === 0 ? l.nextInstallment.amount : Math.min(min, l.nextInstallment.amount);
      }, 0),
      nextPaymentDate: data.reduce((earliest, l) => {
        if (!l.nextInstallment) return earliest;
        return !earliest || l.nextInstallment.dueDate < earliest ? l.nextInstallment.dueDate : earliest;
      }, null as string | null),
      totalActiveLoans: data.length,
    };

    return { data, summary };
  }

  async getDetail(customerId: string, loanId: string): Promise<ActiveLoanDetailResponse | null> {
    const loan = await this.prisma.loan.findFirst({
      where: { id: loanId, customerId },
      include: {
        installments: { orderBy: { number: 'asc' } },
        transactions: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!loan) return null;

    return {
      id: loan.id,
      amount: Number(loan.amount),
      termMonths: loan.termMonths,
      annualRate: Number(loan.annualRate),
      monthlyPayment: Number(loan.monthlyPayment),
      totalInterest: Number(loan.totalInterest),
      totalPayment: Number(loan.totalPayment),
      outstandingBalance: Number(loan.outstandingBalance),
      status: loan.status as ActiveLoanStatus,
      disbursedAt: loan.disbursedAt.toISOString(),
      paidAt: loan.paidAt?.toISOString() ?? null,
      installments: loan.installments.map(i => ({
        id: i.id,
        number: i.number,
        dueDate: i.dueDate.toISOString(),
        amount: Number(i.amount),
        interest: Number(i.interest),
        principal: Number(i.principal),
        balanceBefore: Number(i.balanceBefore),
        balanceAfter: Number(i.balanceAfter),
        status: i.status as 'PENDING' | 'PAID' | 'OVERDUE',
        paidAt: i.paidAt?.toISOString() ?? null,
      })),
      transactions: loan.transactions.map(t => ({
        id: t.id,
        type: t.type as 'DISBURSEMENT' | 'PAYMENT' | 'ADJUSTMENT',
        amount: Number(t.amount),
        method: t.method as 'MANUAL' | null,
        reference: t.reference,
        createdAt: t.createdAt.toISOString(),
      })),
    };
  }
}
```

**PrismaAdminActiveLoanQueryImpl** — para el panel admin.

Sigue el mismo patrón que `PrismaAdminQueryImpl` existente. Incluye paginación, filtros, y datos del cliente.

---

## 5. Presentation

### 5.1 Tokens

```typescript
// apps/api/src/loans/loans.tokens.ts (modificado)
export const LOAN_APPLICATION_REPOSITORY = Symbol('LOAN_APPLICATION_REPOSITORY');
export const ADMIN_QUERY = Symbol('ADMIN_QUERY');
export const LOAN_REPOSITORY = Symbol('LOAN_REPOSITORY');
export const INSTALLMENT_REPOSITORY = Symbol('INSTALLMENT_REPOSITORY');
export const ACTIVE_LOAN_QUERY = Symbol('ACTIVE_LOAN_QUERY');
export const ADMIN_ACTIVE_LOAN_QUERY = Symbol('ADMIN_ACTIVE_LOAN_QUERY');
```

### 5.2 Endpoints

#### Portal (Customer) — ActiveLoanController

```typescript
// apps/api/src/loans/presentation/active-loan.controller.ts
@Controller('api/loans/active')
@UseGuards(JwtAuthGuard, CustomerGuard)
export class ActiveLoanController {
  constructor(
    @Inject(GetActiveLoanHandler)
    private readonly handler: GetActiveLoanHandler,
  ) {}

  @Get()
  list(@Req() req: RequestWithCustomer) {
    return this.handler.list(req.customer.id);
  }

  @Get(':id')
  detail(@Req() req: RequestWithCustomer, @Param('id') id: string) {
    return this.handler.detail(req.customer.id, id);
  }
}
```

#### Admin — AdminPaymentController

```typescript
// apps/api/src/loans/presentation/admin-payment.controller.ts
@Controller('api/admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminPaymentController {
  constructor(
    @Inject(DisburseLoanHandler)
    private readonly disburseHandler: DisburseLoanHandler,
    @Inject(RegisterPaymentHandler)
    private readonly paymentHandler: RegisterPaymentHandler,
    @Inject(ListActiveLoansHandler)
    private readonly listHandler: ListActiveLoansHandler,
  ) {}

  @Post('loans/:id/disburse')
  @HttpCode(201)
  disburse(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.disburseHandler.execute(user.sub, id);
  }

  @Post('payments')
  @HttpCode(201)
  registerPayment(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(RegisterPaymentSchema)) body: RegisterPaymentInput,
  ) {
    return this.paymentHandler.execute(user.sub, body);
  }

  @Get('loans/active')
  listActiveLoans(
    @Query(new ZodValidationPipe(AdminActiveLoanQuerySchema)) query: AdminActiveLoanQueryInput,
  ) {
    return this.listHandler.list(query);
  }

  @Get('loans/active/:id')
  getActiveLoanDetail(@Param('id') id: string) {
    return this.listHandler.detail(id);
  }
}
```

### 5.3 Resumen de endpoints

| Método | Ruta | Handler | Auth | Descripción |
|--------|------|---------|------|-------------|
| GET | `/api/loans/active` | GetActiveLoanHandler.list | JWT + Customer | Lista préstamos activos del cliente |
| GET | `/api/loans/active/:id` | GetActiveLoanHandler.detail | JWT + Customer | Detalle con cronograma |
| POST | `/api/admin/loans/:id/disburse` | DisburseLoanHandler.execute | JWT + Admin | Desembolsar aplicación APPROVED |
| POST | `/api/admin/payments` | RegisterPaymentHandler.execute | JWT + Admin | Registrar pago |
| GET | `/api/admin/loans/active` | ListActiveLoansHandler.list | JWT + Admin | Lista admin con filtros |
| GET | `/api/admin/loans/active/:id` | ListActiveLoansHandler.detail | JWT + Admin | Detalle admin con datos del cliente |

### 5.4 DTOs / Validation

Usan Zod schemas desde `packages/shared/src/schemas/loan.schema.ts` (ver sección 8).

---

## 6. Frontend

### 6.1 Estructura de archivos

```
apps/web/
├── features/
│   ├── loans/
│   │   ├── hooks/
│   │   │   └── use-active-loans.ts      # Hook para préstamos activos
│   │   ├── components/
│   │   │   ├── active-loan-list.tsx      # Lista de préstamos activos (portal)
│   │   │   ├── active-loan-detail.tsx    # Detalle con cronograma (portal)
│   │   │   └── active-loan-summary.tsx   # Dashboard summary del portal
│   │   └── __tests__/
│   │       └── use-active-loans.test.ts
│   └── admin/
│       ├── hooks/
│       │   └── use-admin-payments.ts     # Hook para desembolso + pagos
│       ├── components/
│       │   ├── disbursement-button.tsx   # Botón "Desembolsar" en review
│       │   ├── admin-loan-table.tsx      # Tabla de préstamos activos (admin)
│       │   └── payment-dialog.tsx        # Modal de registro de pago
│       └── __tests__/
│           └── use-admin-payments.test.ts
├── app/
│   ├── portal/
│   │   └── loans/
│   │       ├── page.tsx                  # Modificado: sección "Activos" + "Solicitudes"
│   │       └── active/
│   │           └── [id]/page.tsx         # Nueva: detalle de préstamo activo
│   └── admin/
│       ├── loans/
│       │   └── [id]/
│       │       └── page.tsx              # Modificado: botón Desembolsar
│       └── payments/
│           ├── page.tsx                  # Nueva: lista de préstamos activos
│           └── [id]/
│               └── page.tsx              # Nueva: detalle + registro de pago
└── stories/
    ├── ActiveLoanList.stories.tsx
    ├── ActiveLoanDetail.stories.tsx
    ├── DisbursementButton.stories.tsx
    └── PaymentDialog.stories.tsx
```

### 6.2 Hooks

```typescript
// apps/web/features/loans/hooks/use-active-loans.ts
'use client';

import { useCallback, useState } from 'react';
import type { ActiveLoanListResponse, ActiveLoanDetailResponse } from '@prestamos/shared';
import { api, ApiError } from '@/lib/api-client';

export function useActiveLoans() {
  const [data, setData] = useState<ActiveLoanListResponse | null>(null);
  const [detail, setDetail] = useState<ActiveLoanDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const list = useCallback(async () => {
    setIsLoading(true);
    try {
      setError(null);
      const res = await api.get<ActiveLoanListResponse>('/api/loans/active');
      setData(res);
      return res;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al cargar préstamos');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getDetail = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      setError(null);
      const res = await api.get<ActiveLoanDetailResponse>(`/api/loans/active/${id}`);
      setDetail(res);
      return res;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al cargar detalle');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, detail, isLoading, error, list, getDetail };
}
```

```typescript
// apps/web/features/admin/hooks/use-admin-payments.ts
'use client';

import { useCallback, useState } from 'react';
import type { AdminActiveLoanListResponse, DisburseLoanResponse, RegisterPaymentInput, RegisterPaymentResponse } from '@prestamos/shared';
import { api, ApiError } from '@/lib/api-client';

export function useAdminPayments() {
  const [loans, setLoans] = useState<AdminActiveLoanListResponse['data']>([]);
  const [pagination, setPagination] = useState<AdminActiveLoanListResponse['pagination'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listActive = useCallback(async (params?: Record<string, string>) => {
    setIsLoading(true);
    try {
      setError(null);
      const query = new URLSearchParams(params ?? {});
      const res = await api.get<AdminActiveLoanListResponse>(`/api/admin/loans/active?${query}`);
      setLoans(res.data);
      setPagination(res.pagination);
      return res;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al cargar préstamos');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disburse = useCallback(async (applicationId: string) => {
    setIsLoading(true);
    try {
      setError(null);
      return await api.post<DisburseLoanResponse>(`/api/admin/loans/${applicationId}/disburse`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al desembolsar');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const registerPayment = useCallback(async (input: RegisterPaymentInput) => {
    setIsLoading(true);
    try {
      setError(null);
      return await api.post<RegisterPaymentResponse>('/api/admin/payments', input as unknown as Record<string, unknown>);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al registrar pago');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { loans, pagination, isLoading, error, listActive, disburse, registerPayment };
}
```

### 6.3 Componentes clave

**active-loan-list.tsx** (portal):
- Muestra tarjetas con: monto, cuota mensual, saldo pendiente, progreso (paidCount/totalCount), próxima cuota
- Cada tarjeta es link a `active-loan-detail`
- Summary arriba: total outstanding, próximo pago, fecha, cantidad de préstamos

**active-loan-detail.tsx** (portal):
- Encabezado con datos del préstamo (monto, plazo, tasa, cuota)
- Barra de progreso (cuotas pagadas / total)
- Tabla con cronograma completo: #, fecha vencimiento, monto, interés, capital, saldo, estado
- Estado de cada cuota con badge de color

**disbursement-button.tsx** (admin):
- Se renderiza en `AdminLoanReview` cuando `application.status === 'APPROVED'`
- Botón "Desembolsar" con confirmación en Dialog
- Al confirmar, llama a `useAdminPayments().disburse(applicationId)`
- En caso de éxito, redirige a `/admin/payments/[loanId]`

**payment-dialog.tsx** (admin):
- Modal para registrar pago
- Inputs: method (select: EFFECTIVO | TRANSFERENCIA), reference (opcional), notes (opcional)
- Muestra el monto de la próxima cuota
- Botón "Registrar Pago"
- Al éxito, actualiza la lista y muestra toast

### 6.4 Rutas

| Ruta | Método | Componente | Descripción |
|------|--------|-----------|-------------|
| `/portal/loans` | GET | page.tsx | Lista de solicitudes + préstamos activos (modificado) |
| `/portal/loans/active/[id]` | GET | active-loan-detail | Detalle de préstamo activo con cronograma |
| `/admin/loans/[id]` | GET | admin-loan-review + disbursement-button | Botón "Desembolsar" cuando APPROVED |
| `/admin/payments` | GET | admin-loan-table | Lista de préstamos activos (admin) |
| `/admin/payments/[id]` | GET | payment-dialog | Detalle admin + registro de pago |

---

## 7. Migration

### 7.1 Orden de migración

```bash
# 1. Generar migración con las nuevas tablas
cd apps/api
pnpm exec prisma migrate dev --name add-loan-disbursement-tables

# 2. Generar el cliente Prisma
pnpm exec prisma generate
```

### 7.2 Seed data (opcional)

Agregar en `apps/api/prisma/seed.ts` (o script separado) para desarrollo:

```typescript
// Desembolsar aplicaciones APPROVED existentes para testing
// 1. Buscar una aplicación APPROVED sin Loan asociado
// 2. Calcular amortización
// 3. Crear Loan + Installments + DISBURSEMENT transaction
// 4. Marcar 1-2 cuotas como PAID para tener datos mixtos
```

`ponytail: Seed data mínima — solo lo necesario para desarrollo. No crear seed complejo. Si no hay apps APPROVED en dev, el seed no hace nada.`

### 7.3 Rollback

```bash
prisma migrate down  # revierte la última migración
```

Todas las tablas son nuevas — no hay columnas destructivas en tablas existentes. Rollback seguro.

---

## 8. Integration Points

### 8.1 Cambios a `packages/shared`

**`packages/shared/src/types/loan.types.ts`** — Agregar:

```typescript
export type ActiveLoanStatus = 'ACTIVE' | 'PAID' | 'DEFAULTED' | 'WRITTEN_OFF';

export interface DisburseLoanResponse {
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
    disbursedAt: string;
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

export interface InstallmentItemResponse {
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

export interface ActiveLoanListResponse {
  data: ActiveLoanSummary[];
  summary: {
    totalOutstandingBalance: number;
    nextPaymentAmount: number;
    nextPaymentDate: string | null;
    totalActiveLoans: number;
  };
}

export interface ActiveLoanSummary {
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
    percentage: number;
  };
}

export interface ActiveLoanDetailResponse {
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

export interface TransactionSummary {
  id: string;
  type: 'DISBURSEMENT' | 'PAYMENT' | 'ADJUSTMENT';
  amount: number;
  method: 'MANUAL' | null;
  reference: string | null;
  createdAt: string;
}

export interface RegisterPaymentInput {
  loanId: string;
  amount: number;
  method: 'CASH' | 'TRANSFER';
  reference?: string;
  notes?: string;
}

export interface RegisterPaymentResponse {
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

export interface AdminActiveLoanListResponse {
  data: AdminActiveLoanListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminActiveLoanListItem {
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

export interface AdminActiveLoanDetailResponse {
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

**`packages/shared/src/schemas/loan.schema.ts`** — Agregar:

```typescript
export const ActiveLoanStatusEnum = z.enum(['ACTIVE', 'PAID', 'DEFAULTED', 'WRITTEN_OFF']);

export const RegisterPaymentSchema = z.object({
  loanId: z.string().uuid(),
  amount: z.number().positive(),
  method: z.enum(['CASH', 'TRANSFER']),
  reference: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});
export type RegisterPaymentInput = z.infer<typeof RegisterPaymentSchema>;

export const AdminActiveLoanQuerySchema = z.object({
  status: ActiveLoanStatusEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().max(100).optional(),
});
export type AdminActiveLoanQueryInput = z.infer<typeof AdminActiveLoanQuerySchema>;

// Modificar LoanStatusEnum para agregar ACTIVE
export const LoanStatusEnum = z.enum([
  'DRAFT', 'PENDING', 'IN_REVIEW', 'INFO_REQUESTED',
  'APPROVED', 'REJECTED', 'CANCELLED', 'ACTIVE',
]);
```

### 8.2 Cambios al módulo existente

**`apps/api/src/loans/domain/value-objects/loan-status.ts`**:
```typescript
APPROVED: ['ACTIVE'],  // ← agregar esta transición
ACTIVE: [],            // ← agregar estado ACTIVE (terminal para LoanApplication)
```

**`apps/api/src/loans/loans.module.ts`**: Agregar providers y controllers:

```typescript
@Module({
  controllers: [
    LoanApplicationController,
    AdminLoanApplicationController,
    ActiveLoanController,        // nuevo
    AdminPaymentController,      // nuevo
  ],
  providers: [
    // existentes...
    { provide: LOAN_REPOSITORY, useClass: PrismaLoanRepository },
    { provide: INSTALLMENT_REPOSITORY, useClass: PrismaInstallmentRepository },
    { provide: ACTIVE_LOAN_QUERY, useClass: PrismaActiveLoanQueryImpl },
    { provide: ADMIN_ACTIVE_LOAN_QUERY, useClass: PrismaAdminActiveLoanQueryImpl },
    DisburseLoanHandler,
    RegisterPaymentHandler,
    GetActiveLoanHandler,
    ListActiveLoansHandler,
  ],
})
export class LoansModule {}
```

### 8.3 Cambios al frontend existente

**`apps/web/app/portal/loans/page.tsx`**: Agregar sección de préstamos activos arriba de la tabla de aplicaciones. Usar `useActiveLoans()`.

**`apps/web/app/admin/loans/[id]/page.tsx`**: Agregar botón "Desembolsar" en `AdminLoanReview` cuando `application.status === 'APPROVED'`. Usar `useAdminPayments().disburse()`.

---

## 9. Resumen de Archivos Nuevos y Modificados

### Nuevos (Backend)
| Archivo | Propósito |
|---------|-----------|
| `apps/api/src/loans/domain/loan.entity.ts` | Entidad Loan |
| `apps/api/src/loans/domain/installment.entity.ts` | Entidad Installment |
| `apps/api/src/loans/domain/loan-transaction.vo.ts` | VO LoanTransaction |
| `apps/api/src/loans/domain/loan.errors.ts` | Errores de dominio |
| `apps/api/src/loans/domain/value-objects/active-loan-status.ts` | VO ActiveLoanStatus |
| `apps/api/src/loans/domain/value-objects/installment-status.ts` | VO InstallmentStatus |
| `apps/api/src/loans/domain/value-objects/payment-method.ts` | VO PaymentMethod |
| `apps/api/src/loans/domain/value-objects/transaction-type.ts` | VO TransactionType |
| `apps/api/src/loans/domain/value-objects/amortization.ts` | Cálculo de amortización |
| `apps/api/src/loans/domain/loan.repository.ts` | Puerto LoanRepository |
| `apps/api/src/loans/application/ports/active-loan-query.port.ts` | Puerto ActiveLoanQuery |
| `apps/api/src/loans/application/disburse-loan/disburse-loan.handler.ts` | Handler desembolso |
| `apps/api/src/loans/application/register-payment/register-payment.handler.ts` | Handler pago |
| `apps/api/src/loans/application/get-active-loan/get-active-loan.handler.ts` | Handler query activos (portal) |
| `apps/api/src/loans/application/list-active-loans/list-active-loans.handler.ts` | Handler list admin |
| `apps/api/src/loans/infrastructure/persistence/prisma-loan.repository.ts` | Repo Loan |
| `apps/api/src/loans/infrastructure/persistence/prisma-installment.repository.ts` | Repo Installment |
| `apps/api/src/loans/infrastructure/active-loan-query/prisma-active-loan-query.impl.ts` | Query activos (portal) |
| `apps/api/src/loans/infrastructure/active-loan-query/prisma-admin-active-loan-query.impl.ts` | Query activos (admin) |
| `apps/api/src/loans/presentation/active-loan.controller.ts` | Controller portal |
| `apps/api/src/loans/presentation/admin-payment.controller.ts` | Controller admin |

### Nuevos (Frontend)
| Archivo | Propósito |
|---------|-----------|
| `apps/web/features/loans/hooks/use-active-loans.ts` | Hook préstamos activos |
| `apps/web/features/loans/components/active-loan-list.tsx` | Componente lista activos |
| `apps/web/features/loans/components/active-loan-detail.tsx` | Componente detalle activo |
| `apps/web/features/admin/hooks/use-admin-payments.ts` | Hook admin pagos |
| `apps/web/features/admin/components/disbursement-button.tsx` | Botón desembolsar |
| `apps/web/features/admin/components/admin-loan-active-table.tsx` | Tabla activos admin |
| `apps/web/features/admin/components/payment-dialog.tsx` | Modal registro pago |
| `apps/web/app/portal/loans/active/[id]/page.tsx` | Página detalle activo |
| `apps/web/app/admin/payments/page.tsx` | Página lista activos admin |
| `apps/web/app/admin/payments/[id]/page.tsx` | Página detalle admin + pago |
| `apps/web/stories/ActiveLoanList.stories.tsx` | Story |
| `apps/web/stories/ActiveLoanDetail.stories.tsx` | Story |
| `apps/web/stories/DisbursementButton.stories.tsx` | Story |
| `apps/web/stories/PaymentDialog.stories.tsx` | Story |

### Modificados
| Archivo | Cambio |
|---------|--------|
| `apps/api/prisma/schema.prisma` | +3 modelos (Loan, Installment, LoanTransaction) |
| `apps/api/src/loans/domain/value-objects/loan-status.ts` | APPROVED → ACTIVE transición |
| `apps/api/src/loans/loans.tokens.ts` | +5 tokens |
| `apps/api/src/loans/loans.module.ts` | +4 handlers, +2 repos, +2 queries, +2 controllers |
| `packages/shared/src/types/loan.types.ts` | +10 tipos |
| `packages/shared/src/schemas/loan.schema.ts` | +2 schemas, LoanStatusEnum extendido |
| `packages/shared/src/index.ts` | Re-exporta nuevos tipos/schemas (automático) |
| `apps/web/app/portal/loans/page.tsx` | +sección préstamos activos |
| `apps/web/app/admin/loans/[id]/page.tsx` | +botón desembolsar |
| `apps/web/features/admin/components/admin-loan-review.tsx` | +botón desembolsar condicional |

---

## 10. Decisiones Técnicas y Trade-offs

| Decisión | Alternativa | Por qué |
|----------|-------------|---------|
| `calculateAmortization()` inline en handler | Servicio separado | Solo se usa al desembolsar. YAGNI. |
| Cuotas fijas (interés/principal persistidos) | Recalcular desde fórmula | Persistir = auditabilidad, no depende de fórmula futura |
| FIFO para pagos que cubren múltiples cuotas | Asignación manual por cuota | Más simple para el admin en MVP |
| outstandingBalance decrementa por principal, no por monto pagado | Decrementar por amount | Refleja saldo de capital real |
| `dueDate = disbursedAt + 30*n` días | Calendario exacto | Simple, suficiente para cuotas mensuales |
| Sin eventos de dominio | Con eventos | No hay side-effects aún. Agregar cuando haya notificaciones. |
| Sin tabla de schedule JSON | Con schedule JSON | Reconstruible desde cuotas. No duplicar datos. |

---

## 11. Próximos Pasos

1. Ejecutar `prisma migrate dev` con las nuevas tablas
2. Implementar en orden:
   - Value Objects y errores de dominio
   - `calculateAmortization()` + tests
   - `DisburseLoanHandler` + tests
   - `RegisterPaymentHandler` + tests
   - Query implementations
   - Controllers + DTOs
   - Module wiring
   - Shared types/schemas
   - Frontend hooks + components
3. Probar cada endpoint con curl según `specs.md`
4. Actualizar OKF wiki
