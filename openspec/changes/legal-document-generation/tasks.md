# Tasks: Legal Document Generation

## PR 1 — Foundation (Backend: Prisma + Domain + Infrastructure)

### Task 1.1: Add `GeneratedDocument` model and `DocumentType` enum to Prisma schema

**File change list:**
- **Modify** `apps/api/prisma/schema.prisma` — add `DocumentType` enum and `GeneratedDocument` model after the `LoanTransaction` model block

```prisma
enum DocumentType {
  LOAN_CONTRACT
  PROMISSORY_NOTE
}

model GeneratedDocument {
  id        String       @id @default(uuid())
  loanId    String       @unique
  loan      Loan         @relation(fields: [loanId], references: [id], onDelete: Cascade)
  type      DocumentType @default(LOAN_CONTRACT)
  filePath  String
  mimeType  String       @default("application/pdf")
  metadata  Json?
  createdAt DateTime     @default(now())

  @@index([loanId])
}
```

**Acceptance criteria:**
- [ ] `DocumentType` enum exists with `LOAN_CONTRACT` and `PROMISSORY_NOTE` values
- [ ] `GeneratedDocument` model has all required fields: `id`, `loanId` (unique), `type` (enum), `filePath`, `mimeType`, `metadata` (optional Json), `createdAt`
- [ ] `@@index([loanId])` is present
- [ ] Cascade delete on loan removal

**Dependencies:** None

---

### Task 1.2: Create Prisma migration

**File change list:**
- Run `pnpm --filter @prestamos/api exec prisma migrate dev --name add-generated-document`
- Commit the generated migration directory

**Acceptance criteria:**
- [ ] Migration runs cleanly (`prisma migrate dev` passes)
- [ ] `generated_documents` table created in PostgreSQL with columns: `id` (UUID PK), `loan_id` (UUID unique FK), `type` (enum), `file_path` (text), `mime_type` (text), `metadata` (jsonb nullable), `created_at` (timestamptz)
- [ ] `DocumentType` enum created in PostgreSQL
- [ ] Foreign key `loan_id → loans.id ON DELETE CASCADE`
- [ ] Index on `loan_id` exists
- [ ] Rollback via `prisma migrate down` drops the table

**Dependencies:** Task 1.1

---

### Task 1.3: Create `GeneratedDocumentRepository` port (domain interface)

**File change list:**
- **Create** `apps/api/src/loans/domain/generated-document.repository.ts`

```ts
// Port interface — single source of truth for generated document persistence.
// Matches the Installment pattern (entity-free, Prisma-backed).
export interface GeneratedDocumentRepository {
  findByLoanId(loanId: string): Promise<GeneratedDocumentRow | null>;
  save(doc: Omit<GeneratedDocumentRow, 'id' | 'createdAt'>): Promise<GeneratedDocumentRow>;
}

// ponytail: Flat row type instead of domain entity — no behavior, no entity wrapper.
// Add domain entity only when document lifecycle logic emerges.
export interface GeneratedDocumentRow {
  id: string;
  loanId: string;
  type: string;
  filePath: string;
  mimeType: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}
```

**Acceptance criteria:**
- [ ] Interface `GeneratedDocumentRepository` exported with `findByLoanId` and `save` methods
- [ ] `GeneratedDocumentRow` type exported with all required fields
- [ ] No NestJS decorators — pure TypeScript interface in the `domain/` layer

**Dependencies:** None

---

### Task 1.4: Create `PrismaGeneratedDocumentRepository` implementation

**File change list:**
- **Create** `apps/api/src/loans/infrastructure/persistence/prisma-generated-document.repository.ts`

```ts
@Injectable()
export class PrismaGeneratedDocumentRepository implements GeneratedDocumentRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}
  // findByLoanId, save — follows PrismaLoanRepository pattern
}
```

**Acceptance criteria:**
- [ ] Class implements `GeneratedDocumentRepository`
- [ ] `findByLoanId` returns row or `null`
- [ ] `save` accepts `Omit<GeneratedDocumentRow, 'id' | 'createdAt'>` and returns full row with generated `id` and `createdAt`
- [ ] Inline Prisma row type to avoid pre-generation import issues (matches `PrismaLoanRow` pattern)
- [ ] Uses `@Inject(PrismaService)` explicitly
- [ ] Unit test: mock Prisma, verify `findByLoanId` calls `findUnique`, `save` calls `create`

**Dependencies:** Task 1.1, Task 1.3

---

### Task 1.5: Create `ContractStorageService` (LocalDocumentStorage wrapper)

