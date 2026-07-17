# Audit Logging Specification

## Purpose

Specify the centralized audit log table for recording entity changes, enabling compliance and traceability across all financial operations.

## Requirements

### Requirement: Audit Log Structure

The system MUST provide an `audit_logs` table in the shared Prisma schema. Every record MUST capture: `id` (auto-increment), `entityType` (string, the domain entity name, e.g., `"User"`), `entityId` (string), `action` (string: `CREATE`, `UPDATE`, `DELETE`), `actorId` (string, the user who performed the action), `changes` (JSON — before/after diff of modified fields), `sourceIp` (nullable string), and `createdAt` (timestamp).

#### Scenario: Audit entry is written for an UPDATE

- GIVEN a use case modifies a User record
- WHEN the application layer calls the audit service after the update
- THEN an `audit_logs` row is created with `entityType = "User"`, `entityId`, `action = "UPDATE"`, `actorId`, and `changes` JSON containing before/after values

#### Scenario: Changes JSON includes only modified fields

- GIVEN an update that changes only `name` and `phone`
- WHEN the audit entry is recorded
- THEN `changes` JSON contains exactly `{ name: { from, to }, phone: { from, to } }`
- AND unchanged fields are omitted

### Requirement: Explicit Audit Recording from Application Layer

The system MUST record audit entries explicitly from application-layer code (use cases). The audit service MUST expose a method accepting `(entityType, entityId, action, actorId, changes, sourceIp?)`. The system MUST NOT use Prisma middleware or database triggers for audit recording.

#### Scenario: Use case calls audit service directly

- GIVEN a use case that creates a loan
- WHEN the loan is persisted
- THEN the use case explicitly calls the audit service's record method with CREATE action
- AND no middleware intercepts the persistence automatically

#### Scenario: Audit service validates the action

- GIVEN a call to `auditService.record` with an unknown action (e.g., `"INVALID"`)
- WHEN the service processes the call
- THEN it SHOULD throw a validation error
- AND no row is inserted

### Requirement: Audit Query Access

The system SHOULD expose a read-only query interface for audit logs, filterable by `entityType`, `entityId`, `actorId`, `action`, and date range. Results MUST be paginated and ordered by `createdAt` descending. The system MUST NOT expose audit write operations to any external API consumer.

#### Scenario: Filter audit logs by entity

- GIVEN audit entries for multiple entities
- WHEN queried with `entityType = "User"` and `entityId = "42"`
- THEN only matching rows are returned
- AND results are ordered by `createdAt` descending

#### Scenario: Unauthorized write attempt blocked

- GIVEN an external request attempting to create an audit entry directly
- WHEN the request arrives at a controller
- THEN the system returns `403 Forbidden`
- AND no audit entry is created
