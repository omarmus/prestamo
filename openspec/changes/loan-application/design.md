# Design: Loan Application Workflow

## Technical Approach

New `loans/` module following Clean Architecture + DDD (4 layers). Adds 1 Prisma model with JSON timeline, 7-state state machine with atomic transitions, and both customer-facing and admin-facing endpoints. Reuses existing `calculateLoan()` shared function and `CustomerGuard`/`JwtAuthGuard` patterns.

**Strategy**: Entity encapsulates state machine with method guards. Application layer handlers orchestrate entity + repository + external validations (incomes, documents, DTI). Prisma repository uses `updateMany` with `where: { id, status }` for race-condition-safe transitions. Frontend uses shared Zod schemas for validation parity.

---

## 1. Data Model

### Prisma Model — `LoanApplication`

Add to `apps/api/prisma/schema.prisma`:

```prisma
model LoanApplication {
  id             String   @id @default(uuid())
  customerId     String
  customer       Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  simulationId   String?
  simulation     LoanSimulation? @relation(fields: [simulationId], references: [id])

  amount         Decimal  @db.Decimal(18, 2)
  termMonths     Int
  annualRate     Decimal  @db.Decimal(10, 6)
  monthlyPayment Decimal  @db.Decimal(18, 2)
  totalInterest  Decimal  @db.Decimal(18, 2)
  totalPayment   Decimal  @db.Decimal(18, 2)
  purpose        String?
  status         String   @default("DRAFT")   // DRAFT | PENDING | IN_REVIEW | INFO_REQUESTED | APPROVED | REJECTED | CANCELLED
  riskScore      String?                      // LOW | MEDIUM | HIGH
  timeline       Json?                        // array of { fromStatus, toStatus, changedBy, changedAt, notes }

  reviewerId     String?
  reviewer       User?    @relation(fields: [reviewerId], references: [id])
  reviewNotes    String?
  reviewedAt     DateTime?

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([customerId])
  @@index([status])
  @@index([reviewerId])
  @@index([createdAt])
}
```

### Migration Strategy

- **All columns are additive**: no existing tables are modified.
- `simulationId` is nullable → no default needed, safe to add.
- `reviewerId` is nullable → safe to add.
- `timeline` is nullable `Json` → safe to add.
- Run `pnpm --filter @prestamos/api exec prisma migrate dev --name add_loan_application`.

### Indexes

| Index | Columns | Purpose |
|-------|---------|---------|
| Primary | `id` | PK lookup |
| `@@index([customerId])` | customerId | Customer list queries (`WHERE customerId = ?`) |
| `@@index([status])` | status | Admin list queries with status filter |
| `@@index([reviewerId])` | reviewerId | Admin "my reviews" queries |
| `@@index([createdAt])` | createdAt | Date-range filtering, ORDER BY |

`ponytail: No composite indexes for MVP. Add if query perf degrades.`

---

## 2. Backend Architecture

### 2.1 Domain Layer

#### `loan-status.ts` — Value Object

The transition matrix is a static lookup table, not an enum with methods. A single `VALID_TRANSITIONS` map enforces all rules.

```typescript
// apps/api/src/loans/domain/value-objects/loan-status.ts

export const LOAN_STATUSES = [
  'DRAFT', 'PENDING', 'IN_REVIEW', 'INFO_REQUESTED',
  'APPROVED', 'REJECTED', 'CANCELLED',
] as const;

export type LoanStatus = typeof LOAN_STATUSES[number];

const VALID_TRANSITIONS: Record<LoanStatus, LoanStatus[]> = {
  DRAFT:          ['PENDING', 'CANCELLED'],
  PENDING:        ['IN_REVIEW', 'CANCELLED'],
  IN_REVIEW:      ['APPROVED', 'REJECTED', 'INFO_REQUESTED'],
  INFO_REQUESTED: ['PENDING'],
  APPROVED:       [],
  REJECTED:       [],
  CANCELLED:      [],
};

export function canTransition(from: LoanStatus, to: LoanStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}
```

`ponytail: Lookup table, not a class. Add DB persistence when there are more states or runtime configuration.`

#### `loan-application.entity.ts` — Entity

```typescript
// apps/api/src/loans/domain/loan-application.entity.ts

import type { LoanStatus } from './value-objects/loan-status';
import { canTransition } from './value-objects/loan-status';
import { LoanStatusTransitionError, LoanNotOwnedByCustomerError } from './loan-application.errors';

export interface TimelineEntry {
  fromStatus: LoanStatus | null;
  toStatus: LoanStatus;
  changedBy: 'customer' | 'admin';
  changedAt: string;  // ISO string
  notes?: string;
}

export class LoanApplication {
  constructor(
    public readonly id: string,
    public readonly customerId: string,
    public amount: number,
    public termMonths: number,
    public annualRate: number,
    public monthlyPayment: number,
    public totalInterest: number,
    public totalPayment: number,
    public purpose: string | null,
    public status: LoanStatus,
    public riskScore: string | null,
    public readonly simulationId: string | null,
    public reviewerId: string | null,
    public reviewNotes: string | null,
    public reviewedAt: string | null,
    public readonly createdAt: string,
    public readonly updatedAt: string,
    public timeline: TimelineEntry[],
  ) {}

  // --- State transition methods ---

  private transition(to: LoanStatus, changedBy: TimelineEntry['changedBy'], notes?: string): void {
    if (!canTransition(this.status, to)) {
      throw new LoanStatusTransitionError(this.status, to);
    }
    const entry: TimelineEntry = {
      fromStatus: this.status,
      toStatus: to,
      changedBy,
      changedAt: new Date().toISOString(),
      notes,
    };
    this.status = to;
    this.timeline.push(entry);
  }

  submit(): void {
    this.transition('PENDING', 'customer');
  }

  cancel(): void {
    this.transition('CANCELLED', 'customer', 'Cancelado por el cliente');
  }

  assignReviewer(reviewerId: string): void {
    this.transition('IN_REVIEW', 'admin');
    this.reviewerId = reviewerId;
  }

  approve(actorId: string, riskScore: string): void {
    if (this.reviewerId !== actorId) {
      throw new LoanNotOwnedByCustomerError('Solo el asesor asignado puede aprobar esta solicitud');
    }
    this.transition('APPROVED', 'admin');
    this.riskScore = riskScore;
    this.reviewedAt = new Date().toISOString();
  }

  reject(actorId: string, reason: string): void {
    if (this.reviewerId !== actorId) {
      throw new LoanNotOwnedByCustomerError('Solo el asesor asignado puede rechazar esta solicitud');
    }
    this.transition('REJECTED', 'admin');
    this.reviewNotes = reason;
    this.reviewedAt = new Date().toISOString();
  }

  requestInfo(actorId: string, message: string): void {
    if (this.reviewerId !== actorId) {
      throw new LoanNotOwnedByCustomerError('Solo el asesor asignado puede solicitar información');
    }
    this.transition('INFO_REQUESTED', 'admin');
    this.reviewNotes = message;
  }

  respondToInfo(): void {
    this.transition('PENDING', 'customer', 'Cliente respondió a solicitud de información');
    // reviewerId stays — same admin retakes
  }
}
```

#### `loan-application.repository.ts` — Port

```typescript
// apps/api/src/loans/domain/loan-application.repository.ts
import type { LoanApplication } from './loan-application.entity';
import type { LoanStatus } from './value-objects/loan-status';

export interface LoanApplicationRepository {
  findById(id: string): Promise<LoanApplication | null>;
  findByCustomerId(customerId: string): Promise<LoanApplication[]>;
  findByCustomerIdAndId(customerId: string, id: string): Promise<LoanApplication | null>;
  findPending(page: number, limit: number, status?: LoanStatus[]): Promise<{ data: LoanApplication[]; total: number }>;
  save(application: LoanApplication): Promise<void>;
  /** Atomic status transition — returns true if row was updated, false if race condition */
  updateStatus(id: string, fromStatus: LoanStatus, toStatus: LoanStatus, data: Record<string, unknown>): Promise<boolean>;
}
```

#### `loan-application.errors.ts` — Domain Errors

