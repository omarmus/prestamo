# Delta for Customer Documents

## NEW Requirements

### Requirement: Upload Document (`POST /api/customers/me/documents`)

El sistema DEBE exponer `POST /api/customers/me/documents` protegido por JWT y CustomerGuard para subir un documento. Acepta `multipart/form-data` con campos: `file` (archivo, máximo 5MB), `type` (string enum: CI_FRONT | CI_BACK | SELFIE | PAYSLIP | BANK_STATEMENT | SERVICE_BILL), `notes` (opcional). El archivo se almacena como base64 en el campo `content` de `CustomerDocument`. `mimeType` se extrae del archivo subido. El documento se crea con `status: "PENDING"`.

(Requirement nuevo)

#### Scenario: Upload valid document

- GIVEN an authenticated Customer with a valid JWT
- WHEN `POST /api/customers/me/documents` is called with a PDF file (2MB) and `type: "BANK_STATEMENT"`
- THEN response status is `201 Created`
- AND the response contains `{ "id", "type", "fileName", "mimeType", "status": "PENDING", "createdAt" }`
- AND the response does NOT include the `content` field
- AND the document is persisted in the database with base64 content

#### Scenario: Upload file exceeds 5MB limit

- GIVEN an authenticated Customer
- WHEN `POST /api/customers/me/documents` is called with a 10MB file
- THEN response status is `413 Payload Too Large`
- AND error message indicates maximum file size is 5MB

#### Scenario: Upload with invalid type

- GIVEN an authenticated Customer
- WHEN `POST /api/customers/me/documents` is called with `type: "INVALID_TYPE"`
- THEN response status is `400 Bad Request`
- AND validation error lists accepted document types

#### Scenario: Upload without file

- GIVEN an authenticated Customer
- WHEN `POST /api/customers/me/documents` is called without a `file` field
- THEN response status is `400 Bad Request`
- AND error message indicates file is required

---

### Requirement: List My Documents (`GET /api/customers/me/documents`)

El sistema DEBE exponer `GET /api/customers/me/documents` protegido por JWT y CustomerGuard que devuelva la lista de documentos del cliente ordenados por `createdAt` descendente. Cada item incluye `{ "id", "type", "fileName", "mimeType", "status", "notes", "createdAt", "updatedAt" }`. Sin el campo `content`. Soporta filtro opcional `?type=CI_FRONT` para filtrar por tipo de documento.

(Requirement nuevo)

#### Scenario: List all documents

- GIVEN an authenticated Customer with 3 uploaded documents
- WHEN `GET /api/customers/me/documents` is called
- THEN response status is `200 OK`
- AND the response body is an array of 3 documents
- AND each document has `{ "id", "type", "fileName", "mimeType", "status", "createdAt" }`
- AND none of the documents includes a `content` field

#### Scenario: Filter documents by type

- GIVEN an authenticated Customer with documents of types CI_FRONT, PAYSLIP, BANK_STATEMENT
- WHEN `GET /api/customers/me/documents?type=CI_FRONT` is called
- THEN response status is `200 OK`
- AND the response contains exactly 1 document with `type: "CI_FRONT"`

#### Scenario: Empty list

- GIVEN an authenticated Customer with zero documents
- WHEN `GET /api/customers/me/documents` is called
- THEN response status is `200 OK`
- AND the response body is an empty array `[]`

---

### Requirement: Download Document (`GET /api/customers/me/documents/:id`)

El sistema DEBE exponer `GET /api/customers/me/documents/:id` protegido por JWT y CustomerGuard que devuelva el documento completo incluyendo `content` (base64) y `mimeType`. Solo el propietario del documento puede descargarlo. Si el documento no existe o pertenece a otro Customer, DEBE responder `404 Not Found`.

(Requirement nuevo)

#### Scenario: Download own document

- GIVEN an authenticated Customer with a document `doc-123` of their own
- WHEN `GET /api/customers/me/documents/doc-123` is called
- THEN response status is `200 OK`
- AND the response includes `content` (base64 string) and `mimeType`

#### Scenario: Download non-existent document

- GIVEN an authenticated Customer
- WHEN `GET /api/customers/me/documents/non-existent-id` is called
- THEN response status is `404 Not Found`

#### Scenario: Cannot download another customer's document

- GIVEN an authenticated Customer A and a document belonging to Customer B
- WHEN Customer A calls `GET /api/customers/me/documents/:id-of-B`
- THEN response status is `404 Not Found`

---

### Requirement: Delete Document (`DELETE /api/customers/me/documents/:id`)

El sistema DEBE exponer `DELETE /api/customers/me/documents/:id` protegido por JWT y CustomerGuard que elimine un documento propio. Solo el propietario puede eliminar. Responde `204 No Content` en éxito. Si el documento no existe o no pertenece al Customer, responde `404 Not Found`.

(Requirement nuevo)

#### Scenario: Delete own document

- GIVEN an authenticated Customer with a document `doc-123`
- WHEN `DELETE /api/customers/me/documents/doc-123` is called
- THEN response status is `204 No Content`
- AND the document is removed from the database

#### Scenario: Delete non-existent document

- GIVEN an authenticated Customer
- WHEN `DELETE /api/customers/me/documents/non-existent` is called
- THEN response status is `404 Not Found`

---

### Requirement: Documents Page (`/portal/documents`)

El sistema DEBE mostrar la página `/portal/documents` con un listado de documentos subidos (tabla con tipo, nombre, fecha, estado) y un botón "Subir documento" que abre un diálogo (shadcn/ui Dialog) con selector de archivo, selector de tipo de documento, y campo de notas opcional. Al subir exitosamente, el documento aparece en el listado sin recargar la página. El estado visual de cada documento: PENDING (badge amarillo), VERIFIED (badge verde), REJECTED (badge rojo). Botón de eliminar en cada fila con confirmación.

(Requirement nuevo)

#### Scenario: Documents page shows upload dialog

- GIVEN an authenticated Customer viewing `/portal/documents`
- WHEN clicking "Subir documento"
- THEN a dialog opens with file input, type selector (dropdown: CI_FRONT, CI_BACK, SELFIE, PAYSLIP, BANK_STATEMENT, SERVICE_BILL), notes textarea, and "Subir" button

#### Scenario: Upload from dialog succeeds

- GIVEN an authenticated Customer viewing the upload dialog
- WHEN selecting a PDF file, choosing type "BANK_STATEMENT", and clicking "Subir"
- THEN the dialog closes
- AND a success toast shows "Documento subido correctamente"
- AND the new document appears in the table below

#### Scenario: Document row shows delete with confirmation

- GIVEN an authenticated Customer viewing `/portal/documents` with at least one document
- WHEN clicking the delete icon on a document row
- THEN a confirmation dialog shows: "¿Eliminar documento X?"
- WHEN confirming
- THEN the document is removed from the table
- AND a success toast shows "Documento eliminado"

#### Scenario: Document status badges render correctly

- GIVEN an authenticated Customer viewing `/portal/documents` with documents in different statuses
- THEN documents with `status: "PENDING"` show a yellow badge
- AND documents with `status: "VERIFIED"` show a green badge
- AND documents with `status: "REJECTED"` show a red badge
