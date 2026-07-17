# Database Foundation Specification

## Purpose

Define the centralized database schema location, base fields shared across all models, and the SharedModule with globally-scoped PrismaService for the prestamos-app platform.

## Requirements

### Requirement: Centralized Schema Location

The system MUST maintain a single Prisma schema at `apps/api/prisma/schema.prisma`. All domain modules (identity, portal, loans, etc.) MUST define their models exclusively in this file. The schema MUST use the `PrismaPg` adapter with a `pg.Pool` connection.

#### Scenario: Shared schema generates correctly

- GIVEN the single `apps/api/prisma/schema.prisma` file
- WHEN `prisma generate` executes from `apps/api/`
- THEN a unified PrismaClient is generated containing all domain models
- AND `prisma format` passes without errors

#### Scenario: Migration includes models from all domains

- GIVEN models from identity, portal, and loans in the same schema
- WHEN `prisma migrate dev` creates a new migration
- THEN the resulting migration file reflects all models across all domains

### Requirement: Base Fields on Every Model

Every model in the schema MUST include `createdAt` (`@default(now())`) and `updatedAt` (`@updatedAt`). Every domain model (excluding pure join/pivot tables) MUST also include `organizationId` (nullable), `deletedAt` (nullable DateTime), `deletedById` (nullable), `version` (Int, default 1), `createdById`, and `updatedById`.

#### Scenario: Domain model declares all base fields

- GIVEN a domain model (e.g., `User`, `Role`, `Loan`)
- WHEN its Prisma definition is inspected
- THEN it includes all base fields listed above
- AND `version` defaults to 1

#### Scenario: Join table includes only timestamps

- GIVEN a many-to-many join table with no independent business meaning
- WHEN its Prisma definition is inspected
- THEN it includes `createdAt` and `updatedAt`
- AND it MAY exclude `organizationId`, `deletedAt`, `deletedById`, `version`, `createdById`, `updatedById`

#### Scenario: Optimistic lock prevents stale writes

- GIVEN a record with `version = 2`
- WHEN a write attempt sends `version = 1` (stale)
- THEN Prisma reports zero rows affected
- AND the application MUST return a conflict error
- AND the write is not applied

### Requirement: Resolving `createdById` and `updatedById`

The system MUST populate `createdById` and `updatedById` per-request from the authenticated user's ID extracted from the JWT. For system operations (seeds, migrations) the system SHOULD use a sentinel value (e.g., `"system"`).

#### Scenario: Authenticated request sets createdById

- GIVEN an authenticated request with user ID `"user-42"`
- WHEN a new record is created
- THEN `createdById` is set to `"user-42"`
- AND `updatedById` is set to the same value

#### Scenario: Seed operation uses system sentinel

- GIVEN the database seed script runs without an authenticated user context
- WHEN a record is created during seeding
- THEN `createdById` is `"system"`

### Requirement: SharedModule with Global PrismaService

The system MUST provide `SharedModule` decorated with `@Global()` in `apps/api/src/shared/`. The module MUST export `PrismaService` as a singleton provider. Any module in any domain MUST be able to inject `PrismaService` without importing `SharedModule`.

#### Scenario: Cross-module injection resolves globally

- GIVEN a service in the `identity` domain
- WHEN it injects `PrismaService` in its constructor
- THEN the provider resolves from the global scope
- AND all consumers across modules share one connection pool

#### Scenario: Graceful shutdown disconnects Prisma

- GIVEN a running application
- WHEN `onApplicationShutdown` is triggered
- THEN `PrismaService.$disconnect()` is called
- AND all database connections close cleanly