```typescript
// apps/api/src/loans/domain/loan-application.errors.ts
import type { LoanStatus } from './value-objects/loan-status';

export class LoanStatusTransitionError extends Error {
  readonly statusCode = 409;
  readonly code = 'LOAN_STATUS_TRANSITION_ERROR';

  constructor(fromStatus: LoanStatus, toStatus: LoanStatus) {
    super(`No se puede cambiar el estado de ${fromStatus} a ${toStatus}`);
    this.name = 'LoanStatusTransitionError';
  }
}

export class LoanNotFoundError extends Error {
  readonly statusCode = 404;
  readonly code = 'LOAN_NOT_FOUND';

  constructor(identifier: string) {
    super(`Solicitud no encontrada: ${identifier}`);
    this.name = 'LoanNotFoundError';
  }
}

export class LoanNotOwnedByCustomerError extends Error {
  readonly statusCode = 404;
  readonly code = 'LOAN_NOT_OWNED';

  constructor(message = 'Solicitud no encontrada') {
    super(message);
    this.name = 'LoanNotOwnedByCustomerError';
  }
}

export class InsufficientIncomeError extends Error {
  readonly statusCode = 422;
  readonly code = 'INSUFFICIENT_INCOME';

  constructor(message = 'Debes registrar al menos un ingreso antes de enviar tu solicitud') {
    super(message);
    this.name = 'InsufficientIncomeError';
  }
}

export class MissingDocumentsError extends Error {
  readonly statusCode = 422;
  readonly code = 'MISSING_DOCUMENTS';

  constructor(message = 'El cliente debe tener CI_FRONT y CI_BACK en estado VERIFIED') {
    super(message);
    this.name = 'MissingDocumentsError';
  }
}

export class HighRiskLoanError extends Error {
  readonly statusCode = 422;
  readonly code = 'HIGH_RISK_LOAN';

  constructor(dti: number) {
    super(`El ratio DTI (${dti.toFixed(2)}) excede el límite permitido de 0.50`);
    this.name = 'HighRiskLoanError';
  }
}

export class LoanAlreadyReviewedError extends Error {
  readonly statusCode = 409;
  readonly code = 'LOAN_ALREADY_REVIEWED';

  constructor(message = 'La solicitud ya está siendo revisada por otro asesor') {
    super(message);
    this.name = 'LoanAlreadyReviewedError';
  }
}
```

`ponytail: statusCode on the error instance drives DomainErrorFilter response mapping. No separate error-to-http mapper needed.`

---

### 2.2 Application Layer

#### `CreateApplicationHandler`

```typescript
// apps/api/src/loans/application/create-application/create-application.handler.ts

@Injectable()
export class CreateApplicationHandler {
  constructor(
    @Inject(LOAN_APPLICATION_REPOSITORY)
    private readonly repo: LoanApplicationRepository,
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepo: CustomerRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    customer: Customer,
    input: CreateLoanApplicationInput & { submit?: boolean },
  ): Promise<LoanApplicationResponse> {
    // 1. Resolve loan data: from simulationId OR calculate directly
    let loanData: { amount: number; termMonths: number; annualRate: number } & LoanResult;

    if (input.simulationId) {
      const simulation = await this.prisma.loanSimulation.findUnique({
        where: { id: input.simulationId },
      });
      if (!simulation || simulation.customerId !== customer.id) {
        throw new LoanNotFoundError(input.simulationId);
      }
      loanData = {
        amount: Number(simulation.amount),
        termMonths: simulation.termMonths,
        annualRate: Number(simulation.annualRate),
        monthlyPayment: Number(simulation.monthlyPayment),
        totalInterest: 0, // calculated below if needed
        totalPayment: 0,
        schedule: [],
      };
      // Recalculate to ensure consistency
      const calc = calculateLoan(loanData.amount, loanData.annualRate, loanData.termMonths);
      loanData.monthlyPayment = calc.monthlyPayment;
      loanData.totalInterest = calc.totalInterest;
      loanData.totalPayment = calc.totalPayment;
    } else {
      const calc = calculateLoan(input.amount!, input.annualRate!, input.termMonths!);
      loanData = {
        amount: input.amount!,
        termMonths: input.termMonths!,
        annualRate: input.annualRate!,
        ...calc,
      };
    }

    // 2. If submit=true, validate incomes exist
    if (input.submit) {
      const hasIncomes = (customer.incomes?.length ?? 0) > 0;
      if (!hasIncomes) {
        throw new InsufficientIncomeError();
      }
    }

    // 3. Create entity
    const status = input.submit ? 'PENDING' : 'DRAFT';
    const timeline: TimelineEntry[] = [{
      fromStatus: null,
      toStatus: status,
      changedBy: 'customer',
      changedAt: new Date().toISOString(),
    }];

    const application = new LoanApplication(
      crypto.randomUUID(), customer.id,
      loanData.amount, loanData.termMonths, loanData.annualRate,
      loanData.monthlyPayment, loanData.totalInterest, loanData.totalPayment,
      input.purpose ?? null, status, null,
      input.simulationId ?? null, null, null, null,
      new Date().toISOString(), new Date().toISOString(), timeline,
    );

    // 4. Persist
    await this.repo.save(application);
    return this.toResponse(application);
  }

  private toResponse(app: LoanApplication): LoanApplicationResponse { ... }
}
```

`ponytail: Recalculates loan even when simulationId is provided — avoids stale calculation bugs. The calc is a pure function, no performance concern at this scale.`

#### `ListApplicationsHandler`

```typescript
@Injectable()
export class ListApplicationsHandler {
  constructor(
    @Inject(LOAN_APPLICATION_REPOSITORY)
    private readonly repo: LoanApplicationRepository,
  ) {}

  async execute(customerId: string): Promise<LoanApplicationResponse[]> {
    const applications = await this.repo.findByCustomerId(customerId);
    return applications.map(this.toResponse);
  }
}
```

#### `GetApplicationHandler`

```typescript
@Injectable()
export class GetApplicationHandler {
  constructor(
    @Inject(LOAN_APPLICATION_REPOSITORY)
    private readonly repo: LoanApplicationRepository,
  ) {}

  async execute(customerId: string, applicationId: string): Promise<LoanApplicationDetailResponse> {
    const app = await this.repo.findByCustomerIdAndId(customerId, applicationId);
    if (!app) throw new LoanNotFoundError(applicationId);
    return this.toDetailResponse(app);
  }
}
```

#### `CancelApplicationHandler`

```typescript
@Injectable()
export class CancelApplicationHandler {
  constructor(
    @Inject(LOAN_APPLICATION_REPOSITORY)
    private readonly repo: LoanApplicationRepository,
  ) {}

  async execute(customerId: string, applicationId: string): Promise<LoanApplicationResponse> {
    const app = await this.repo.findByCustomerIdAndId(customerId, applicationId);
    if (!app) throw new LoanNotFoundError(applicationId);

    // Entity validates transition — throws if not DRAFT or PENDING
    app.cancel();

    // Atomic update: only succeeds if status is still the expected one
    const updated = await this.repo.updateStatus(applicationId, app.status, 'CANCELLED', {
      reviewNotes: 'Cancelado por el cliente',
      timeline: app.timeline,
    });
    if (!updated) throw new LoanAlreadyReviewedError('La solicitud cambió de estado desde que fue cargada');

    return this.toResponse(app);
  }
}
```

`ponytail: read-then-write between entity.validate() and repo.updateStatus() has a narrow window. Atomic updateStatus() with where: {id, status} covers it. If contention becomes a problem, wrap in a Prisma transaction with serializable isolation.`

#### `ReviewApplicationHandler` — Single handler, command pattern

A single handler with an action discriminator (`approve | reject | request-info | review`). Each action maps to a method.

