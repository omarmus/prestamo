# Proposal: Legal Document Generation

## Intent

No contract PDF exists when a loan is disbursed. This creates one automatically and makes it downloadable from portal and admin, satisfying regulatory record-keeping.

## Scope

### In Scope
- Prisma model `GeneratedDocument` (loanId, type, filePath, mimeType, metadata)
- Contract template as pdfmake JSON function in `loans/application/contract-templates/`
- Generation inside `DisburseLoanHandler.execute()` after DB writes, before response
- File storage via existing `LocalDocumentStorage` in `uploads/contracts/`
- `GET /api/loans/:loanId/contract` + admin equivalent
- Portal "Descargar Contrato" link; admin "Ver Contrato" link
- Shared types + schemas for document metadata

### Out of Scope
- Admin template editor (file-based MVP)
- E-signature, watermarking, batch, WhatsApp, S3

## Capabilities

### New Capabilities
- `legal-document`: Generate, store, and serve loan contract PDFs on disbursement.

### Modified Capabilities
- None — additive only.

## Approach

Template = TypeScript module exporting pdfmake doc definition `(loan, installments, customer) => dd`. `ContractGenerator` renders the template, uploads via `LocalDocumentStorage`, persists `GeneratedDocument` record. Controller streams PDF.

Template at `loans/application/contract-templates/loan-contract.ts`. New token `CONTRACT_GENERATOR`.

## Affected Areas

| Area | Impact |
|------|--------|
| `apps/api/prisma/schema.prisma` | + `GeneratedDocument` model |
| `apps/api/src/loans/application/contract-templates/` | New |
| `apps/api/src/loans/application/contract-generator.ts` | New |
| `apps/api/src/loans/application/disburse-loan/` | Modified — add generation |
| `apps/api/src/loans/loans.module.ts` | Modified |
| `apps/api/src/loans/loans.tokens.ts` | Modified |
| `apps/api/src/loans/presentation/` | New — PDF controller |
| `apps/web/features/loans/hooks/` | Modified |
| `apps/web/app/portal/loans/[id]/` | Modified |
| `apps/web/app/admin/loans/active/[id]/` | Modified |
| `packages/shared/` | Modified |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| pdfmake + tsx incompatibility | Medium | Test minimal doc before building template |
| PDF inside tx adds latency | Low | < 100ms. Defer to job if needed |
| Storage path not configurable | Low | Env var `CONTRACTS_DIR` |

## Rollback Plan

1. **Prisma**: `DROP TABLE generated_documents` — additive, no data loss
2. **Backend**: remove generator call, delete new files
3. **Frontend**: remove download/view links
4. **Disable**: remove one-line handler call

## Dependencies

| Dep | Status |
|-----|--------|
| pdfmake | **Add** — verify tsx compat |
| LocalDocumentStorage | ✅ Exists |
| DisburseLoanHandler | ✅ Exists |

## Success Criteria

- [ ] Contract PDF generated and stored on every disbursement
- [ ] Customer downloads from `/portal/loans/[id]`
- [ ] Admin views from `/admin/loans/active/[id]`
- [ ] Contract includes: amount, term, rate, schedule, borrower/lender data
- [ ] Generation failure does NOT block disbursement (catch + log)
- [ ] Existing disbursement tests pass unmodified