**File change list:**
- **Create** `apps/api/src/loans/application/contracts/contract-storage.service.ts`

Wraps `DocumentStoragePort` / `LocalDocumentStorage` to enforce the `uploads/contracts/` subdirectory. Handles filename generation (`{timestamp}-contrato-{loanId}.pdf`).

```ts
@Injectable()
export class ContractStorageService {
  constructor(
    @Inject(DOCUMENT_STORAGE) private readonly storage: DocumentStoragePort,
  ) {}
  // saveContract(buffer, loanId): Promise<string>
  // getContractPath(filePath): string  // absolute path for streaming
}
```

**Acceptance criteria:**
- [ ] `saveContract` generates filename `{timestamp}-contrato-{loanId}.pdf`
- [ ] Delegates to `LocalDocumentStorage.upload` with `application/pdf` MIME type
- [ ] Returns the absolute path reported by `upload`
- [ ] Exists in `loans/application/contracts/` following the application layer convention

**Dependencies:** None (depends on `DocumentStoragePort` which is already in `customers/` — no new dependency)

---

### Task 1.6: Create DI tokens and register in module

**File change list:**
- **Modify** `apps/api/src/loans/loans.tokens.ts` — add two new tokens

```ts
export const GENERATED_DOCUMENT_REPOSITORY = Symbol('GENERATED_DOCUMENT_REPOSITORY');
export const CONTRACT_GENERATOR = Symbol('CONTRACT_GENERATOR');
```

- **Modify** `apps/api/src/loans/loans.module.ts` — register new providers

```ts
import { GENERATED_DOCUMENT_REPOSITORY, CONTRACT_GENERATOR } from './loans.tokens';
import { PrismaGeneratedDocumentRepository } from './infrastructure/persistence/prisma-generated-document.repository';
// ...
providers: [
  // ... existing
  { provide: GENERATED_DOCUMENT_REPOSITORY, useClass: PrismaGeneratedDocumentRepository },
  ContractStorageService,
  // CONTRACT_GENERATOR will be registered in PR 2
]
```

**Acceptance criteria:**
- [ ] `GENERATED_DOCUMENT_REPOSITORY` token exported from `loans.tokens.ts`
- [ ] `CONTRACT_GENERATOR` token exported from `loans.tokens.ts` (for use in PR 2)
- [ ] `PrismaGeneratedDocumentRepository` registered with `GENERATED_DOCUMENT_REPOSITORY` token
- [ ] `ContractStorageService` registered as a provider
- [ ] Module compiles without errors
- [ ] `prisma generate` runs successfully

**Dependencies:** Task 1.4, Task 1.5

---

## PR 2 — Generation + API (Backend: Application + Presentation)

### Task 2.1: Create loan contract template (pdfmake doc definition)

**File change list:**
- **Create** `apps/api/src/loans/application/contract-templates/loan-contract.ts`

Pure function that returns a `TDocumentDefinition`. No I/O, no side effects. Handles null/optional fields safely.

```ts
export interface ContractTemplateData {
  loanId: string;
  amount: number;
  termMonths: number;
  annualRate: number;
  monthlyPayment: number;
  totalInterest: number;
  totalPayment: number;
  disbursedAt: Date;
  installments: Array<{
    number: number;
    dueDate: Date;
    principal: number;
    interest: number;
    total: number;
  }>;
  customer: {
    firstName: string;
    lastName: string | null;
    documentNumber: string | null;
  };
  lender: { name: string }; // ponytail: hardcoded for MVP
}

export function createLoanContract(data: ContractTemplateData): TDocumentDefinition { … }
```

Content includes:
- Header: Título "CONTRATO DE PRÉSTAMO"
- Loan amount, annual rate, term, monthly payment, total interest, total payment
- Borrower info: full name, document number
- Lender info: company name
- Disbursement date
- Amortization schedule table
- Signature lines
- All null customer fields rendered as `'—'` (no crash, no "null" text)
- Spanish locale formatting

Also create a simple registry map:
- **Create** `apps/api/src/loans/application/contract-templates/registry.ts`

```ts
import type { TDocumentDefinition } from 'pdfmake/interfaces';
import type { ContractTemplateData } from './loan-contract';
import { createLoanContract } from './loan-contract';

const registry: Record<string, (data: ContractTemplateData) => TDocumentDefinition> = {
  LOAN_CONTRACT: createLoanContract,
};

export function resolveTemplate(type: string, data: ContractTemplateData): TDocumentDefinition {
  const fn = registry[type];
  if (!fn) throw new Error(`Unknown document type: ${type}`);
  return fn(data);
}
```