```typescript
@Injectable()
export class ReviewApplicationHandler {
  constructor(
    @Inject(LOAN_APPLICATION_REPOSITORY)
    private readonly repo: LoanApplicationRepository,
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepo: CustomerRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    adminId: string,
    applicationId: string,
    action: 'review' | 'approve' | 'reject' | 'request-info',
    payload: ReviewPayload,
  ): Promise<LoanApplicationResponse> {
    const app = await this.repo.findById(applicationId);
    if (!app) throw new LoanNotFoundError(applicationId);

    switch (action) {
      case 'review':
        return this.assignReview(adminId, app);
      case 'approve':
        return this.approve(adminId, app);
      case 'reject':
        return this.reject(adminId, app, payload.reason!);
      case 'request-info':
        return this.requestInfo(adminId, app, payload.message!);
    }
  }

  private async assignReview(adminId: string, app: LoanApplication) {
    app.assignReviewer(adminId);
    const updated = await this.repo.updateStatus(app.id, 'PENDING', 'IN_REVIEW', {
      reviewerId: adminId,
      timeline: app.timeline,
    });
    if (!updated) throw new LoanAlreadyReviewedError();
    return this.toResponse(app);
  }

  private async approve(adminId: string, app: LoanApplication) {
    // 1. DTI calculation
    const dtiResult = await this.calculateDTI(app.customerId, app.monthlyPayment);
    if (dtiResult.dti > 0.50) {
      throw new HighRiskLoanError(dtiResult.dti);
    }

    // 2. Document verification
    const docs = await this.prisma.customerDocument.findMany({
      where: { customerId: app.customerId, type: { in: ['CI_FRONT', 'CI_BACK'] } },
    });
    const ciFrontVerified = docs.some(d => d.type === 'CI_FRONT' && d.status === 'VERIFIED');
    const ciBackVerified = docs.some(d => d.type === 'CI_BACK' && d.status === 'VERIFIED');
    if (!ciFrontVerified || !ciBackVerified) {
      throw new MissingDocumentsError();
    }

    // 3. Entity transition
    app.approve(adminId, dtiResult.riskScore);
    const updated = await this.repo.updateStatus(app.id, 'IN_REVIEW', 'APPROVED', {
      riskScore: dtiResult.riskScore,
      reviewNotes: payload?.notes ?? null,
      reviewedAt: app.reviewedAt,
      timeline: app.timeline,
    });
    if (!updated) throw new LoanAlreadyReviewedError('El estado de la solicitud cambió desde que fue cargada');
    return this.toResponse(app);
  }

  private async calculateDTI(
    customerId: string,
    monthlyPayment: number,
  ): Promise<{ dti: number; riskScore: string }> {
    // Load incomes from CustomerIncome[]
    const incomes = await this.prisma.customerIncome.findMany({
      where: { customerId },
    });

    let totalMonthlyIncome: number;

    if (incomes.length > 0) {
      totalMonthlyIncome = incomes.reduce((sum, inc) => {
        const amount = Number(inc.amount);
        switch (inc.frequency) {
          case 'BIWEEKLY': return sum + amount * 2;
          case 'WEEKLY':   return sum + amount * 4.33;
          case 'YEARLY':   return sum + amount / 12;
          default:         return sum + amount; // MONTHLY and null
        }
      }, 0);
    } else {
      // Fallback: Customer.monthlyIncome
      const customer = await this.customerRepo.findById(customerId);
      if (!customer?.monthlyIncome) {
        throw new InsufficientIncomeError('El cliente no tiene ingresos registrados');
      }
      totalMonthlyIncome = Number(customer.monthlyIncome);
    }

    const dti = monthlyPayment / totalMonthlyIncome;
    const riskScore = dti <= 0.30 ? 'LOW' : dti <= 0.50 ? 'MEDIUM' : 'HIGH';

    return { dti, riskScore };
  }

  // reject, requestInfo follow same pattern (entity transition + atomic updateStatus)
}
```

`ponytail: DTI calculation is inline in the handler, not a separate domain service. Extract when there are multiple scoring models or a credit-bureau integration.`

#### `ListPendingApplicationsHandler`

```typescript
@Injectable()
export class ListPendingApplicationsHandler {
  constructor(
    @Inject(LOAN_APPLICATION_REPOSITORY)
    private readonly repo: LoanApplicationRepository,
  ) {}

  async execute(query: AdminListQuery): Promise<PaginatedAdminResponse> {
    const statusFilter = query.status
      ? [query.status]
      : ['PENDING', 'IN_REVIEW'];

    const { data, total } = await this.repo.findPending(
      query.page ?? 1,
      query.limit ?? 20,
      statusFilter,
    );

    return {
      data: data.map(this.toAdminListResponse),
      pagination: {
        page: query.page ?? 1,
        limit: query.limit ?? 20,
        total,
        totalPages: Math.ceil(total / (query.limit ?? 20)),
      },
    };
  }
}
```

#### Admin Query Port

```typescript
// apps/api/src/loans/application/ports/admin-query.port.ts
export interface AdminApplicationDetail {
  application: LoanApplicationResponse;
  customer: FullCustomerProfile;
  documents: DocumentResponse[];
  incomes: IncomeResponseWithMonthly[];
  totalMonthlyIncome: number;
  dti: number;
  timeline: TimelineEntry[];
}
```

---

### 2.3 Infrastructure Layer

#### `PrismaLoanApplicationRepository`

```typescript
// apps/api/src/loans/infrastructure/persistence/prisma-loan-application.repository.ts

@Injectable()
export class PrismaLoanApplicationRepository implements LoanApplicationRepository {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async findById(id: string): Promise<LoanApplication | null> {
    const row = await this.prisma.loanApplication.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async findByCustomerId(customerId: string): Promise<LoanApplication[]> {
    const rows = await this.prisma.loanApplication.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(this.toEntity);
  }

  async findByCustomerIdAndId(customerId: string, id: string): Promise<LoanApplication | null> {
    const row = await this.prisma.loanApplication.findFirst({
      where: { id, customerId },
    });
    return row ? this.toEntity(row) : null;
  }

  async findPending(
    page: number,
    limit: number,
    status?: string[],
  ): Promise<{ data: LoanApplication[]; total: number }> {
    const where = status ? { status: { in: status } } : {};
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.loanApplication.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.loanApplication.count({ where }),
    ]);
    return { data: rows.map(this.toEntity), total };
  }

  async save(application: LoanApplication): Promise<void> {
    await this.prisma.loanApplication.create({
      data: this.toPrisma(application),
    });
  }

  async updateStatus(
    id: string,
    fromStatus: string,
    toStatus: string,
    data: Record<string, unknown>,
  ): Promise<boolean> {
    const result = await this.prisma.loanApplication.updateMany({
      where: { id, status: fromStatus },
      data: { status: toStatus, ...data },
    });
    return result.count > 0;
  }

  private toEntity(row: PrismaLoanApplication): LoanApplication {
    return new LoanApplication(
      row.id, row.customerId,
      Number(row.amount), row.termMonths, Number(row.annualRate),
      Number(row.monthlyPayment), Number(row.totalInterest), Number(row.totalPayment),
      row.purpose, row.status as LoanStatus, row.riskScore,
      row.simulationId, row.reviewerId, row.reviewNotes,
      row.reviewedAt?.toISOString() ?? null,
      row.createdAt.toISOString(), row.updatedAt.toISOString(),
      (row.timeline as TimelineEntry[]) ?? [],
    );
  }

  private toPrisma(entity: LoanApplication): PrismaLoanApplicationCreate {
    return {
      id: entity.id,
      customerId: entity.customerId,
      simulationId: entity.simulationId,
      amount: entity.amount,
      termMonths: entity.termMonths,
      annualRate: entity.annualRate,
      monthlyPayment: entity.monthlyPayment,
      totalInterest: entity.totalInterest,
      totalPayment: entity.totalPayment,
      purpose: entity.purpose,
      status: entity.status,
      riskScore: entity.riskScore,
      timeline: entity.timeline,
      reviewerId: entity.reviewerId,
      reviewNotes: entity.reviewNotes,
      reviewedAt: entity.reviewedAt ? new Date(entity.reviewedAt) : null,
    };
  }
}
```

#### `PrismaAdminQueryImpl`

```typescript
// apps/api/src/loans/infrastructure/admin-query/prisma-admin-query.impl.ts
@Injectable()
export class PrismaAdminQueryImpl implements AdminQuery {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async getApplicationDetail(applicationId: string): Promise<AdminApplicationDetail | null> {
    const app = await this.prisma.loanApplication.findUnique({
      where: { id: applicationId },
      include: {
        customer: {
          include: {
            addresses: true,
            phones: true,
            incomes: true,
            employment: true,
            bankAccounts: true,
            documents: true,
            simulations: true,
          },
        },
      },
    });
    if (!app) return null;

    // Calculate DTI and normalized incomes
    const incomes = app.customer.incomes.map(inc => ({
      ...inc,
      monthlyAmount: this.normalizeIncome(Number(inc.amount), inc.frequency),
    }));
    const totalMonthlyIncome = incomes.reduce((s, i) => s + i.monthlyAmount, 0);
    const dti = totalMonthlyIncome > 0
      ? Number(app.monthlyPayment) / totalMonthlyIncome
      : 0;

    return { application: ..., customer: ..., documents: ..., incomes, totalMonthlyIncome, dti, timeline: ... };
  }

  private normalizeIncome(amount: number, frequency: string | null): number {
    switch (frequency) {
      case 'BIWEEKLY': return amount * 2;
      case 'WEEKLY':   return amount * 4.33;
      case 'YEARLY':   return amount / 12;
      default:         return amount;
    }
  }
}
```

