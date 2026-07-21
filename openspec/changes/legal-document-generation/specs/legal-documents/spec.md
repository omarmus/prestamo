# Spec: Legal Documents

## Change: legal-document-generation

---

### Capability: GeneratedDocument Persistence

**Description**: Store contract PDF metadata in a new Prisma model so each loan's generated document can be tracked, retrieved, and associated with the loan throughout its lifecycle.

#### Scenarios

**Scenario 1: Prisma model stores document metadata**
Given the `GeneratedDocument` model exists in the Prisma schema
When a contract PDF is generated for a loan
Then a record is created with `loanId`, `type`, `filePath`, `mimeType`, `metadata` (JSON snapshot of loan data at generation time), `createdAt`
And the record is queryable by `loanId`

**Scenario 2: Document type enum constrains valid values**
Given the `GeneratedDocument` model has a `type` field
When creating a record with type `LOAN_CONTRACT`
Then it is accepted
When creating a record with type `PROMISSORY_NOTE` (future)
Then it is also accepted
When creating a record with any other arbitrary string
Then it is rejected — only known document types are stored

---

### Capability: Contract Template Rendering

**Description**: Define loan contract templates as TypeScript functions that return pdfmake document definitions. Templates receive structured data (loan, installments, customer) and produce a PDF buffer. The template function is pure — no I/O, no side effects.

#### Scenarios

**Scenario 1: Template generates valid pdfmake definition**
Given a template function `createLoanContract(loan, installments, customer)`
When called with valid loan data, installment schedule, and customer info
Then it returns a pdfmake `TDocumentDefinition` object with `content` and `styles`
And the definition includes: loan amount, annual interest rate, term in months, monthly payment amount, total interest, total payment, amortization schedule table, borrower full name and document number, lender company name, disbursement date, and signature lines

**Scenario 2: Template handles null/optional customer fields**
Given a customer with `lastName = null`
When the template renders
Then the borrower name still displays as `firstName` followed by empty string (no crash, no "null" text)
And all optional fields (`documentNumber`, `documentType`) render as `'—'` when null

**Scenario 3: Template is registered by type**
Given the template registry maps `'LOAN_CONTRACT'` to `createLoanContract`
When `ContractGenerator.generate('LOAN_CONTRACT', data)` is called
Then the correct template is resolved and rendered
When an unknown type is requested
Then an error is thrown with a clear message

---

### Capability: Contract Generation on Disbursement

**Description**: After a loan is disbursed successfully (DB writes committed), a PDF contract is generated asynchronously within the same request but must not block or roll back the disbursement on failure.

#### Scenarios

**Scenario 1: Contract generated after successful disbursement**
Given a loan has been disbursed via `DisburseLoanHandler.execute()`
When the DB transaction commits successfully
Then `ContractGenerator.generateContract(loan, installments, customer)` is called
And the PDF is written to filesystem via `LocalDocumentStorage`
And a `GeneratedDocument` record is created linking the loanId to the file path

**Scenario 2: Generation failure does not roll back disbursement**
Given the DB transaction committed successfully
When the PDF generation OR file storage OR record creation throws an error
Then the disbursement response is still returned successfully
And the error is logged via the NestJS logger
And the disbursement is NOT rolled back
And no `GeneratedDocument` record exists for that loan

**Scenario 3: Template rendering error is caught and logged**
Given the template function throws during execution
When the error occurs inside `ContractGenerator`
Then the error is caught
And a warning-level log states `"Contract generation failed for loan {loanId}: {error}"`
And execution continues — the HTTP response is unaffected

**Scenario 4: Multiple disbursements each generate their own contract**
Given two separate loans are disbursed
When both disbursements complete
Then each loan has its own `GeneratedDocument` record with a unique `filePath`
And the metadata snapshot reflects the correct loan data for each

---

### Capability: Contract Storage

**Description**: Generated PDFs are stored on the filesystem via `LocalDocumentStorage` under `uploads/contracts/`. The `GeneratedDocument` record holds the absolute path for retrieval.

#### Scenarios

**Scenario 1: PDF stored in contracts subdirectory**
Given a generated PDF buffer
When `LocalDocumentStorage.upload` is called with a `contracts/` prefix
Then the file is written to `uploads/contracts/{timestamp}-{uuid}.pdf`
And the returned path is stored in `GeneratedDocument.filePath`

**Scenario 2: Metadata snapshot captures loan data at generation time**
Given a contract is being generated
When the `metadata` JSON field is populated
Then it contains: `amount`, `termMonths`, `annualRate`, `monthlyPayment`, `totalInterest`, `totalPayment`, `disbursedAt`, `status`, `customerFirstName`, `customerLastName`, `customerDocumentNumber`
And this data is a snapshot — it does NOT change if the loan is later modified

---

### Capability: Contract Retrieval — Public API

**Description**: Serve the contract PDF via a REST endpoint so the portal and admin UI can stream the file to authenticated users.

#### Scenarios

