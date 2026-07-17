# Document Upload Specification

## Purpose

Define document upload, listing, and deletion for customer identity verification and financial proof.

## Requirements

### Requirement: Document Upload

The system MUST accept multipart file uploads at `POST /api/documents`. Accepted types: `CI_FRONT`, `CI_BACK`, `SELFIE`, `PROOF_OF_INCOME`, `PROOF_OF_ADDRESS`. Max file size MUST be 10 MB. Allowed formats: JPG, PNG, PDF.

#### Scenario: Successful upload

- GIVEN an authenticated customer with a valid JWT
- WHEN `POST /api/documents` is called with a JPG file < 10 MB and type `CI_FRONT`
- THEN the response is `201 Created` with the document ID and metadata

#### Scenario: File too large rejected

- GIVEN a 15 MB file
- WHEN `POST /api/documents` is called
- THEN the response is `413 Payload Too Large`

#### Scenario: Invalid type rejected

- GIVEN a file with type `OTHER`
- WHEN `POST /api/documents` is called
- THEN the response is `400 Bad Request` listing valid types

### Requirement: Document Listing

The system MUST list documents at `GET /api/documents?customerId=:id`. Results MUST be filterable by `type` and sorted by `createdAt` descending. Soft-deleted documents MUST NOT appear.

#### Scenario: Filter by type

- GIVEN a customer with documents of types CI_FRONT and SELFIE
- WHEN `GET /api/documents?type=CI_FRONT` is called
- THEN only CI_FRONT documents are returned

#### Scenario: Empty list

- GIVEN a customer with no documents
- WHEN `GET /api/documents` is called
- THEN an empty array is returned

### Requirement: Document Deletion

The system MUST soft-delete via `DELETE /api/documents/:id`. Only the document owner MAY delete. Deleted documents MUST be excluded from listings.

#### Scenario: Delete own document

- GIVEN a document owned by the requesting customer
- WHEN `DELETE /api/documents/:id` is called
- THEN `deletedAt` is set

#### Scenario: Forbidden for other customer

- GIVEN a document owned by customer B
- WHEN customer A calls `DELETE /api/documents/:id`
- THEN the response is `403 Forbidden`

### Requirement: Local Storage

The system MUST store files in `uploads/documents/`. File names MUST be sanitized UUIDs, preserving the original extension. (ponytail: S3 when infra available)

#### Scenario: File stored with UUID name

- GIVEN a successful upload of `foto.jpg`
- WHEN inspecting the filesystem
- THEN the file exists at `uploads/documents/{uuid}.jpg`
- AND the original name is preserved in metadata only