#### `AdminGuard`

```typescript
// apps/api/src/loans/presentation/admin.guard.ts
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user: JwtPayload }>();
    return request.user?.role === 'ADMIN';
  }
}
```

`ponytail: Basic role check. Add RBAC granular when more roles emerge.`

---

### 2.4 Presentation Layer

#### `LoanApplicationController` — Customer endpoints

```typescript
// apps/api/src/loans/presentation/loan-application.controller.ts
@Controller('api/loans/applications')
@UseGuards(JwtAuthGuard, CustomerGuard)
export class LoanApplicationController {
  constructor(
    @Inject(CreateApplicationHandler)
    private readonly createHandler: CreateApplicationHandler,
    @Inject(ListApplicationsHandler)
    private readonly listHandler: ListApplicationsHandler,
    @Inject(GetApplicationHandler)
    private readonly getHandler: GetApplicationHandler,
    @Inject(CancelApplicationHandler)
    private readonly cancelHandler: CancelApplicationHandler,
  ) {}

  @Post()
  @HttpCode(201)
  create(
    @CurrentUser() user: JwtPayload,
    @Req() req: RequestWithCustomer,
    @Body(new ZodValidationPipe(CreateLoanApplicationSchema)) body: CreateLoanApplicationInput,
  ) {
    return this.createHandler.execute(req.customer, body);
  }

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.listHandler.execute(user.sub);
  }

  @Get(':id')
  get(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.getHandler.execute(user.sub, id);
  }

  @Delete(':id')
  cancel(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.cancelHandler.execute(user.sub, id);
  }
}
```

`ponytail: CustomerGuard attaches `customer` to request. The controller passes `req.customer` to the handler (already validated customer exists).`

#### `AdminLoanApplicationController` — Admin endpoints

```typescript
// apps/api/src/loans/presentation/admin-loan-application.controller.ts
@Controller('api/admin/loans/applications')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminLoanApplicationController {
  constructor(
    @Inject(ListPendingApplicationsHandler)
    private readonly listPendingHandler: ListPendingApplicationsHandler,
    @Inject(ReviewApplicationHandler)
    private readonly reviewHandler: ReviewApplicationHandler,
    private readonly adminQuery: PrismaAdminQueryImpl,
  ) {}

  @Get()
  listPending(
    @Query() query: AdminListQueryDto,
  ) {
    return this.listPendingHandler.execute(query);
  }

  @Get(':id')
  async getDetail(@Param('id') id: string) {
    const detail = await this.adminQuery.getApplicationDetail(id);
    if (!detail) throw new LoanNotFoundError(id);
    return detail;
  }

  @Post(':id/review')
  assignAndReview(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.reviewHandler.execute(user.sub, id, 'review', {});
  }

  @Post(':id/approve')
  approve(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ReviewApplicationSchema)) body: ReviewLoanApplicationInput,
  ) {
    return this.reviewHandler.execute(user.sub, id, 'approve', body);
  }

  @Post(':id/reject')
  reject(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ReviewApplicationSchema.required({ reason: true }))) body: { reason: string },
  ) {
    return this.reviewHandler.execute(user.sub, id, 'reject', body);
  }

  @Post(':id/request-info')
  requestInfo(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ReviewApplicationSchema.required({ message: true }))) body: { message: string },
  ) {
    return this.reviewHandler.execute(user.sub, id, 'request-info', body);
  }
}
```

---

## 3. API Contracts

### Customer Endpoints

#### `POST /api/loans/applications`

**Request** (from simulation):
```json
{ "simulationId": "uuid", "purpose": "NEGOCIO", "submit": true }
```

**Request** (direct):
```json
{ "amount": 10000, "termMonths": 12, "annualRate": 12, "purpose": "EDUCACION", "submit": false }
```

**Response** `201 Created`:
```json
{
  "id": "uuid",
  "status": "PENDING",
  "amount": 10000,
  "termMonths": 12,
  "annualRate": 12,
  "monthlyPayment": 888.49,
  "totalInterest": 661.88,
  "totalPayment": 10661.88,
  "purpose": "EDUCACION",
  "simulationId": "uuid-or-null",
  "riskScore": null,
  "reviewNotes": null,
  "reviewedAt": null,
  "createdAt": "2026-07-20T12:00:00.000Z",
  "updatedAt": "2026-07-20T12:00:00.000Z",
  "timeline": [
    { "fromStatus": null, "toStatus": "PENDING", "changedBy": "customer", "changedAt": "2026-07-20T12:00:00.000Z" }
  ]
}
```

**Error** `400` — validation:
```json
{ "statusCode": 400, "message": "Validation failed", "errors": [{ "field": "amount", "message": "Monto máximo es 500,000" }] }
```

**Error** `422` — no incomes on submit:
```json
{ "statusCode": 422, "error": "Unprocessable Entity", "message": "Debes registrar al menos un ingreso antes de enviar tu solicitud", "code": "INSUFFICIENT_INCOME" }
```

#### `GET /api/loans/applications`

**Response** `200`:
```json
{
  "data": [
    {
      "id": "uuid",
      "amount": 10000,
      "termMonths": 12,
      "annualRate": 12,
      "monthlyPayment": 888.49,
      "purpose": "EDUCACION",
      "status": "PENDING",
      "riskScore": null,
      "createdAt": "2026-07-20T12:00:00.000Z",
      "updatedAt": "2026-07-20T12:00:00.000Z"
    }
  ]
}
```

#### `GET /api/loans/applications/:id`

**Response** `200` — same shape as create response with timeline.

#### `DELETE /api/loans/applications/:id`

**Response** `200`:
```json
{ "id": "uuid", "status": "CANCELLED", "updatedAt": "..." }
```

**Error** `409`:
```json
{ "statusCode": 409, "error": "Conflict", "message": "No se puede cambiar el estado de IN_REVIEW a CANCELLED", "code": "LOAN_STATUS_TRANSITION_ERROR" }
```

### Admin Endpoints

#### `GET /api/admin/loans/applications`

**Query**: `?status=PENDING&page=1&limit=20&dateFrom=2026-01-01&dateTo=2026-06-30&search=juan`

**Response** `200`:
```json
{
  "data": [
    {
      "id": "uuid",
      "amount": 10000,
      "termMonths": 12,
      "annualRate": 12,
      "monthlyPayment": 888.49,
      "purpose": "EDUCACION",
      "status": "PENDING",
      "riskScore": null,
      "createdAt": "2026-07-20T12:00:00.000Z",
      "customer": { "id": "uuid", "firstName": "Juan", "lastName": "Perez", "documentNumber": "1234567" },
      "reviewer": null
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
}
```

#### `GET /api/admin/loans/applications/:id`

**Response** `200`:
```json
{
  "application": { "...": "full application data" },
  "customer": {
    "id": "uuid",
    "firstName": "Juan",
    "lastName": "Perez",
    "documentType": "CI",
    "documentNumber": "1234567",
    "status": "REGISTERED",
    "kycStatus": "COMPLETED",
    "addresses": [],
    "phones": [],
    "incomes": [{ "source": "SALARY", "amount": 5000, "frequency": "MONTHLY", "monthlyAmount": 5000 }],
    "employments": [],
    "bankAccounts": [],
    "documents": [{ "type": "CI_FRONT", "fileName": "ci.jpg", "status": "VERIFIED" }]
  },
  "totalMonthlyIncome": 5000,
  "dti": 0.18,
  "timeline": []
}
```

#### `POST /api/admin/loans/applications/:id/review`

**Request**: `{}` (empty)
**Response** `200`: `{ "id": "uuid", "status": "IN_REVIEW", "reviewerId": "admin-uuid" }`
**Error** `409`: already reviewed by another admin

#### `POST /api/admin/loans/applications/:id/approve`

**Request**: `{ "notes": "Cliente cumple perfil" }`
**Response** `200`: `{ "id": "uuid", "status": "APPROVED", "riskScore": "LOW", "reviewedAt": "..." }`
**Error** `422`: DTI > 0.50 or missing documents