**Acceptance criteria:**
- [ ] Template function is pure (no I/O, no side effects)
- [ ] Returns valid `TDocumentDefinition` (pdfmake-compatible)
- [ ] Output includes: amount, rate, term, monthly payment, total interest, total payment, schedule table, borrower info, lender info, signature lines
- [ ] Null `lastName` renders `firstName + ''` (no crash, no "null")
- [ ] Null `documentNumber` renders `'—'`
- [ ] Registry resolves `LOAN_CONTRACT` correctly
- [ ] Unknown type throws descriptive error
- [ ] Unit test: verify doc definition shape, content arrays, style keys

**Dependencies:** None (pure function, no DI)

---

### Task 2.2: Create `GenerateContractService` (orchestrator)

**File change list:**
- **Create** `apps/api/src/loans/application/contracts/generate-contract.service.ts`

Orchestrates:
1. Fetch customer data via `CustomerRepository`
2. Build `ContractTemplateData` from loan + installments + customer
3. Resolve template via registry → pdfmake `createPdf(template).toBuffer()`
4. Store PDF via `ContractStorageService`
5. Save metadata record via `GeneratedDocumentRepository`
6. Log warning on failure, never throw

```ts
@Injectable()
export class GenerateContractService {
  constructor(
    @Inject(GENERATED_DOCUMENT_REPOSITORY)
    private readonly docRepo: GeneratedDocumentRepository,
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepo: CustomerRepository,
    @Inject(ContractStorageService)
    private readonly storage: ContractStorageService,
    @Inject(PDFMAKE_INSTANCE)
    private readonly pdfmake: PdfmakeInstance,  // ponytail: simple wrapper
  ) {}

  async generateContract(
    loan: { id: string; amount: number; termMonths: number; annualRate: number; monthlyPayment: number; totalInterest: number; totalPayment: number; disbursedAt: Date; customerId: string; status: string },
    installments: Array<{ installmentNumber: number; dueDate: Date; principalAmount: number; interestAmount: number; totalAmount: number }>,
  ): Promise<void> {
    try {
      // 1. Fetch customer
      // 2. Build data
      // 3. Render template
      // 4. Store file
      // 5. Save record
    } catch (err) {
      this.logger.warn(`Contract generation failed for loan ${loanId}: ${err}`);
    }
  }
}
```

**Acceptance criteria:**
- [ ] Method `generateContract` accepts loan data + installments
- [ ] Fetches customer via `CustomerRepository.findByUserId` or similar
- [ ] Template data includes metadata snapshot per spec
- [ ] PDF created via pdfmake `createPdf().toBuffer()`
- [ ] File stored via `ContractStorageService`
- [ ] `GeneratedDocument` record saved with correct fields
- [ ] **Any** error is caught, logged at `WARN` level, and **never** propagates
- [ ] Unit test: mock all dependencies, verify orchestration order and error isolation

**Dependencies:** Task 1.5 (ContractStorageService), Task 1.6 (tokens), Task 2.1 (template)

---

### Task 2.3: Modify `DisburseLoanHandler` to call contract generation after transaction

**File change list:**
- **Modify** `apps/api/src/loans/application/disburse-loan/disburse-loan.handler.ts`

Add contract generation call after the DB transaction commits, before the response. The call is wrapped in a try/catch that logs and never blocks the response.

```ts
// After transaction (step 4), before response (step 5):
try {
  await this.contractGenerator.generateContract({ /* loan data */ }, installments);
} catch {
  // Already logged inside generateContract — continue
}
```

Inject `@Inject(CONTRACT_GENERATOR) GenerateContractService`.

**Acceptance criteria:**
- [ ] `GenerateContractService` injected via `@Inject(CONTRACT_GENERATOR)`
- [ ] Generation called AFTER transaction commits
- [ ] Generation failure does NOT affect disbursement response
- [ ] Error logged but never thrown
- [ ] All existing disbursement tests pass unmodified
- [ ] Existing curl-based disbursement test returns same response shape

**Dependencies:** Task 2.2

---

### Task 2.4: Create `ContractController` (portal + admin contract endpoints)

**File change list:**
- **Create** `apps/api/src/loans/presentation/contract.controller.ts`

Single controller with two route methods:

```ts
@Controller()
export class ContractController {
  constructor(
    @Inject(GENERATED_DOCUMENT_REPOSITORY)
    private readonly docRepo: GeneratedDocumentRepository,
  ) {}

  // Portal: GET /api/loans/:loanId/contract
  @Get('api/loans/:loanId/contract')
  @UseGuards(JwtAuthGuard, CustomerGuard)
  async downloadPortal(
    @Req() req: RequestWithCustomer,
    @Param('loanId') loanId: string,
    @Res() res: Response,
  ) { ... }

  // Admin: GET /api/admin/loans/:loanId/contract
  @Get('api/admin/loans/:loanId/contract')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async downloadAdmin(
    @Param('loanId') loanId: string,
    @Res() res: Response,
  ) { ... }
}
```

Portal logic:
1. Fetch `GeneratedDocument` by `loanId`
2. If not found → 404 `{ message: "Contrato no encontrado" }`
3. Verify customer owns the loan (customer guard already attaches customer)
4. Check file exists on disk → 404 if missing
5. Stream file with `Content-Type: application/pdf` and `Content-Disposition: attachment; filename="contrato-{loanId}.pdf"`

Admin logic: same but no customer ownership check (AdminGuard handles authorization).

**Acceptance criteria:**
- [ ] `GET /api/loans/:loanId/contract` returns PDF (200) with correct headers
- [ ] Same endpoint returns 404 when no document exists
- [ ] Same endpoint returns 401 without JWT
- [ ] Customer cannot access another customer's contract (403/404)
- [ ] Missing file on disk returns 404
- [ ] `GET /api/admin/loans/:loanId/contract` returns PDF (200) for admin
- [ ] Admin endpoint returns 404 when no document exists
- [ ] Admin endpoint returns 403 for non-admin users
- [ ] Unit test: mock repository, test 200/404/401/403 scenarios

**Dependencies:** Task 1.3 (GeneratedDocumentRepository port)

---

### Task 2.5: Update shared Zod schemas and TypeScript types

**File change list:**
- **Modify** `packages/shared/src/types/loan.types.ts` — add `GeneratedDocumentResponse`

```ts
export interface GeneratedDocumentResponse {
  id: string;
  loanId: string;
  type: string;
  fileName: string;
  mimeType: string;
  createdAt: string;
}
```

- **Modify** `packages/shared/src/schemas/loan.schema.ts` — add `GeneratedDocumentSchema`

```ts
export const GeneratedDocumentSchema = z.object({
  id: z.string().uuid(),
  loanId: z.string().uuid(),
  type: z.string(),
  fileName: z.string(),
  mimeType: z.string(),
  createdAt: z.string().datetime(),
});
export type GeneratedDocumentResponse = z.infer<typeof GeneratedDocumentSchema>;
```

- **Modify** `packages/shared/src/index.ts` — export new items if needed (the types/schemas files are already barrel-exported)

**Acceptance criteria:**
- [ ] `GeneratedDocumentResponse` type exported from `@prestamos/shared`
- [ ] Fields match spec: `id`, `loanId`, `type`, `fileName`, `mimeType`, `createdAt`
- [ ] Zod schema validates correct data shape
- [ ] Frontend compiles without type errors when importing
- [ ] No breaking changes to existing exports

**Dependencies:** None (standalone type addition)

---

### Task 2.6: Register new providers and controller in module (PR 2 final wiring)

**File change list:**
- **Modify** `apps/api/src/loans/loans.module.ts`

Register:
- `GenerateContractService` as provider with `CONTRACT_GENERATOR` token
- `ContractController` in `controllers` array

```ts
controllers: [
  // ... existing
  ContractController,
],
providers: [
  // ... existing
  { provide: CONTRACT_GENERATOR, useClass: GenerateContractService },
  // GenerateContractService's deps (ContractStorageService already registered in PR 1)
]
```

**Acceptance criteria:**
- [ ] `GenerateContractService` is registered with `CONTRACT_GENERATOR` token
- [ ] `ContractController` added to controllers array
- [ ] Module compiles without errors
- [ ] `GET /api/loans/:loanId/contract` route is active
- [ ] `GET /api/admin/loans/:loanId/contract` route is active

**Dependencies:** Task 2.2 (GenerateContractService), Task 2.4 (ContractController)

---

## PR 3 — Frontend (Portal + Admin)

### Task 3.1: Add contract download to portal active loan detail

**File change list:**
- **Modify** `apps/web/features/loans/components/active-loan-detail.tsx`

Add a "Descargar Contrato" link/button after the loan summary card (after the progress bar section). Show only when loan status is `ACTIVE`. Use `window.open('/api/loans/${detail.id}/contract', '_blank')` or a simple `<a>` tag with the API URL.

