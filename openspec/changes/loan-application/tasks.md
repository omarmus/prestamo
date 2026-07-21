# Tasks: Loan Application Workflow

## Review Workload Forecast

~1,760 líneas estimadas (backend: ~940, frontend: ~770, shared: ~50).
With C4 (auto) PR strategy, split into **3 chained PRs** (stacked-to-main).
Budget: ilimitado.

**PR 1** — Prisma Schema + Backend Domain + Loan Creation (~580 lines)
**PR 2** — Backend CRUD + Admin Review (~530 lines)
**PR 3** — Frontend Portal + Admin UI + Simulator Integration (~650 lines)

---

## PR 1 — Prisma Schema + Backend Domain + Loan Creation

### Phase 1: Prisma Model `LoanApplication`

- [ ] 1.1 Agregar modelo `LoanApplication` en `apps/api/prisma/schema.prisma` con todos los campos y relaciones, índices:

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
    status         String   @default("DRAFT")
    riskScore      String?
    timeline       Json?

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

- [ ] 1.2 Ejecutar migración:

  ```bash
  pnpm --filter @prestamos/api exec prisma migrate dev --name add_loan_application
  ```

- [ ] 1.3 Regenerar Prisma Client:

  ```bash
  pnpm --filter @prestamos/api exec prisma generate
  ```

### Phase 2: Domain — Value Objects

- [ ] 2.1 Crear `apps/api/src/loans/domain/value-objects/loan-status.ts` con la transición matrix + función `canTransition`:

  ```typescript
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

### Phase 3: Domain — Entity & Errors

- [ ] 3.1 Crear `apps/api/src/loans/domain/loan-application.errors.ts` — todos los errores de dominio con `statusCode`:

  ```typescript
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

- [ ] 3.2 Crear `apps/api/src/loans/domain/loan-application.entity.ts` — entidad con state machine + timeline:

  ```typescript
  import type { LoanStatus } from './value-objects/loan-status';
  import { canTransition } from './value-objects/loan-status';
  import { LoanStatusTransitionError, LoanNotOwnedByCustomerError } from './loan-application.errors';

  export interface TimelineEntry {
    fromStatus: LoanStatus | null;
    toStatus: LoanStatus;
    changedBy: 'customer' | 'admin';
    changedAt: string;
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

    submit(): void { this.transition('PENDING', 'customer'); }
    cancel(): void { this.transition('CANCELLED', 'customer', 'Cancelado por el cliente'); }

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
    }
  }
  ```

- [ ] 3.3 Crear `apps/api/src/loans/domain/loan-application.repository.ts` — repository port:

  ```typescript
  import type { LoanApplication } from './loan-application.entity';
  import type { LoanStatus } from './value-objects/loan-status';

  export interface LoanApplicationRepository {
    findById(id: string): Promise<LoanApplication | null>;
    findByCustomerId(customerId: string): Promise<LoanApplication[]>;
    findByCustomerIdAndId(customerId: string, id: string): Promise<LoanApplication | null>;
    findPending(page: number, limit: number, status?: string[]): Promise<{ data: LoanApplication[]; total: number }>;
    save(application: LoanApplication): Promise<void>;
    updateStatus(id: string, fromStatus: string, toStatus: string, data: Record<string, unknown>): Promise<boolean>;
  }
  ```

### Phase 4: Shared Zod Schemas + Types