#### `POST /api/admin/loans/applications/:id/reject`

**Request**: `{ "reason": "Documentación insuficiente" }`
**Response** `200`: `{ "id": "uuid", "status": "REJECTED", "reviewNotes": "Documentación insuficiente" }`

#### `POST /api/admin/loans/applications/:id/request-info`

**Request**: `{ "message": "Por favor sube tu último recibo de sueldo" }`
**Response** `200`: `{ "id": "uuid", "status": "INFO_REQUESTED", "reviewNotes": "..." }`

---

## 4. State Machine Implementation

### Transition Enforcement

1. **Entity methods validate first** — `canTransition(from, to)` checks the lookup table. Throws `LoanStatusTransitionError` if invalid.
2. **Pre-conditions checked at application layer** — incomes, documents, DTI, reviewer identity.
3. **Atomic status update** — `updateStatus(id, fromStatus, toStatus, data)` uses Prisma `updateMany({ where: { id, status: fromStatus } })`. If `count === 0`, the status changed between read and write → throws `LoanAlreadyReviewedError`.

### Race Condition Handling

```typescript
// In Prisma repository:
async updateStatus(id: string, fromStatus: string, toStatus: string, data: Record<string, unknown>): Promise<boolean> {
  const result = await this.prisma.loanApplication.updateMany({
    where: { id, status: fromStatus },
    data: { status: toStatus, ...data },
  });
  return result.count > 0;
}
```