```tsx
{/* Contract Download */}
{detail.status === 'ACTIVE' && (
  <Card>
    <CardContent className="pt-6">
      <a
        href={`/api/loans/${detail.id}/contract`}
        target="_blank"
        rel="noopener noreferrer"
        className="..."
      >
        Descargar Contrato
      </a>
    </CardContent>
  </Card>
)}
```

**Acceptance criteria:**
- [ ] "Descargar Contrato" link visible when loan has status `ACTIVE`
- [ ] Link is NOT visible when status is `CLOSED` or `DEFAULTED`
- [ ] Clicking opens PDF download in new tab
- [ ] Component renders without errors
- [ ] Spanish locale text correct

**Dependencies:** Task 2.4 (contract endpoint exists)

---

### Task 3.2: Add contract download to admin active loan detail

**File change list:**
- **Modify** `apps/web/features/admin/components/admin-loan-active-detail.tsx`

Add a "Ver Contrato" button in the loan data card (next to the loan info fields). Fetch document existence data and show disabled "Contrato no disponible" when no document exists.

Simple approach using `api.get` to check contract existence, or directly link to `/api/admin/loans/${loan.id}/contract`:

```tsx
{/* Contract */}
<div>
  <p className="text-xs text-muted-foreground">Contrato</p>
  <a
    href={`/api/admin/loans/${loan.id}/contract`}
    target="_blank"
    rel="noopener noreferrer"
    className="..."
  >
    Ver Contrato
  </a>
</div>
```

**Acceptance criteria:**
- [ ] "Ver Contrato" link visible in loan data card
- [ ] If no contract exists, text shows "Contrato no disponible" and is disabled
- [ ] Clicking opens PDF download in new tab
- [ ] Component renders without errors

**Dependencies:** Task 2.4 (admin contract endpoint exists), Task 2.5 (shared types for checking existence)

---

### Task 3.3: Add curl verification tests

**File change list:**
- **Create** `docs/okf/contract-api-tests.md` (or append to existing test doc)

Document the following curl tests:

```bash
# 1. Create loan and disburse (use existing flow)
# 2. Get contract as customer (expect 200 + PDF)
curl -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  http://localhost:3000/api/loans/$LOAN_ID/contract \
  -o contrato-$LOAN_ID.pdf

# 3. No contract for undisbursed loan
# 4. Unauthorized access (no token) returns 401
# 5. Wrong customer returns 403/404
# 6. Admin gets any contract
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:3000/api/admin/loans/$LOAN_ID/contract \
  -o contrato-admin-$LOAN_ID.pdf

# 7. Non-admin on admin endpoint returns 403
# 8. Non-existent loan returns 404
```

**Acceptance criteria:**
- [ ] Curl commands documented and verified
- [ ] Each endpoint scenario covered: 200, 404, 401, 403
- [ ] PDF downloads as valid file (opens without errors)
- [ ] Content-Type is `application/pdf`
- [ ] Content-Disposition header is correct

**Dependencies:** Task 2.4, Task 3.1, Task 3.2

---

## Review Workload Forecast

| Metric | PR 1 (Foundation) | PR 2 (Generation + API) | PR 3 (Frontend) | Total |
|--------|-------------------|------------------------|------------------|-------|
| Files created | 4 | 5 | 0 | 9 |
| Files modified | 3 | 3 | 2 | 8 |
| Estimated lines | ~260 | ~420 | ~60 | ~740 |
| Risk level | Low | Medium | Low | — |

**Risk analysis:**
- **PR 1 (Low):** Additive Prisma schema, standard repository pattern (matches `Installment` — entity-free), storage wrapper. No behavioral change risk.
- **PR 2 (Medium):** pdfmake + `tsx` compatibility is unverified (esbuild may not handle pdfmake's dynamic requires). Template rendering inside request handler adds latency risk. Error isolation pattern in `DisburseLoanHandler` must be precise — a thrown error after tx would cause a 500 for the customer. Controller file streaming needs `@Res()` passthrough (NestJS must not intercept the response).
- **PR 3 (Low):** Simple conditional link rendering. No data fetching complexity.

**Chained PRs recommended: Yes.** Each PR builds on the previous:
- PR 1 must merge first (schema + infrastructure)
- PR 2 depends on PR 1 tokens/storage
- PR 3 depends on PR 2 endpoints

Total estimated change: **~740 lines** across **17 files** (9 created, 8 modified). PR 2 is the riskiest and largest — consider splitting if pdfmake verification reveals significant compatibility work.