- [ ] 4.1 Crear `packages/shared/src/schemas/loan.schema.ts`:

  ```typescript
  import { z } from 'zod';

  export const LoanPurposeEnum = z.enum(['NEGOCIO', 'EDUCACION', 'SALUD', 'VIAJE', 'OTRO']);
  export type LoanPurpose = z.infer<typeof LoanPurposeEnum>;

  export const LoanStatusEnum = z.enum([
    'DRAFT', 'PENDING', 'IN_REVIEW', 'INFO_REQUESTED',
    'APPROVED', 'REJECTED', 'CANCELLED',
  ]);
  export type LoanStatus = z.infer<typeof LoanStatusEnum>;

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
        return !data.amount && !data.termMonths && !data.annualRate;
      }
      return data.amount != null && data.termMonths != null && data.annualRate != null;
    },
    { message: 'Debe proporcionar simulationId o (amount, termMonths, annualRate), no ambos', path: ['simulationId'] },
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

- [ ] 4.2 Crear `packages/shared/src/types/loan.types.ts` con `LoanApplicationResponse`, `TimelineEntry`, `AdminListResponse`, `AdminApplicationListItem`, `AdminApplicationDetail`, `IncomeResponseWithMonthly`.

- [ ] 4.3 Modificar `packages/shared/src/index.ts` — agregar exports:

  ```typescript
  export * from './schemas/loan.schema';
  export * from './types/loan.types';
  ```

### Phase 5: Application — CreateApplicationHandler

- [ ] 5.1 Crear `apps/api/src/loans/application/create-application/create-application.handler.ts`:

  ```typescript
  @Injectable()
  export class CreateApplicationHandler {
    constructor(
      @Inject(LOAN_APPLICATION_REPOSITORY)
      private readonly repo: LoanApplicationRepository,
      @Inject(CUSTOMER_REPOSITORY)
      private readonly customerRepo: CustomerRepository,
      @Inject(PrismaService)
      private readonly prisma: PrismaService,
    ) {}

    async execute(customer: Customer, input: CreateLoanApplicationInput & { submit?: boolean }): Promise<LoanApplicationResponse> {
      // 1. Resolve loan data: from simulationId OR calculate directly
      // 2. If submit=true, validate incomes exist
      // 3. Create entity + timeline entry
      // 4. Persist via repo.save()
      // 5. Return toResponse()
    }
  }
  ```

- [ ] 5.2 Crear `apps/api/src/loans/application/create-application/create-application.handler.spec.ts` con tests:
  - Create from simulation (happy path)
  - Create directly with all fields
  - Simulation belongs to another customer → 404
  - Simulation not found → 404
  - Create with submit=true and no incomes → 422
  - Create with submit=true and incomes → 201 + PENDING
  - Create without submit → 201 + DRAFT
  - Validation: amount exceeds max
  - Validation: simulationId + direct fields conflict

### Phase 6: Infrastructure — Prisma Repository

- [ ] 6.1 Crear `apps/api/src/loans/infrastructure/persistence/prisma-loan-application.repository.ts` — implementación completa del port con `toEntity()`, `toPrisma()`, y `updateMany` para atomic status transitions:

  ```typescript
  @Injectable()
  export class PrismaLoanApplicationRepository implements LoanApplicationRepository {
    constructor(
      @Inject(PrismaService) private readonly prisma: PrismaService,
    ) {}

    async updateStatus(id: string, fromStatus: string, toStatus: string, data: Record<string, unknown>): Promise<boolean> {
      const result = await this.prisma.loanApplication.updateMany({
        where: { id, status: fromStatus },
        data: { status: toStatus, ...data },
      });
      return result.count > 0;
    }
    // ... findAll, findByCustomerId, findByCustomerIdAndId, findPending, save, toEntity, toPrisma
  }
  ```

### Phase 7: Module Wiring (Minimal)

- [ ] 7.1 Crear `apps/api/src/loans/loans.tokens.ts`:

  ```typescript
  export const LOAN_APPLICATION_REPOSITORY = Symbol('LOAN_APPLICATION_REPOSITORY');
  export const ADMIN_QUERY = Symbol('ADMIN_QUERY');
  ```

- [ ] 7.2 Crear `apps/api/src/loans/loans.module.ts` — versión mínima con solo el repository y `CreateApplicationHandler`:

  ```typescript
  @Module({
    controllers: [],  // controllers added in PR 2
    providers: [
      { provide: LOAN_APPLICATION_REPOSITORY, useClass: PrismaLoanApplicationRepository },
      { provide: CUSTOMER_REPOSITORY, useClass: PrismaCustomerRepository },
      CreateApplicationHandler,
      // Other handlers added in PR 2
    ],
  })
  export class LoansModule {}
  ```

- [ ] 7.3 Modificar `apps/api/src/app.module.ts` — importar `LoansModule`:

  ```typescript
  import { LoansModule } from './loans/loans.module';
  // dentro de imports: ..., LoansModule,
  ```

### Verify PR 1

```bash
pnpm --filter @prestamos/api exec npx tsc --noEmit
pnpm lint
pnpm build
pnpm --filter @prestamos/api exec vitest run apps/api/src/loans/domain/loan-application.entity.spec.ts
pnpm --filter @prestamos/api exec vitest run apps/api/src/loans/application/create-application/create-application.handler.spec.ts
```

---

## PR 2 — Backend CRUD + Admin Review

### Phase 1: Application — List, Get, Cancel Handlers

- [ ] 1.1 Crear `apps/api/src/loans/application/get-applications/get-applications.handler.ts` — `ListApplicationsHandler`:

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

- [ ] 1.2 Crear `apps/api/src/loans/application/get-application/get-application.handler.ts` — `GetApplicationHandler` que filtra por `customerId`:

  ```typescript
  async execute(customerId: string, applicationId: string): Promise<LoanApplicationDetailResponse> {
    const app = await this.repo.findByCustomerIdAndId(customerId, applicationId);
    if (!app) throw new LoanNotFoundError(applicationId);
    return this.toDetailResponse(app);
  }
  ```

- [ ] 1.3 Crear `apps/api/src/loans/application/cancel-application/cancel-application.handler.ts` — `CancelApplicationHandler` con atomic `updateStatus`:

  ```typescript
  async execute(customerId: string, applicationId: string): Promise<LoanApplicationResponse> {
    const app = await this.repo.findByCustomerIdAndId(customerId, applicationId);
    if (!app) throw new LoanNotFoundError(applicationId);
    app.cancel();  // validates transition
    const updated = await this.repo.updateStatus(applicationId, 'CANCELLED', app.timeline);
    if (!updated) throw new LoanAlreadyReviewedError();
    return this.toResponse(app);
  }
  ```

  Nota: `updateStatus` recibe `fromStatus` = el status ANTERIOR (DRAFT o PENDING). El entity ya mutó a CANCELLED, pero para el `where` de la DB necesitamos el status previo. Esto requiere un refactor: pasar `fromStatus` como parámetro aparte, o guardar el status previo antes de mutar.

  `ponytail: guardar `previousStatus = app.status` antes de `app.cancel()`, pasar `previousStatus` a `updateStatus`.`

- [ ] 1.4 Crear tests unitarios para cada handler:
  - `ListApplicationsHandler`: customer con y sin solicitudes, no ve solicitudes de otros
  - `GetApplicationHandler`: detalle correcto, solicitud de otro → 404, inexistente → 404
  - `CancelApplicationHandler`: cancel DRAFT, cancel PENDING, cancel IN_REVIEW → 409, cancel APPROVED → 409

### Phase 2: Application — Admin Review (approve/reject/request-info)

- [ ] 2.1 Crear `apps/api/src/loans/application/review-application/review-application.handler.ts` — handler único con action discriminator + DTI calculation:

  ```typescript
  @Injectable()
  export class ReviewApplicationHandler {
    constructor(
      @Inject(LOAN_APPLICATION_REPOSITORY)
      private readonly repo: LoanApplicationRepository,
      @Inject(CUSTOMER_REPOSITORY)
      private readonly customerRepo: CustomerRepository,
      @Inject(PrismaService)
      private readonly prisma: PrismaService,
    ) {}

    async execute(adminId: string, applicationId: string, action: 'review' | 'approve' | 'reject' | 'request-info', payload: ReviewPayload): Promise<LoanApplicationResponse> {
      const app = await this.repo.findById(applicationId);
      if (!app) throw new LoanNotFoundError(applicationId);
      switch (action) {
        case 'review': return this.assignReview(adminId, app);
        case 'approve': return this.approve(adminId, app, payload);
        case 'reject': return this.reject(adminId, app, payload.reason!);
        case 'request-info': return this.requestInfo(adminId, app, payload.message!);
      }
    }

    // assignReview: entity.assignReviewer() + updateStatus with atomic where: { id, status: 'PENDING' }
    // approve: calculateDTI + documents check + entity.approve() + updateStatus with where: { id, status: 'IN_REVIEW' }
    // reject: entity.reject() + updateStatus
    // requestInfo: entity.requestInfo() + updateStatus

    async calculateDTI(customerId: string, monthlyPayment: number): Promise<{ dti: number; riskScore: string }> {
      // Load CustomerIncome[], normalize to monthly, fallback to Customer.monthlyIncome
      // DTI = monthlyPayment / totalMonthlyIncome
      // riskScore: <= 0.30 → LOW, <= 0.50 → MEDIUM, > 0.50 → HIGH
    }
  }
  ```

- [ ] 2.2 Crear `apps/api/src/loans/application/ports/admin-query.port.ts` — port para consulta admin:

  ```typescript
  export interface AdminQuery {
    getApplicationDetail(applicationId: string): Promise<AdminApplicationDetail | null>;
  }
  ```

- [ ] 2.3 Crear `apps/api/src/loans/application/list-pending-applications/list-pending-applications.handler.ts` — `ListPendingApplicationsHandler` con paginación y filtros.

- [ ] 2.4 Crear tests para `ReviewApplicationHandler`:
  - Assign review (PENDING → IN_REVIEW)
  - Approve low-risk (DTI ≤ 0.30) → APPROVED + riskScore LOW
  - Approve medium-risk (DTI 0.40) → APPROVED + riskScore MEDIUM
  - Approve high-risk (DTI > 0.50) → 422
  - Approve without verified CI documents → 422
  - Approve by wrong reviewer → error
  - Reject with reason → REJECTED + reviewNotes
  - Request info → INFO_REQUESTED + reviewNotes
  - Race condition: second admin gets 409
  - DTI calculation with BIWEEKLY/WEEKLY/YEARLY normalization
  - DTI fallback to Customer.monthlyIncome when no CustomerIncome records
  - DTI precision (2 decimales)

### Phase 3: Infrastructure — Admin Query

- [ ] 3.1 Crear `apps/api/src/loans/infrastructure/admin-query/prisma-admin-query.impl.ts` — `PrismaAdminQueryImpl` con `getApplicationDetail()` que hace `findUnique` con `include` de todo el customer:

  ```typescript
  async getApplicationDetail(applicationId: string): Promise<AdminApplicationDetail | null> {
    const app = await this.prisma.loanApplication.findUnique({
      where: { id: applicationId },
      include: {
        customer: {
          include: {
            addresses: true, phones: true, incomes: true,
            employment: true, bankAccounts: true, documents: true,
            simulations: true,
          },
        },
      },
    });
    // normalize incomes, calculate DTI, return AdminApplicationDetail
  }
  ```

### Phase 4: Presentation — Controllers & AdminGuard

- [ ] 4.1 Crear `apps/api/src/loans/presentation/admin.guard.ts`:

  ```typescript
  @Injectable()
  export class AdminGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
      const request = context.switchToHttp().getRequest<{ user: JwtPayload }>();
      return request.user?.role === 'ADMIN';
    }
  }
  ```

- [ ] 4.2 Crear `apps/api/src/loans/presentation/loan-application.controller.ts` — customer endpoints con `@UseGuards(JwtAuthGuard, CustomerGuard)`:

  | Method | Path | Handler |
  |--------|------|---------|
  | `@Post()` | `/api/loans/applications` | `createHandler.execute(req.customer, body)` |
  | `@Get()` | `/api/loans/applications` | `listHandler.execute(user.sub)` |
  | `@Get(':id')` | `/api/loans/applications/:id` | `getHandler.execute(user.sub, id)` |
  | `@Delete(':id')` | `/api/loans/applications/:id` | `cancelHandler.execute(user.sub, id)` |

  ```typescript
  @Controller('api/loans/applications')
  @UseGuards(JwtAuthGuard, CustomerGuard)
  export class LoanApplicationController {
    constructor(
      @Inject(CreateApplicationHandler) private readonly createHandler: CreateApplicationHandler,
      @Inject(ListApplicationsHandler) private readonly listHandler: ListApplicationsHandler,
      @Inject(GetApplicationHandler) private readonly getHandler: GetApplicationHandler,
      @Inject(CancelApplicationHandler) private readonly cancelHandler: CancelApplicationHandler,
    ) {}

    @Post()
    @HttpCode(201)
    create(@CurrentUser() user: JwtPayload, @Req() req: RequestWithCustomer, @Body(new ZodValidationPipe(CreateLoanApplicationSchema)) body: CreateLoanApplicationInput) {
      return this.createHandler.execute(req.customer, body);
    }

    @Get()
    list(@CurrentUser() user: JwtPayload) {
      return this.listHandler.execute(user.sub);
    }

    @Get(':id')
    get(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
      return this.getHandler.execute(user.sub, id);
    }

    @Delete(':id')
    cancel(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
      return this.cancelHandler.execute(user.sub, id);
    }
  }
  ```

- [ ] 4.3 Crear `apps/api/src/loans/presentation/admin-loan-application.controller.ts` — admin endpoints con `@UseGuards(JwtAuthGuard, AdminGuard)`:

  | Method | Path | Handler |
  |--------|------|---------|
  | `@Get()` | `/api/admin/loans/applications` | `listPendingHandler.execute(query)` |
  | `@Get(':id')` | `/api/admin/loans/applications/:id` | `adminQuery.getApplicationDetail(id)` |
  | `@Post(':id/review')` | `/api/admin/loans/applications/:id/review` | `reviewHandler.execute(user.sub, id, 'review', {})` |
  | `@Post(':id/approve')` | `/api/admin/loans/applications/:id/approve` | `reviewHandler.execute(user.sub, id, 'approve', body)` |
  | `@Post(':id/reject')` | `/api/admin/loans/applications/:id/reject` | `reviewHandler.execute(user.sub, id, 'reject', body)` |
  | `@Post(':id/request-info')` | `/api/admin/loans/applications/:id/request-info` | `reviewHandler.execute(user.sub, id, 'request-info', body)` |

- [ ] 4.4 Crear `apps/api/src/loans/presentation/dto/create-application.dto.ts` y `apps/api/src/loans/presentation/dto/review-application.dto.ts` — exports de schemas de Zod (opcional, se puede usar ZodValidationPipe directamente con schemas de shared).

### Phase 5: Full Module Wiring

- [ ] 5.1 Actualizar `apps/api/src/loans/loans.module.ts` — agregar todos los handlers, controllers, guards, admin query:

  ```typescript
  @Module({
    controllers: [LoanApplicationController, AdminLoanApplicationController],
    providers: [
      { provide: LOAN_APPLICATION_REPOSITORY, useClass: PrismaLoanApplicationRepository },
      { provide: ADMIN_QUERY, useClass: PrismaAdminQueryImpl },
      { provide: CUSTOMER_REPOSITORY, useClass: PrismaCustomerRepository },
      CreateApplicationHandler,
      ListApplicationsHandler,
      GetApplicationHandler,
      CancelApplicationHandler,
      ReviewApplicationHandler,
      ListPendingApplicationsHandler,
      AdminGuard,
    ],
  })
  export class LoansModule {}
  ```

  Nota: `app.module.ts` ya importa `LoansModule` (desde PR 1). No necesita cambios.

### Phase 6: Integration Tests + Curl Verification

- [ ] 6.1 Crear `apps/api/src/loans/presentation/loan-application.controller.spec.ts` — tests de integración del controlador customer:
  - Create from simulation → 201
  - Create direct → 201
  - Create with submit=true and incomes → 201 PENDING
  - Create with submit=true no incomes → 422
  - List own applications → 200
  - Get own detail → 200
  - Get another's → 404
  - Cancel DRAFT → 200
  - Cancel IN_REVIEW → 409

- [ ] 6.2 Crear `apps/api/src/loans/presentation/admin-loan-application.controller.spec.ts` — tests de integración admin:
  - List pending (default filter) → 200
  - List with status filter → 200
  - Get detail → 200 + customer data
  - Assign review → 200 + IN_REVIEW
  - Approve → 200 + APPROVED
  - Reject → 200 + REJECTED
  - Request info → 200 + INFO_REQUESTED
  - Non-admin user → 403

- [ ] 6.3 Probar endpoints con curl (documentar en PR description):

  ```bash
  # Create application from simulation
  curl -X POST http://localhost:3000/api/loans/applications \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"simulationId":"<uuid>","purpose":"NEGOCIO","submit":true}'

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