This covers:
- Two admins trying to review the same application (both read `PENDING`, first one's `updateMany` succeeds, second gets `count === 0`)
- Admin trying to approve after another admin already changed status
- Client trying to cancel after admin already took it

### Timeline Storage

Timeline is stored as a JSON array on the `LoanApplication.timeline` field:

```json
[
  { "fromStatus": null, "toStatus": "DRAFT", "changedBy": "customer", "changedAt": "2026-07-20T12:00:00.000Z" },
  { "fromStatus": "DRAFT", "toStatus": "PENDING", "changedBy": "customer", "changedAt": "2026-07-20T12:05:00.000Z" },
  { "fromStatus": "PENDING", "toStatus": "IN_REVIEW", "changedBy": "admin", "changedAt": "2026-07-20T14:00:00.000Z" },
  { "fromStatus": "IN_REVIEW", "toStatus": "APPROVED", "changedBy": "admin", "changedAt": "2026-07-20T14:30:00.000Z", "notes": "Cliente cumple perfil" }
]
```

`ponytail: JSON field avoids a separate events table. If timeline queries become frequent or need indexing, extract to LoanApplicationEvent table.`

---

## 5. Risk Assessment (DTI)

### Calculation

```
DTI = monthlyPayment / totalMonthlyIncome
```

### Income Normalization

| Frequency | Normalization |
|-----------|---------------|
| `MONTHLY` | `amount × 1` |
| `BIWEEKLY` | `amount × 2` |
| `WEEKLY` | `amount × 4.33` |
| `YEARLY` | `amount ÷ 12` |

### Fallback Chain

1. `CustomerIncome[]` — sum of all normalized amounts
2. `Customer.monthlyIncome` — single fallback field
3. If neither exists → `InsufficientIncomeError` ("El cliente no tiene ingresos registrados")

### Thresholds

| DTI Range | Score | Behavior |
|-----------|-------|----------|
| ≤ 0.30 | `LOW` | Approval allowed. Documents verified. |
| ≤ 0.50 | `MEDIUM` | Approval allowed, admin discretion. |
| > 0.50 | `HIGH` | Approval BLOCKED with `422`. No override without explicit flag. |

`ponytail: HIGH blocks approval for MVP. If business needs override, add `forceApprove: true` flag in the approve payload.`

---

## 6. Frontend Design

### 6.1 Portal: "Mis Préstamos"

#### Route Structure

| Route | Component | Description |
|-------|-----------|-------------|
| `/portal/loans` | `LoanListPage` | List of customer's applications |
| `/portal/loans/new` | `LoanFormPage` | Create application form |
| `/portal/loans/[id]` | `LoanDetailPage` | Detail with timeline + documents |

#### Hook — `use-loans.ts`

```typescript
// apps/web/features/loans/hooks/use-loans.ts
'use client';
import { useCallback, useState } from 'react';
import type { CreateLoanApplicationInput, LoanApplicationResponse, LoanApplicationDetailResponse } from '@prestamos/shared';
import { api, ApiError } from '@/lib/api-client';

export function useLoans() {
  const [applications, setApplications] = useState<LoanApplicationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const list = useCallback(async () => {
    setIsLoading(true);
    try {
      setError(null);
      const data = await api.get<LoanApplicationResponse[]>('/api/loans/applications');
      setApplications(data);
      return data;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al cargar solicitudes';
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const create = useCallback(async (input: CreateLoanApplicationInput & { submit?: boolean }) => {
    setIsLoading(true);
    try {
      setError(null);
      const data = await api.post<LoanApplicationResponse>('/api/loans/applications', input as unknown as Record<string, unknown>);
      setApplications((prev) => [data, ...prev]);
      return data;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al crear solicitud';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const get = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      setError(null);
      return await api.get<LoanApplicationDetailResponse>(`/api/loans/applications/${id}`);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al cargar solicitud';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const cancel = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      setError(null);
      const data = await api.delete<LoanApplicationResponse>(`/api/loans/applications/${id}`);
      setApplications((prev) => prev.map(a => a.id === id ? { ...a, status: 'CANCELLED' } : a));
      return data;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al cancelar solicitud';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { applications, isLoading, error, list, create, get, cancel };
}
```

#### Sidebar Update

Add to the `navItems` array in `portal-sidebar.tsx`:

```typescript
import { CreditCard } from 'lucide-react';

const navItems = [
  { href: '/portal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/portal/profile', label: 'Mi Perfil', icon: UserCircle },
  { href: '/portal/documents', label: 'Documentos', icon: FileText },
  { href: '/portal/loans', label: 'Mis Préstamos', icon: CreditCard },  // ← NEW
  { href: '/portal/simulator', label: 'Simulador', icon: Calculator },
];
```

#### Components

- **`loan-list.tsx`**: Table with columns (Monto, Plazo, Cuota, Propósito, Estado, Fecha). Status badges with semantic colors. Row click → navigate to detail.
- **`loan-detail.tsx`**: Card with full application info, timeline (vertical stepper), documents section, cancel button (conditionally shown for DRAFT/PENDING).
- **`loan-form.tsx`**: Form with fields (amount, termMonths, annualRate, purpose) using shared Zod schema for validation. Pre-populated & readonly when `simulationId` is present. Submit button creates application (`submit: true`).

### 6.2 Admin: Panel de Revisión

#### Route Structure

| Route | Component | Description |
|-------|-----------|-------------|
| `/admin/loans` | `AdminLoanListPage` | Table with filters |
| `/admin/loans/[id]` | `AdminLoanReviewPage` | Full review panel |

#### Hook — `use-admin-loans.ts`

```typescript
// apps/web/features/admin/hooks/use-admin-loans.ts
'use client';
import { useCallback, useState } from 'react';
import type { AdminListResponse, AdminApplicationDetail } from '@prestamos/shared';
import { api } from '@/lib/api-client';

export function useAdminLoans() {
  const [list, setList] = useState<AdminListResponse['data']>([]);
  const [pagination, setPagination] = useState<AdminListResponse['pagination'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listPending = useCallback(async (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    const data = await api.get<AdminListResponse>(`/api/admin/loans/applications?${query}`);
    setList(data.data);
    setPagination(data.pagination);
    return data;
  }, []);

  const getDetail = useCallback(async (id: string) => {
    return api.get<AdminApplicationDetail>(`/api/admin/loans/applications/${id}`);
  }, []);

  const approve = useCallback(async (id: string, notes?: string) => {
    return api.post(`/api/admin/loans/applications/${id}/approve`, { notes });
  }, []);

  const reject = useCallback(async (id: string, reason: string) => {
    return api.post(`/api/admin/loans/applications/${id}/reject`, { reason });
  }, []);

  const requestInfo = useCallback(async (id: string, message: string) => {
    return api.post(`/api/admin/loans/applications/${id}/request-info`, { message });
  }, []);

  const assignReview = useCallback(async (id: string) => {
    return api.post(`/api/admin/loans/applications/${id}/review`, {});
  }, []);

  return { list, pagination, isLoading, error, listPending, getDetail, approve, reject, requestInfo, assignReview };
}
```

#### Admin Components

- **`admin-loan-table.tsx`**: Table with filters (status dropdown, date range, search input). Pagination. Each row shows customer name + document + amount + status + date. Click → review page.
- **`admin-loan-review.tsx`**: Split panel: left side shows customer data (profile, documents w/ verification status, incomes w/ DTI calculation), right side shows application detail + action buttons (Approve, Reject w/ reason dialog, Request Info w/ message dialog). Auto-assigns on first action.

### 6.3 Simulator Integration

In `AmortizationTable.tsx`, add a "Solicitar este préstamo" button below the summary when the user is in the authenticated portal simulator:

```tsx
// Inside AmortizationTable, when simulation has results
{showApplyButton && (
  <Button
    onClick={() => router.push(`/portal/loans/new?simulationId=${simulationId}`)}
    className="w-full"
  >
    Solicitar este préstamo
  </Button>
)}
```

The portal simulator already requires auth → no unauthenticated check needed for the portal route. The public simulator on the landing page does NOT show this button.

---

## 7. Sequence Diagrams

### 7.1 Customer Creates Application from Simulation → Submits

```
Client                    LoanApplicationController      CreateApplicationHandler       PrismaRepository       CustomerIncome
  │                                │                              │                          │                    │
  │  POST /api/loans/applications  │                              │                          │                    │
  │  { simulationId, submit:true } │                              │                          │                    │
  │───────────────────────────────>│                              │                          │                    │
  │                                │  execute(customer, input)    │                          │                    │
  │                                │─────────────────────────────>│                          │                    │
  │                                │                              │  findUnique(simulation)   │                    │
  │                                │                              │─────────────────────────>│                    │
  │                                │                              │<──────────────────────────│                    │
  │                                │                              │                          │                    │
  │                                │                              │  findMany(incomes)        │                    │
  │                                │                              │──────────────────────────────────────────────>│
  │                                │                              │<───────────────────────────────────────────────│
  │                                │                              │                          │                    │
  │                                │                              │  if no incomes →         │                    │
  │                                │                              │  InsufficientIncomeError  │                    │
  │                                │                              │                          │                    │
  │                                │                              │  new LoanApplication()    │                    │
  │                                │                              │  entity.submit()          │                    │
  │                                │                              │  → status = PENDING       │                    │
  │                                │                              │                          │                    │
  │                                │                              │  save(entity)             │                    │
  │                                │                              │─────────────────────────>│                    │
  │                                │  <--- LoanApplicationResponse│                          │                    │
  │<── 201 Created ───────────────│                              │                          │                    │
```

### 7.2 Admin Reviews → Approves (with DTI)

```
Admin                     AdminLoanApplicationController     ReviewApplicationHandler         PrismaRepository     CustomerDocument
  │                                │                              │                              │                    │
  │ POST /:id/approve              │                              │                              │                    │
  │ { notes: "ok" }               │                              │                              │                    │
  │───────────────────────────────>│                              │                              │                    │
  │                                │  execute(adminId, id,        │                              │                    │
  │                                │           'approve', payload)│                              │                    │
  │                                │─────────────────────────────>│                              │                    │
  │                                │                              │  findById(id)                │                    │
  │                                │                              │─────────────────────────────>│                    │
  │                                │                              │<──────────────────────────────│                    │
  │                                │                              │                              │                    │
  │                                │                              │  entity.approve() check:     │                    │
  │                                │                              │  reviewerId === adminId?     │                    │
  │                                │                              │  canTransition?              │                    │
  │                                │                              │                              │                    │
  │                                │                              │  find CI_FRONT, CI_BACK      │                    │
  │                                │                              │─────────────────────────────────────────────────>│
  │                                │                              │<──────────────────────────────────────────────────│
  │                                │                              │  if !VERIFIED →              │                    │
  │                                │                              │  MissingDocumentsError       │                    │
  │                                │                              │                              │                    │
  │                                │                              │  calculateDTI():             │                    │
  │                                │                              │  load CustomerIncome[]       │                    │
  │                                │                              │  normalize to monthly        │                    │
  │                                │                              │  dti = payment / income      │                    │
  │                                │                              │  riskScore = LOW/MEDIUM/HIGH │                    │
  │                                │                              │                              │                    │
  │                                │                              │  if DTI > 0.50 →             │                    │
  │                                │                              │  HighRiskLoanError           │                    │
  │                                │                              │                              │                    │
  │                                │                              │  updateStatus(id,            │                    │
  │                                │                              │    'IN_REVIEW','APPROVED',   │                    │
  │                                │                              │    {riskScore,reviewedAt})   │                    │
  │                                │                              │─────────────────────────────>│                    │
  │                                │                              │<── count === 1 (success) ────│                    │
  │                                │  <--- 200 OK {status,score}  │                              │                    │
  │<── 200 OK ───────────────────│                              │                              │                    │
```

### 7.3 Admin Reviews → Rejects

```
Admin                     AdminLoanApplicationController     ReviewApplicationHandler         PrismaRepository
  │                                │                              │                              │
  │ POST /:id/reject               │                              │                              │
  │ { reason: "Documentación..." } │                              │                              │
  │───────────────────────────────>│                              │                              │
  │                                │  execute(adminId, id,        │                              │
  │                                │           'reject', payload) │                              │
  │                                │─────────────────────────────>│                              │
  │                                │                              │  findById(id)                │
  │                                │                              │─────────────────────────────>│
  │                                │                              │<──────────────────────────────│
  │                                │                              │                              │
  │                                │                              │  entity.reject(adminId,      │
  │                                │                              │    "Documentación...")       │
  │                                │                              │  → status = REJECTED         │
  │                                │                              │  → reviewNotes = reason       │
  │                                │                              │                              │
  │                                │                              │  updateStatus(id,            │
  │                                │                              │    'IN_REVIEW','REJECTED',   │
  │                                │                              │    {reviewNotes,reviewedAt}) │
  │                                │                              │─────────────────────────────>│
  │                                │                              │<── count === 1 ──────────────│
  │                                │  <--- 200 OK {status,notes}  │                              │
  │<── 200 OK ───────────────────│                              │                              │
```

---

## 8. Module Wiring

### `loans.tokens.ts`

```typescript
// apps/api/src/loans/loans.tokens.ts
export const LOAN_APPLICATION_REPOSITORY = Symbol('LOAN_APPLICATION_REPOSITORY');
export const ADMIN_QUERY = Symbol('ADMIN_QUERY');
```

### `loans.module.ts`

```typescript
// apps/api/src/loans/loans.module.ts
import { Module } from '@nestjs/common';
import { CUSTOMER_REPOSITORY } from '../customers/customers.tokens';
import { PrismaCustomerRepository } from '../customers/infrastructure/persistence/prisma-customer.repository';

// Domain
import { LOAN_APPLICATION_REPOSITORY, ADMIN_QUERY } from './loans.tokens';

// Infrastructure
import { PrismaLoanApplicationRepository } from './infrastructure/persistence/prisma-loan-application.repository';
import { PrismaAdminQueryImpl } from './infrastructure/admin-query/prisma-admin-query.impl';

// Application
import { CreateApplicationHandler } from './application/create-application/create-application.handler';
import { ListApplicationsHandler } from './application/get-applications/get-applications.handler';
import { GetApplicationHandler } from './application/get-application/get-application.handler';
import { CancelApplicationHandler } from './application/cancel-application/cancel-application.handler';
import { ReviewApplicationHandler } from './application/review-application/review-application.handler';
import { ListPendingApplicationsHandler } from './application/list-pending-applications/list-pending-applications.handler';

// Presentation
import { LoanApplicationController } from './presentation/loan-application.controller';
import { AdminLoanApplicationController } from './presentation/admin-loan-application.controller';
import { AdminGuard } from './presentation/admin.guard';

@Module({
  controllers: [
    LoanApplicationController,
    AdminLoanApplicationController,
  ],
  providers: [
    // Repositories
    { provide: LOAN_APPLICATION_REPOSITORY, useClass: PrismaLoanApplicationRepository },
    { provide: ADMIN_QUERY, useClass: PrismaAdminQueryImpl },

    // Customer repo (needed for DTI fallback)
    { provide: CUSTOMER_REPOSITORY, useClass: PrismaCustomerRepository },

    // Handlers
    CreateApplicationHandler,
    ListApplicationsHandler,
    GetApplicationHandler,
    CancelApplicationHandler,
    ReviewApplicationHandler,
    ListPendingApplicationsHandler,

    // Guards
    AdminGuard,
  ],
})
export class LoansModule {}
```

### `app.module.ts` — Import LoansModule

```typescript
import { LoansModule } from './loans/loans.module';

@Module({
  imports: [
    // ... existing modules
    LoansModule,
  ],
})
export class AppModule {}
```

### AdminGuard Registration

`AdminGuard` is provided in `LoansModule.providers[]` — it's available for any controller within the module. No global registration needed since it's only used on admin loan controllers.

`ponytail: If AdminGuard is needed across multiple modules later, extract it to SharedModule and make it global. For now, colocated in loans/ is simpler.`

---

## 9. Testing Strategy

### 9.1 Unit Tests — Entity State Machine

```typescript
// apps/api/src/loans/domain/loan-application.entity.spec.ts
describe('LoanApplication', () => {
  describe('submit()', () => {
    it('transitions from DRAFT to PENDING', () => {
      const app = createDraftApplication();
      app.submit();
      expect(app.status).toBe('PENDING');
    });

    it('throws from IN_REVIEW', () => {
      const app = createApplicationWithStatus('IN_REVIEW');
      expect(() => app.submit()).toThrow(LoanStatusTransitionError);
    });

    it('throws from APPROVED (terminal)', () => {
      const app = createApplicationWithStatus('APPROVED');
      expect(() => app.submit()).toThrow(LoanStatusTransitionError);
    });
  });

  describe('cancel()', () => {
    it('cancels from DRAFT', () => {
      const app = createDraftApplication();
      app.cancel();
      expect(app.status).toBe('CANCELLED');
    });

    it('cancels from PENDING', () => {
      const app = createApplicationWithStatus('PENDING');
      app.cancel();
      expect(app.status).toBe('CANCELLED');
    });

    it('throws from IN_REVIEW', () => {
      const app = createApplicationWithStatus('IN_REVIEW');
      expect(() => app.cancel()).toThrow(LoanStatusTransitionError);
    });
  });

  describe('approve()', () => {
    it('approves with correct reviewer and riskScore', () => {
      const app = createApplicationInReview('reviewer-1');
      app.approve('reviewer-1', 'LOW');
      expect(app.status).toBe('APPROVED');
      expect(app.riskScore).toBe('LOW');
      expect(app.reviewedAt).toBeTruthy();
    });

    it('throws if wrong reviewer', () => {
      const app = createApplicationInReview('reviewer-1');
      expect(() => app.approve('reviewer-2', 'LOW')).toThrow(LoanNotOwnedByCustomerError);
    });
  });

  describe('reject()', () => {
    it('rejects with reason', () => {
      const app = createApplicationInReview('reviewer-1');
      app.reject('reviewer-1', 'Documentación insuficiente');
      expect(app.status).toBe('REJECTED');
      expect(app.reviewNotes).toBe('Documentación insuficiente');
    });
  });

  describe('requestInfo()', () => {
    it('changes to INFO_REQUESTED with message', () => {
      const app = createApplicationInReview('reviewer-1');
      app.requestInfo('reviewer-1', 'Sube tu recibo de sueldo');
      expect(app.status).toBe('INFO_REQUESTED');
      expect(app.reviewNotes).toBe('Sube tu recibo de sueldo');
    });
  });

  describe('respondToInfo()', () => {
    it('returns to PENDING keeping reviewerId', () => {
      const app = createApplicationWithStatus('INFO_REQUESTED');
      app.reviewerId = 'reviewer-1';
      app.respondToInfo();
      expect(app.status).toBe('PENDING');
      expect(app.reviewerId).toBe('reviewer-1');  // reviewer is preserved
    });
  });

  describe('terminal states', () => {
    it.each(['APPROVED', 'REJECTED', 'CANCELLED'])('throws on any transition from %s', (status) => {
      const app = createApplicationWithStatus(status as LoanStatus);
      expect(() => app.submit()).toThrow(LoanStatusTransitionError);
      expect(() => app.cancel()).toThrow(LoanStatusTransitionError);
    });
  });
});
```

### 9.2 Unit Tests — DTI Calculation

```typescript
// In review-application.handler.spec.ts
describe('DTI Calculation', () => {
  it('calculates DTI from multiple MONTHLY incomes', () => {
    const handler = createHandler(mockIncomes([
      { amount: 5000, frequency: 'MONTHLY' },
      { amount: 1500, frequency: 'MONTHLY' },
    ]));
    const result = handler.calculateDTI('cid', 1950);
    expect(result.dti).toBeCloseTo(0.30, 2);
    expect(result.riskScore).toBe('LOW');
  });

  it('normalizes BIWEEKLY income', () => {
    const handler = createHandler(mockIncomes([
      { amount: 3000, frequency: 'BIWEEKLY' },
    ]));
    const result = handler.calculateDTI('cid', 2400);
    expect(result.dti).toBeCloseTo(0.40, 2);
    expect(result.riskScore).toBe('MEDIUM');
  });

  it('throws on missing incomes', () => {
    const handler = createHandler([]);
    expect(() => handler.calculateDTI('cid', 1000)).toThrow(InsufficientIncomeError);
  });

  it('blocks HIGH DTI with error', () => {
    const handler = createHandler(mockIncomes([
      { amount: 5000, frequency: 'MONTHLY' },
    ]));
    const result = handler.calculateDTI('cid', 3000);
    expect(result.riskScore).toBe('HIGH');
    expect(result.dti).toBeGreaterThan(0.50);
  });
});
```

### 9.3 Integration Tests — Controllers

| Test | Endpoint | Expected |
|------|----------|----------|
| Create application from simulation | `POST /api/loans/applications` | 201 + correct fields |
| Create application direct | `POST /api/loans/applications` | 201 + calculated values |
| Create with submit=true and no incomes | `POST /api/loans/applications` | 422 |
| Create with submit=true and incomes | `POST /api/loans/applications` | 201 + PENDING |
| List own applications | `GET /api/loans/applications` | 200 + customer's only |
| Get application detail | `GET /api/loans/applications/:id` | 200 + full detail |
| Get another's application | `GET /api/loans/applications/:id` | 404 (not found) |
| Cancel DRAFT | `DELETE /api/loans/applications/:id` | 200 + CANCELLED |
| Cancel IN_REVIEW | `DELETE /api/loans/applications/:id` | 409 |
| Admin list (default) | `GET /api/admin/loans/applications` | 200 + PENDING/IN_REVIEW |
| Admin list with filter | `GET /api/admin/loans/applications?status=APPROVED` | 200 + filtered |
| Admin get detail | `GET /api/admin/loans/applications/:id` | 200 + customer data |
| Admin assign review | `POST /api/admin/loans/applications/:id/review` | 200 + IN_REVIEW |
| Admin approve | `POST /api/admin/loans/applications/:id/approve` | 200 + APPROVED |
| Admin reject | `POST /api/admin/loans/applications/:id/reject` | 200 + REJECTED |
| Admin request-info | `POST /api/admin/loans/applications/:id/request-info` | 200 + INFO_REQUESTED |

### 9.4 Controller Tests via curl

```bash
# Create application from simulation (with valid simulationId)
curl -X POST http://localhost:3000/api/loans/applications \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"simulationId":"<uuid>","purpose":"NEGOCIO","submit":true}'

# Create application directly
curl -X POST http://localhost:3000/api/loans/applications \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":10000,"termMonths":12,"annualRate":12,"purpose":"EDUCACION","submit":true}'

# List own applications
curl -X GET http://localhost:3000/api/loans/applications \
  -H "Authorization: Bearer $TOKEN"

# Cancel application
curl -X DELETE http://localhost:3000/api/loans/applications/<id> \
  -H "Authorization: Bearer $TOKEN"

# Admin: list pending
curl -X GET http://localhost:3000/api/admin/loans/applications \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Admin: approve
curl -X POST http://localhost:3000/api/admin/loans/applications/<id>/approve \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes":"Cliente cumple perfil"}'

# Admin: reject
curl -X POST http://localhost:3000/api/admin/loans/applications/<id>/reject \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Documentación insuficiente"}'
```

### 9.5 Frontend Tests

| Test | Component | What |
|------|-----------|------|
| Status badge renders correct color | `loan-list` | Each status → correct badge variant |
| Cancel button visibility | `loan-detail` | Visible for DRAFT/PENDING, hidden otherwise |
| Empty state | `loan-list` | Shows "No tienes solicitudes" when empty |
| Form validation mirrors schema | `loan-form` | Amount > 500K shows error before submit |
| Timeline rendering | `loan-detail` | All entries rendered in order |
| Admin approve flow | `admin-loan-review` | Dialog + confirmation + API call |
| Hook loading states | `use-loans` | `isLoading` during request, `error` on failure |

---

## 10. Shared Zod Schemas

```typescript
// packages/shared/src/schemas/loan.schema.ts
import { z } from 'zod';

export const LoanPurposeEnum = z.enum(['NEGOCIO', 'EDUCACION', 'SALUD', 'VIAJE', 'OTRO']);
export type LoanPurpose = z.infer<typeof LoanPurposeEnum>;

export const LoanStatusEnum = z.enum([
  'DRAFT', 'PENDING', 'IN_REVIEW', 'INFO_REQUESTED',
  'APPROVED', 'REJECTED', 'CANCELLED',
]);
export type LoanStatus = z.infer<typeof LoanStatusEnum>;

// Refined: either simulationId OR direct fields, not both
export const CreateLoanApplicationSchema = z.object({
  simulationId: z.string().uuid().optional(),
  amount: z.number().positive().min(100).max(500000).optional(),
  termMonths: z.number().int().min(3).max(120).optional(),
  annualRate: z.number().positive().max(36).optional(),
  purpose: LoanPurposeEnum.optional(),
  submit: z.boolean().optional(),
}).refine(
  (data) => {
    if (data.simulationId) {
      // simulationId + direct fields conflict
      return !data.amount && !data.termMonths && !data.annualRate;
    }
    // without simulationId, direct fields are required
    return data.amount != null && data.termMonths != null && data.annualRate != null;
  },
  {
    message: 'Debe proporcionar simulationId o (amount, termMonths, annualRate), no ambos',
    path: ['simulationId'],
  },
);
export type CreateLoanApplicationInput = z.infer<typeof CreateLoanApplicationSchema>;

export const ReviewApplicationSchema = z.object({
  notes: z.string().max(1000).optional(),
  reason: z.string().min(1).max(1000).optional(),
  message: z.string().min(1).max(1000).optional(),
});
export type ReviewLoanApplicationInput = z.infer<typeof ReviewApplicationSchema>;

export const AdminListQuerySchema = z.object({
  status: LoanStatusEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().max(100).optional(),
});
export type AdminListQuery = z.infer<typeof AdminListQuerySchema>;
```

Also add to `packages/shared/src/types/loan.types.ts`:

```typescript
// packages/shared/src/types/loan.types.ts
export interface LoanApplicationResponse {
  id: string;
  amount: number;
  termMonths: number;
  annualRate: number;
  monthlyPayment: number;
  totalInterest: number;
  totalPayment: number;
  purpose: string | null;
  status: string;
  riskScore: string | null;
  simulationId: string | null;
  reviewerId: string | null;
  reviewNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  timeline: TimelineEntry[];
}

export interface TimelineEntry {
  fromStatus: string | null;
  toStatus: string;
  changedBy: string;
  changedAt: string;
  notes?: string;
}

export interface AdminListResponse {
  data: AdminApplicationListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminApplicationListItem extends LoanApplicationResponse {
  customer: {
    id: string;
    firstName: string;
    lastName: string | null;
    documentNumber: string | null;
  };
}

export interface AdminApplicationDetail {
  application: LoanApplicationResponse;
  customer: FullCustomerProfile;
  documents: DocumentResponse[];
  incomes: IncomeResponseWithMonthly[];
  totalMonthlyIncome: number;
  dti: number;
}

export interface IncomeResponseWithMonthly {
  id: string;
  source: string | null;
  amount: number;
  frequency: string | null;
  monthlyAmount: number;
}
```

Export from `packages/shared/src/index.ts`:
```typescript
export * from './schemas/loan.schema';
export * from './types/loan.types';
```

---

## 11. File Manifest

### New Files (24)

| File | Purpose |
|------|---------|
| `apps/api/prisma/migrations/*_add_loan_application/` | Prisma migration |
| `apps/api/src/loans/loans.module.ts` | Module wiring |
| `apps/api/src/loans/loans.tokens.ts` | DI tokens |
| `apps/api/src/loans/domain/value-objects/loan-status.ts` | Status value object + transition matrix |
| `apps/api/src/loans/domain/loan-application.entity.ts` | Entity with state machine |
| `apps/api/src/loans/domain/loan-application.repository.ts` | Repository port |
| `apps/api/src/loans/domain/loan-application.errors.ts` | Domain errors |
| `apps/api/src/loans/application/create-application/create-application.handler.ts` | Create handler |
| `apps/api/src/loans/application/get-applications/get-applications.handler.ts` | List handler |
| `apps/api/src/loans/application/get-application/get-application.handler.ts` | Get detail handler |
| `apps/api/src/loans/application/cancel-application/cancel-application.handler.ts` | Cancel handler |
| `apps/api/src/loans/application/review-application/review-application.handler.ts` | Admin review handler (approve/reject/request-info) |
| `apps/api/src/loans/application/list-pending-applications/list-pending-applications.handler.ts` | Admin list handler |
| `apps/api/src/loans/application/ports/admin-query.port.ts` | Admin query port |
| `apps/api/src/loans/infrastructure/persistence/prisma-loan-application.repository.ts` | Prisma repository |
| `apps/api/src/loans/infrastructure/admin-query/prisma-admin-query.impl.ts` | Prisma admin query |
| `apps/api/src/loans/presentation/loan-application.controller.ts` | Customer controller |
| `apps/api/src/loans/presentation/admin-loan-application.controller.ts` | Admin controller |
| `apps/api/src/loans/presentation/admin.guard.ts` | AdminGuard |
| `packages/shared/src/schemas/loan.schema.ts` | Zod schemas |
| `packages/shared/src/types/loan.types.ts` | Response types |
| `apps/web/features/loans/hooks/use-loans.ts` | Customer loan hook |
| `apps/web/features/loans/components/loan-list.tsx` | Customer list component |
| `apps/web/features/loans/components/loan-detail.tsx` | Customer detail component |
| `apps/web/features/loans/components/loan-form.tsx` | Customer create form |
| `apps/web/features/admin/hooks/use-admin-loans.ts` | Admin loan hook |
| `apps/web/features/admin/components/admin-loan-table.tsx` | Admin list component |
| `apps/web/features/admin/components/admin-loan-review.tsx` | Admin review component |
| `apps/web/app/portal/loans/page.tsx` | Portal loans page |
| `apps/web/app/portal/loans/new/page.tsx` | Portal create page |
| `apps/web/app/portal/loans/[id]/page.tsx` | Portal detail page |
| `apps/web/app/admin/loans/page.tsx` | Admin list page |
| `apps/web/app/admin/loans/[id]/page.tsx` | Admin review page |

### Modified Files (6)

| File | Change |
|------|--------|
| `apps/api/prisma/schema.prisma` | Add `LoanApplication` model |
| `apps/api/src/app.module.ts` | Import `LoansModule` |
| `packages/shared/src/index.ts` | Export loan schemas + types |
| `apps/web/features/portal/components/portal-sidebar.tsx` | Add "Mis Préstamos" nav item |
| `apps/web/features/portal/components/amortization-table.tsx` | Add "Solicitar este préstamo" button |

---

## 12. Rollout & Rollback

### Rollout Order

1. **Prisma migration** — `pnpm --filter @prestamos/api exec prisma migrate dev`
2. **Shared schemas** — `packages/shared/src/schemas/loan.schema.ts` and exports
3. **Backend module** — All domain/application/infrastructure/presentation files
4. **Module wiring** — `loans.module.ts` + `app.module.ts`
5. **Frontend** — Hooks, components, pages, sidebar
6. **Test** — Run unit tests, integration tests, curl tests

### Rollback

1. Remove `LoansModule` import from `app.module.ts`
2. Delete `apps/api/src/loans/` directory
3. Delete frontend pages and revert sidebar
4. Revert `packages/shared/src/index.ts`
5. Run `pnpm --filter @prestamos/api exec prisma migrate dev --name drop_loan_application`
6. No existing endpoints or data affected — all additive
