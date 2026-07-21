# Design: Legal Document Generation

## Technical Approach

Generate a contract PDF inside `DisburseLoanHandler.execute()` after the DB transaction commits, using pdfmake declarative templates (pure TS functions), stored to filesystem via `LocalDocumentStorage`, with metadata in a new `GeneratedDocument` Prisma model. Two new endpoints (`/api/loans/:loanId/contract` + `/api/admin/loans/:loanId/contract`) stream the file. Non-blocking on failure — catch + log.

## Architecture Decisions

### Decision: GenerateContractService as direct injection, not domain event
| Option | Tradeoff | Decision |
|--------|----------|----------|
| Domain event (LoanDisbursed) | Looser coupling, but 1:1 consumer => infrastructure overhead, no other consumers | **Rejected** — YAGNI |
| Direct call in DisburseLoanHandler | Tight coupling, simplest diff | **Chosen** — one try/catch in the one place generation happens |

### Decision: No domain entity for GeneratedDocument
| Option | Tradeoff | Decision |
|--------|----------|----------|
| Domain entity + VO | Behavior-free data => entity with zero methods | **Rejected** — meaningless DDD |
| Prisma-only + repository port | Layered persistence, no domain overhead | **Chosen** — matches existing `Installment` pattern (entity-free) |

### Decision: Single contract controller for both routes
| Option | Tradeoff | Decision |
|--------|----------|----------|
| Two controllers | Duplication | **Rejected** |
| One controller, two route methods | Shared stream logic, guards differ | **Chosen** — `contract.controller.ts` with portal + admin routes |

### Decision: File-based templates, not DB
| Option | Tradeoff | Decision |
|--------|----------|----------|
| DB template store | Admin UI editor needed, overkill for MVP | **Rejected** |
| TS module + registry map | Compile-time type safety, simple, extensible | **Chosen** — file per document type, registry map |

## Data Flow

```
DisburseLoanHandler.execute()
  │  tx: updateApplicationStatus + createLoan + createInstallments + createTransaction
  │  (committed)
  ▼
GenerateContractService.generate(loanId, appData, schedule)
  │
  ├─ customerRepo.findById(customerId)
  ├─ template = loanContractTemplate(loanData, installments, customer)
  ├─ pdfBuffer = pdfmake.createPdf(template).toBuffer()
  ├─ filePath = localDocumentStorage.upload(`contrato-${loanId}.pdf`, pdfBuffer)
  └─ generatedDocRepo.save({ loanId, type, filePath, mimeType, metadata })
  │  (any error → logger.warn, response unaffected)
  ▼
Response returned

─── Later: GET /api/loans/:loanId/contract ───
  generatedDocRepo.findByLoanId(loanId) → stream file from disk

─── Later: GET /api/admin/loans/:loanId/contract ───
  same, AdminGuard instead of CustomerGuard
```

## Prisma Schema Changes

Add to `apps/api/prisma/schema.prisma`:

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

**Migration**: `prisma migrate dev --name add-generated-document` — additive only.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `apps/api/prisma/schema.prisma` | Modify | + `DocumentType` enum, + `GeneratedDocument` model |
| `apps/api/src/loans/application/contract-templates/loan-contract.ts` | **Create** | pdfmake doc definition factory |
| `apps/api/src/loans/application/contracts/generate-contract.service.ts` | **Create** | Orchestrates template → PDF → storage → DB |
| `apps/api/src/loans/application/contracts/contract-storage.service.ts` | **Create** | Wraps LocalDocumentStorage for `contracts/` subdirectory |
| `apps/api/src/loans/domain/generated-document.repository.ts` | **Create** | Port interface (findByLoanId, save) |
| `apps/api/src/loans/infrastructure/persistence/prisma-generated-document.repository.ts` | **Create** | Prisma implementation |
| `apps/api/src/loans/presentation/contract.controller.ts` | **Create** | Portal + admin contract endpoints |
| `apps/api/src/loans/loans.tokens.ts` | Modify | + `GENERATED_DOCUMENT_REPOSITORY`, `CONTRACT_GENERATOR` |
| `apps/api/src/loans/loans.module.ts` | Modify | Register new providers |
| `apps/api/src/loans/application/disburse-loan/disburse-loan.handler.ts` | Modify | + contract generation call after tx |
| `packages/shared/src/schemas/loan.schema.ts` | Modify | + `GeneratedDocumentSchema` |
| `packages/shared/src/types/loan.types.ts` | Modify | + `GeneratedDocumentResponse` |
| `packages/shared/src/index.ts` | Modify | Export new schemas/types |
| `apps/web/features/loans/components/active-loan-detail.tsx` | Modify | + "Descargar Contrato" link |
| `apps/web/features/admin/components/admin-loan-active-detail.tsx` | Modify | + "Ver Contrato" button |
| `apps/web/app/portal/loans/active/[id]/page.tsx` | Modify | Pass contract status to detail |
| `apps/web/app/admin/loans/active/[id]/page.tsx` | Modify | Pass contract status to admin detail |

## Interfaces / Contracts

### Template function

```ts
// apps/api/src/loans/application/contract-templates/loan-contract.ts
import type { TDocumentDefinition } from 'pdfmake/interfaces';

export interface ContractData {
  loanId: string;
  amount: number;
  termMonths: number;
  annualRate: number;
  monthlyPayment: number;
  totalInterest: number;
  totalPayment: number;
  disbursedAt: Date;
  installments: Array<{ number: number; dueDate: Date; principal: number; interest: number; total: number }>;
  customer: { firstName: string; lastName: string | null; documentNumber: string | null };
  lender: { name: string };  // ponytail: company name from config, hardcoded for MVP
}

export function createLoanContract(data: ContractData): TDocumentDefinition { … }
```

### Repository port

```ts
export interface GeneratedDocumentRepository {
  findByLoanId(loanId: string): Promise<GeneratedDocument | null>;
  save(doc: GeneratedDocument): Promise<void>;
}
```

### Shared types

```ts
// packages/shared/src/types/loan.types.ts
export interface GeneratedDocumentResponse {
  id: string;
  loanId: string;
  type: string;
  fileName: string;
  mimeType: string;
  createdAt: string;
}
```

### API contracts

| Method | Path | Auth | Response |
|--------|------|------|----------|
| GET | `/api/loans/:loanId/contract` | JwtAuthGuard + CustomerGuard (own loan only) | `200` PDF stream / `404` |
| GET | `/api/admin/loans/:loanId/contract` | JwtAuthGuard + AdminGuard | `200` PDF stream / `404` |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `loan-contract.ts` | pdfmake doc definition shape — content arrays, style keys, data rendering |
| Unit | `generate-contract.service.ts` | Mock template + storage + repo, verify orchestration order |
| Unit | `contract.controller.ts` | Mock repo, test 200/404/401/403 for each route |
| Unit | `prisma-generated-document.repository.ts` | In-memory Prisma mock or test DB |
| Frontend | Contract link visibility | Test that link renders for ACTIVE, not for CLOSED/DEFAULTED |

## Migration / Rollout

**No data migration.** Additive schema only. Generate on next disbursement. Existing loans have no contract — controller returns 404.

Rollback: (1) drop `generated_documents` table, (2) remove generator call in handler, (3) delete new files.

## Open Questions

- [ ] pdfmake + `tsx` (esbuild) compatibility — verify `pdfmake.createPdf().toBuffer()` works with NestJS dev mode
- [ ] `contracts/` subdirectory path — add `CONTRACTS_DIR` env var or hardcode `uploads/contracts/`?