### Verify PR 2

```bash
pnpm --filter @prestamos/api exec npx tsc --noEmit
pnpm lint
pnpm build
pnpm --filter @prestamos/api exec vitest run apps/api/src/loans/application/review-application/review-application.handler.spec.ts
pnpm --filter @prestamos/api exec vitest run apps/api/src/loans/presentation/loan-application.controller.spec.ts
pnpm --filter @prestamos/api exec vitest run apps/api/src/loans/presentation/admin-loan-application.controller.spec.ts
```

---

## PR 3 — Frontend Portal + Admin UI + Simulator Integration

### Phase 1: Portal — Hook `useLoans`

- [ ] 1.1 Crear `apps/web/features/loans/hooks/use-loans.ts` con `useState` + `useCallback`:

  ```typescript
  'use client';
  import { useCallback, useState } from 'react';
  import type { CreateLoanApplicationInput, LoanApplicationResponse } from '@prestamos/shared';
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
        return await api.get<LoanApplicationResponse>(`/api/loans/applications/${id}`);
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

- [ ] 1.2 Crear test `apps/web/features/loans/hooks/__tests__/use-loans.test.ts`:
  - `list()` hace GET a `/api/loans/applications`
  - `create()` hace POST con el body correcto
  - `cancel()` hace DELETE y actualiza estado local
  - Loading state during request
  - Error handling con `ApiError`

### Phase 2: Portal — Components

- [ ] 2.1 Crear `apps/web/features/loans/components/loan-list.tsx`:
  - Tabla con columnas: Monto, Plazo, Cuota Mensual, Propósito, Estado (badge semántico), Fecha
  - Badge de estado con colores: DRAFT=gris, PENDING=amarillo, IN_REVIEW=azul, INFO_REQUESTED=naranja, APPROVED=verde, REJECTED=rojo, CANCELLED=gris oscuro
  - Row click → navega a `/portal/loans/[id]`
  - Empty state: "No tienes solicitudes" con CTA al simulador
  - Usar `buttonVariants` de shadcn/ui para los Link (no `asChild`)

- [ ] 2.2 Crear `apps/web/features/loans/components/loan-detail.tsx`:
  - Card con info completa (monto, plazo, tasa, cuota, total interés, total pago, propósito)
  - Timeline vertical (stepper) con todas las entradas en orden cronológico
  - Sección "Documentos" con lista de documentos del perfil + status badges
  - Botón "Cancelar solicitud" condicional (solo visible en DRAFT o PENDING) con diálogo de confirmación
  - Documentos empty state: "Aún no has subido documentos" + link a `/portal/documents`

- [ ] 2.3 Crear `apps/web/features/loans/components/loan-form.tsx`:
  - Formulario con campos: amount, termMonths, annualRate, purpose
  - Pre-poblado y readonly cuando viene con `simulationId` desde query params
  - Validación inline usando `CreateLoanApplicationSchema` de shared
  - Select para purpose (NEGOCIO, EDUCACION, SALUD, VIAJE, OTRO)
  - Botón "Enviar solicitud" con loading state
  - Redirección a `/portal/loans/[id]` después de creación exitosa

### Phase 3: Portal — Pages

- [ ] 3.1 Crear `apps/web/app/portal/loans/page.tsx` — página de lista:

  ```tsx
  'use client';
  import { useEffect } from 'react';
  import { useLoans } from '@/features/loans/hooks/use-loans';
  import { LoanList } from '@/features/loans/components/loan-list';
  import { Loader2 } from 'lucide-react';

  export default function LoanListPage() {
    const { applications, isLoading, error, list } = useLoans();
    useEffect(() => { list(); }, [list]);
    if (isLoading) return <main className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></main>;
    if (error) return <main className="p-8"><p className="text-destructive">{error}</p></main>;
    return <main className="p-8"><LoanList applications={applications} /></main>;
  }
  ```

- [ ] 3.2 Crear `apps/web/app/portal/loans/new/page.tsx` — página de creación:

  ```tsx
  'use client';
  import { useSearchParams } from 'next/navigation';
  import { LoanForm } from '@/features/loans/components/loan-form';

  export default function LoanFormPage() {
    const searchParams = useSearchParams();
    const simulationId = searchParams.get('simulationId') ?? undefined;
    return <main className="p-8"><LoanForm simulationId={simulationId} /></main>;
  }
  ```

- [ ] 3.3 Crear `apps/web/app/portal/loans/[id]/page.tsx` — página de detalle:

  ```tsx
  'use client';
  import { useEffect, useState } from 'react';
  import { useParams } from 'next/navigation';
  import { useLoans } from '@/features/loans/hooks/use-loans';
  import { LoanDetail } from '@/features/loans/components/loan-detail';
  import { Loader2 } from 'lucide-react';

  export default function LoanDetailPage() {
    const params = useParams();
    const { get, isLoading, error } = useLoans();
    const [application, setApplication] = useState(null);
    useEffect(() => { get(params.id).then(setApplication); }, [params.id, get]);
    if (isLoading) return <main className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></main>;
    if (error || !application) return <main className="p-8"><p className="text-destructive">{error ?? 'Solicitud no encontrada'}</p></main>;
    return <main className="p-8"><LoanDetail application={application} /></main>;
  }
  ```

### Phase 4: Admin — Hook `useAdminLoans`

- [ ] 4.1 Crear `apps/web/features/admin/hooks/use-admin-loans.ts`:

  ```typescript
  'use client';
  import { useCallback, useState } from 'react';
  import type { AdminListResponse, AdminApplicationDetail } from '@prestamos/shared';
  import { api } from '@/lib/api-client';

  export function useAdminLoans() {
    const [list, setList] = useState<AdminListResponse['data']>([]);
    const [pagination, setPagination] = useState<AdminListResponse['pagination'] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const listPending = useCallback(async (params?: Record<string, string>) => { /* ... */ }, []);
    const getDetail = useCallback(async (id: string) => { /* ... */ }, []);
    const approve = useCallback(async (id: string, notes?: string) => { /* ... */ }, []);
    const reject = useCallback(async (id: string, reason: string) => { /* ... */ }, []);
    const requestInfo = useCallback(async (id: string, message: string) => { /* ... */ }, []);
    const assignReview = useCallback(async (id: string) => { /* ... */ }, []);

    return { list, pagination, isLoading, error, listPending, getDetail, approve, reject, requestInfo, assignReview };
  }
  ```

### Phase 5: Admin — Components & Pages

- [ ] 5.1 Crear `apps/web/features/admin/components/admin-loan-table.tsx`:
  - Tabla con columnas: Cliente, Documento, Monto, Estado, Fecha
  - Filtros: status dropdown, date range, search input por nombre/dni
  - Paginación
  - Row click → navega a `/admin/loans/[id]`
  - Empty state: "No hay solicitudes pendientes"

- [ ] 5.2 Crear `apps/web/features/admin/components/admin-loan-review.tsx`:
  - Split panel: izquierda = datos del cliente (profile, documents con status, incomes con DTI), derecha = detalle de solicitud + acciones
  - Acciones: Aprobar (con campo opcional notes), Rechazar (con reason requerido en dialog), Solicitar más info (con message en dialog)
  - Auto-assign on first action (llama a `assignReview` si no está asignada)
  - DTI display con color semántico (verde ≤ 0.30, amarillo ≤ 0.50, rojo > 0.50)
  - Confirmación antes de acciones destructivas (rechazar)

- [ ] 5.3 Crear `apps/web/app/admin/loans/page.tsx` — página de lista admin:

  ```tsx
  'use client';
  import { useEffect } from 'react';
  import { useAdminLoans } from '@/features/admin/hooks/use-admin-loans';
  import { AdminLoanTable } from '@/features/admin/components/admin-loan-table';

  export default function AdminLoanListPage() {
    const { list, pagination, isLoading, error, listPending } = useAdminLoans();
    useEffect(() => { listPending(); }, [listPending]);
    // render with filters + table + pagination
  }
  ```

- [ ] 5.4 Crear `apps/web/app/admin/loans/[id]/page.tsx` — página de review admin:

  ```tsx
  'use client';
  import { useEffect, useState } from 'react';
  import { useParams } from 'next/navigation';
  import { useAdminLoans } from '@/features/admin/hooks/use-admin-loans';
  import { AdminLoanReview } from '@/features/admin/components/admin-loan-review';

  export default function AdminLoanReviewPage() {
    const params = useParams();
    const { getDetail, isLoading, error } = useAdminLoans();
    const [detail, setDetail] = useState(null);
    useEffect(() => { getDetail(params.id).then(setDetail); }, [params.id, getDetail]);
    // render AdminLoanReview with detail
  }
  ```

### Phase 6: Sidebar Update

- [ ] 6.1 Modificar `apps/web/features/portal/components/portal-sidebar.tsx` — agregar nav item "Mis Préstamos" con icono `CreditCard` de `lucide-react` entre "Documentos" y "Simulador":

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

### Phase 7: Simulator → Apply Button

- [ ] 7.1 Modificar `apps/web/features/portal/components/amortization-table.tsx` — agregar botón "Solicitar este préstamo" debajo del resumen:

  ```tsx
  {showApplyButton && simulationId && (
    <Button
      onClick={() => router.push(`/portal/loans/new?simulationId=${simulationId}`)}
      className="w-full"
    >
      Solicitar este préstamo
    </Button>
  )}
  ```

  Condiciones: solo visible cuando el usuario está autenticado en el portal (ya se cumple porque el portal requiere auth) y cuando hay resultados visibles con `simulationId` disponible.

### Phase 8: Stories

- [ ] 8.1 Crear `apps/web/stories/LoanList.stories.tsx` — Default, Con solicitudes, Vacío
- [ ] 8.2 Crear `apps/web/stories/LoanDetail.stories.tsx` — Default (APPROVED), Con botón cancelar (DRAFT), Con timeline completo
- [ ] 8.3 Crear `apps/web/stories/LoanForm.stories.tsx` — Desde simulación (readonly), Directo, Con error de validación
- [ ] 8.4 Crear `apps/web/stories/AdminLoanTable.stories.tsx` — Default, Con filtros, Vacío
- [ ] 8.5 Crear `apps/web/stories/AdminLoanReview.stories.tsx` — Default con datos de cliente, DTI bajo, DTI alto

### Phase 9: Frontend Tests

- [ ] 9.1 Crear `apps/web/features/loans/hooks/__tests__/use-loans.test.ts` (same as 1.2) — tests de hook:
  - Test 1: `list()` hace GET a `/api/loans/applications`
  - Test 2: `create()` hace POST con body correcto
  - Test 3: `cancel()` hace DELETE y actualiza estado local
  - Test 4: Loading state durante request
  - Test 5: Error handling

- [ ] 9.2 Crear tests para `admin-loan-table` (opcional si hay tiempo):
  - Renderiza filas correctamente
  - Filtros actualizan query params
  - Empty state

- [ ] 9.3 Verificar tests existentes del sidebar no se rompen con el nuevo nav item

### Verify PR 3

```bash
pnpm --filter @prestamos/web exec npx tsc --noEmit
pnpm lint
pnpm build
pnpm --filter @prestamos/web exec vitest run apps/web/features/loans/hooks/__tests__/use-loans.test.ts
pnpm storybook  # visual check de las nuevas stories
```

---

## Full Integration Verification

Una vez mergedos los 3 PRs, ejecutar de punta a punta:

```bash
# 1. Type-check y build
pnpm type-check
pnpm build

