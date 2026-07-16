# Project Scaffold Specification

## Purpose

Define the monorepo foundation, shared tooling, and local infrastructure that enable parallel frontend/backend development with zero setup friction.

## Requirements

### Requirement: Monorepo Structure

The root SHALL use Turborepo + pnpm workspaces with three entries: `apps/api`, `apps/web`, and `packages/shared`. `pnpm install` from root MUST install dependencies for all workspaces.

#### Scenario: Workspace installation

- GIVEN a fresh clone of the repository
- WHEN `pnpm install` runs from project root
- THEN all workspace dependencies are installed without errors

### Requirement: Shared Configurations

A `tsconfig.base.json` MUST exist at root. Each workspace app SHOULD extend it. ESLint and Prettier configs at root MUST apply to all `.ts` and `.tsx` files across the monorepo.

#### Scenario: Base config inherited by API

- GIVEN `apps/api/tsconfig.json` extends `tsconfig.base.json`
- WHEN `tsc --noEmit` runs in `apps/api/`
- THEN the base config's strict settings are inherited

### Requirement: API DDD Structure

`apps/api/src/` MUST follow Clean Architecture with four directories: `domain/` (entities, value objects, repository ports), `application/` (use cases, commands/handlers), `infrastructure/` (persistence adapters, DI), and `presentation/` (controllers, guards, DTOs). Inner layers MUST NOT import outer layers.

#### Scenario: Layer boundary violation rejected

- GIVEN a file in `domain/` that imports from `infrastructure/`
- WHEN `eslint` runs with import-boundary rules
- THEN the lint step fails with a dependency violation

### Requirement: Web Scaffold

`apps/web/` SHALL be a Next.js application with a single placeholder page. `pnpm dev` in the web directory MUST start the dev server on port 3000 and compile without errors.

#### Scenario: Dev server starts

- GIVEN all workspace dependencies are installed
- WHEN `pnpm dev` runs in `apps/web/`
- THEN the Next.js dev server starts on port 3000

### Requirement: Shared Package

`packages/shared/` SHALL export Zod schemas and TypeScript types. It MUST compile without errors and MUST be importable by both `apps/api` and `apps/web`. It SHOULD NOT contain runtime framework dependencies.

#### Scenario: Shared types used by API

- GIVEN a Zod schema defined in `packages/shared`
- WHEN `apps/api` imports that schema
- THEN the API compiles without errors

### Requirement: Local Infrastructure

`docker-compose.yml` at project root MUST define PostgreSQL 16 on port 5432 and Redis 7 on port 6379. `docker compose up` MUST start both services without errors.

#### Scenario: PostgreSQL accepts connections

- GIVEN `docker compose up` is running
- WHEN a client connects to `localhost:5432` with configured credentials
- THEN the connection is accepted

### Requirement: CI Pipeline

`.github/workflows/ci.yml` MUST run on pull requests against `main`. It SHALL execute `lint`, `type-check`, and `build` steps. All MUST pass for CI to succeed.

#### Scenario: PR triggers full pipeline

- GIVEN a pull request is opened against `main`
- WHEN GitHub Actions runs the workflow
- THEN lint, type-check, and build jobs pass

### Requirement: Independent Dev Mode

Each app MUST be runnable independently via `pnpm dev` from its own directory. `pnpm dev` at root MAY run both apps in parallel via Turborepo. One app MUST NOT require the other to be running.

#### Scenario: API runs standalone

- GIVEN Docker services are up (PostgreSQL, Redis)
- WHEN `pnpm dev` runs in `apps/api/`
- THEN the NestJS server starts on port 3001 without requiring the web app