**Scenario 1: Customer downloads their own contract**
Given the route `GET /api/loans/:loanId/contract`
When a customer with a valid JWT and their `customerId` matches the loan's `customerId`
And a `GeneratedDocument` exists for that loan
Then the response has:
  - Status `200`
  - `Content-Type: application/pdf`
  - `Content-Disposition: attachment; filename="contrato-{loanId}.pdf"`
  - Body: the raw PDF bytes streamed from the filesystem

**Scenario 2: Loan with no contract returns 404**
Given the route `GET /api/loans/:loanId/contract`
When no `GeneratedDocument` exists for that loan
Then the response has status `404`
And body `{ "message": "Contrato no encontrado", "error": "Not Found", "statusCode": 404 }`

**Scenario 3: Unauthorized user cannot access contract**
Given the route `GET /api/loans/:loanId/contract`
When the request has no JWT token
Then the response has status `401`

**Scenario 4: Customer cannot access another customer's contract**
Given the route `GET /api/loans/:loanId/contract`
When customer A is authenticated but the loan belongs to customer B
Then the response has status `403` or `404`
And the PDF is never streamed

**Scenario 5: File on filesystem is missing returns 404**
Given a `GeneratedDocument` record exists with `filePath: "/path/to/missing.pdf"`
When the file has been deleted from disk
Then the response has status `404`
And the error is logged

---

### Capability: Contract Retrieval — Admin API

**Description**: Admin users can download any loan's contract PDF regardless of which customer owns it.

#### Scenarios

**Scenario 1: Admin downloads any loan contract**
Given the route `GET /api/admin/loans/:loanId/contract`
When an authenticated admin user makes the request
And a `GeneratedDocument` exists for that loan
Then the response has status `200` with `Content-Type: application/pdf` and `Content-Disposition: attachment`

**Scenario 2: Admin endpoint returns 404 when no contract exists**
Given the route `GET /api/admin/loans/:loanId/contract`
When no `GeneratedDocument` exists for that loan
Then the response has status `404`

**Scenario 3: Non-admin cannot use admin contract endpoint**
Given the route `GET /api/admin/loans/:loanId/contract`
When a non-admin JWT token is used
Then the response has status `403`

---

### Capability: Portal Contract Viewing

**Description**: The customer portal page for active loan detail shows a download link to the contract PDF when the loan is ACTIVE.

#### Scenarios

**Scenario 1: Download contract link visible for active loans**
Given a customer is viewing `/portal/loans/active/{id}`
When the loan has status `ACTIVE`
Then a "Descargar Contrato" button/link is visible below the loan summary
And clicking it triggers a PDF download

**Scenario 2: Contract link not visible when loan is not ACTIVE**
Given a customer is viewing `/portal/loans/active/{id}`
When the loan has status `CLOSED` or `DEFAULTED`
Then no contract download link is shown
Or the link is shown but disabled with a tooltip explaining the contract is only available for active loans

**Scenario 3: PDF renders in-browser with download option**
Given the customer clicks "Descargar Contrato"
When the PDF is served from `GET /api/loans/:loanId/contract`
Then the browser displays the PDF inline (using `Content-Disposition: inline` behavior or a viewer)
And the user can save the file via the browser's native PDF save

---

### Capability: Admin Contract Viewing

**Description**: Admin page for active loan detail shows a download button for the contract PDF.

#### Scenarios

**Scenario 1: Admin sees contract download button**
Given an admin is viewing `/admin/loans/active/{id}`
When a `GeneratedDocument` exists for that loan
Then a "Ver Contrato" button is shown in the loan data card
And clicking it triggers a PDF download via `GET /api/admin/loans/:loanId/contract`

**Scenario 2: Admin sees disabled button when no contract exists**
Given an admin is viewing `/admin/loans/active/{id}`
When no `GeneratedDocument` exists for that loan
Then the button shows "Contrato no disponible" and is disabled

---

### Capability: Shared Types and Schemas

**Description**: Zod schemas and TypeScript types for the document metadata response, shared between backend and frontend.

#### Scenarios

**Scenario 1: GeneratedDocumentResponse type exposed via shared package**
Given `packages/shared/src/types/loan.types.ts`
When a new `GeneratedDocumentResponse` type is defined
Then it includes: `id: string`, `loanId: string`, `type: string`, `fileName: string`, `mimeType: string`, `createdAt: string`
And it is exported from `packages/shared/src/index.ts`

**Scenario 2: Zod schema validates document metadata response**
Given `packages/shared/src/schemas/loan.schema.ts`
When a `GeneratedDocumentSchema` is added
Then it validates: `id` (uuid string), `loanId` (uuid string), `type` (string), `filePath` (string), `mimeType` (string), `metadata` (record, optional), `createdAt` (string, datetime)
And the inferred type matches `GeneratedDocumentResponse`

**Scenario 3: Frontend imports and uses the shared types**
Given `apps/web/` imports from `@prestamos/shared`
When the portal and admin pages use `GeneratedDocumentResponse`
Then TypeScript compilation succeeds without type errors
And the response from the contract API is correctly typed