# 2. Tests backend
pnpm --filter @prestamos/api exec vitest run apps/api/src/loans/

# 3. Tests frontend
pnpm --filter @prestamos/web exec vitest run apps/web/features/loans/
pnpm --filter @prestamos/web exec vitest run apps/web/features/admin/

# 4. Curl: flujo completo
# 4a. Crear solicitud desde simulación
curl -X POST http://localhost:3000/api/loans/applications \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"simulationId":"<uuid>","purpose":"NEGOCIO","submit":true}'

# 4b. Listar mis solicitudes
curl -X GET http://localhost:3000/api/loans/applications \
  -H "Authorization: Bearer $TOKEN"

# 4c. Admin: listar pendientes
curl -X GET http://localhost:3000/api/admin/loans/applications \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 4d. Admin: revisar y aprobar
curl -X POST http://localhost:3000/api/admin/loans/applications/<id>/review \
  -H "Authorization: Bearer $ADMIN_TOKEN"
curl -X POST http://localhost:3000/api/admin/loans/applications/<id>/approve \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes":"Aprobado"}'

# 5. Frontend: navegar a /portal/loans, /portal/loans/new?simulationId=..., /admin/loans
```

## File Manifest

### PR 1 — New Files (12)

| File | Purpose |
|------|---------|
| `apps/api/prisma/migrations/*_add_loan_application/` | Prisma migration |
| `apps/api/src/loans/loans.module.ts` | Module wiring |
| `apps/api/src/loans/loans.tokens.ts` | DI tokens |
| `apps/api/src/loans/domain/value-objects/loan-status.ts` | Status VO + transition matrix |
| `apps/api/src/loans/domain/loan-application.entity.ts` | Entity with state machine |
| `apps/api/src/loans/domain/loan-application.repository.ts` | Repository port |
| `apps/api/src/loans/domain/loan-application.errors.ts` | Domain errors |
| `apps/api/src/loans/application/create-application/create-application.handler.ts` | Create handler |
| `apps/api/src/loans/application/create-application/create-application.handler.spec.ts` | Create handler tests |
| `apps/api/src/loans/infrastructure/persistence/prisma-loan-application.repository.ts` | Prisma repository |
| `packages/shared/src/schemas/loan.schema.ts` | Zod schemas |
| `packages/shared/src/types/loan.types.ts` | Response types |

### PR 1 — Modified Files (3)

| File | Change |
|------|--------|
| `apps/api/prisma/schema.prisma` | Add `LoanApplication` model |
| `packages/shared/src/index.ts` | Export loan schemas + types |
| `apps/api/src/app.module.ts` | Import `LoansModule` |

### PR 2 — New Files (12)

| File | Purpose |
|------|---------|
| `apps/api/src/loans/application/get-applications/get-applications.handler.ts` | List handler |
| `apps/api/src/loans/application/get-applications/get-applications.handler.spec.ts` | List handler tests |
| `apps/api/src/loans/application/get-application/get-application.handler.ts` | Get detail handler |
| `apps/api/src/loans/application/get-application/get-application.handler.spec.ts` | Get detail handler tests |
| `apps/api/src/loans/application/cancel-application/cancel-application.handler.ts` | Cancel handler |
| `apps/api/src/loans/application/cancel-application/cancel-application.handler.spec.ts` | Cancel handler tests |
| `apps/api/src/loans/application/review-application/review-application.handler.ts` | Admin review handler |
| `apps/api/src/loans/application/review-application/review-application.handler.spec.ts` | Review handler tests |
| `apps/api/src/loans/application/list-pending-applications/list-pending-applications.handler.ts` | Admin list handler |
| `apps/api/src/loans/application/ports/admin-query.port.ts` | Admin query port |
| `apps/api/src/loans/infrastructure/admin-query/prisma-admin-query.impl.ts` | Prisma admin query |
| `apps/api/src/loans/presentation/loan-application.controller.ts` | Customer controller |
| `apps/api/src/loans/presentation/loan-application.controller.spec.ts` | Customer controller tests |
| `apps/api/src/loans/presentation/admin-loan-application.controller.ts` | Admin controller |
| `apps/api/src/loans/presentation/admin-loan-application.controller.spec.ts` | Admin controller tests |
| `apps/api/src/loans/presentation/admin.guard.ts` | AdminGuard |
| `apps/api/src/loans/presentation/dto/create-application.dto.ts` | Create DTO |
| `apps/api/src/loans/presentation/dto/review-application.dto.ts` | Review DTO |

### PR 3 — New Files (16)

| File | Purpose |
|------|---------|
| `apps/web/features/loans/hooks/use-loans.ts` | Customer loan hook |
| `apps/web/features/loans/hooks/__tests__/use-loans.test.ts` | Hook tests |
| `apps/web/features/loans/components/loan-list.tsx` | Customer list component |
| `apps/web/features/loans/components/loan-detail.tsx` | Customer detail component |
| `apps/web/features/loans/components/loan-form.tsx` | Customer create form |
| `apps/web/app/portal/loans/page.tsx` | Portal loans page |
| `apps/web/app/portal/loans/new/page.tsx` | Portal create page |
| `apps/web/app/portal/loans/[id]/page.tsx` | Portal detail page |
| `apps/web/features/admin/hooks/use-admin-loans.ts` | Admin loan hook |
| `apps/web/features/admin/components/admin-loan-table.tsx` | Admin list component |
| `apps/web/features/admin/components/admin-loan-review.tsx` | Admin review component |
| `apps/web/app/admin/loans/page.tsx` | Admin list page |
| `apps/web/app/admin/loans/[id]/page.tsx` | Admin review page |
| `apps/web/stories/LoanList.stories.tsx` | LoanList story |
| `apps/web/stories/LoanDetail.stories.tsx` | LoanDetail story |
| `apps/web/stories/AdminLoanTable.stories.tsx` | AdminLoanTable story |
| `apps/web/stories/AdminLoanReview.stories.tsx` | AdminLoanReview story |

### PR 3 — Modified Files (2)

| File | Change |
|------|--------|
| `apps/web/features/portal/components/portal-sidebar.tsx` | Add "Mis Préstamos" nav item |
| `apps/web/features/portal/components/amortization-table.tsx` | Add "Solicitar este préstamo" button |
