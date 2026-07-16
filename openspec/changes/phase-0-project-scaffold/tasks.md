# Tasks: Phase 0 — Project Scaffold

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 1200–1600 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 → PR 4 |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Lines | Base |
|------|------|-----------|-------|------|
| 1 | Root configs + shared package + Docker + CI | PR 1 | ~250 | `feature/phase-0` (tracker) |
| 2 | Domain (entity, VOs, port) + Application (register/login/refresh handlers) | PR 2 | ~320 | PR 1 branch |
| 3 | Infrastructure (Prisma adapter, schema, migration, JWT, Redis refresh, NestJS wiring) | PR 3 | ~350 | PR 2 branch |
| 4 | Presentation (AuthController, DTOs, Guards, decorators) + web scaffold + tests | PR 4 | ~350 | PR 3 branch |

## Phase 1: Foundation — Root Configs, Docker, Shared Package, CI

- [x] 1.1 Create `package.json` (pnpm workspace root) + `pnpm-workspace.yaml` with `apps/*` and `packages/*`
- [x] 1.2 Create `turbo.json` with dev/build/lint/type-check pipeline
- [x] 1.3 Create `tsconfig.base.json` (strict, ES2022, path aliases)
- [x] 1.4 Create `eslint.config.js` with import-boundary rules (domain→infra = error) — ESLint 9 flat config
- [x] 1.5 Create `.prettierrc` (singleQuote, trailingComma all, printWidth 100)
- [x] 1.6 Create `.gitignore` (node_modules, dist, .turbo, .env, prisma/generated)
- [x] 1.7 Create `docker-compose.yml` (postgres:16-alpine + redis:7-alpine)
- [x] 1.8 Create `.env.example` (DATABASE_URL, REDIS_URL, JWT_SECRET)
- [x] 1.9 Create `packages/shared/package.json` + `tsconfig.json` — name `@prestamos/shared`
- [x] 1.10 Create `packages/shared/src/schemas/auth.schema.ts` — RegisterSchema, LoginSchema, RefreshSchema (Zod)
- [x] 1.11 Create `packages/shared/src/types/auth.types.ts` — TokenResponse, UserProfile, JwtPayload
- [x] 1.12 Create `packages/shared/src/index.ts` — re-export all schemas + types
- [x] 1.13 Create `.github/workflows/ci.yml` — setup-node + pnpm → lint → type-check → build

## Phase 2: Domain Layer — User Entity, Value Objects, Repository Port

- [x] 2.1 Create `apps/api/src/identity/domain/email.value-object.ts` — RFC 5322 validation, `create()` factory
- [x] 2.2 Create `apps/api/src/identity/domain/phone.value-object.ts` — Bolivia `+591[67]\d{7}`, `create()` factory
- [x] 2.3 Create `apps/api/src/identity/domain/user.entity.ts` — User aggregate: id, email, name, phone, role, passwordHash, createdAt
- [x] 2.4 Create `apps/api/src/identity/domain/user.repository.ts` — port interface: `save()`, `findByEmail()`, `findById()`

## Phase 3: Application Layer — Register, Login, Refresh Use Cases

- [x] 3.1 Create `apps/api/src/identity/application/register/register.command.ts` — RegisterCommand DTO
- [x] 3.2 Create `apps/api/src/identity/application/register/register.handler.ts` — RegisterHandler: validate VOs → hash argon2id → save user → generate tokens
- [x] 3.3 Create `apps/api/src/identity/application/login/login.command.ts` — LoginCommand DTO
- [x] 3.4 Create `apps/api/src/identity/application/login/login.handler.ts` — LoginHandler: findByEmail → verify password → log failed attempts → tokens
- [x] 3.5 Create `apps/api/src/identity/application/refresh/refresh.command.ts` — RefreshCommand DTO
- [x] 3.6 Create `apps/api/src/identity/application/refresh/refresh.handler.ts` — RefreshHandler: consume token → rotation → family revocation on reuse

## Phase 4: Infrastructure — Prisma, JWT, Redis, NestJS Wiring

- [x] 4.1 Create `apps/api/src/identity/infrastructure/persistence/prisma/schema.prisma` — User, Role, FailedLoginAttempt models
- [x] 4.2 Create `apps/api/src/identity/infrastructure/persistence/prisma/prisma.service.ts` — PrismaService (extends PrismaClient, onModuleInit)
- [x] 4.3 Create `apps/api/src/identity/infrastructure/persistence/prisma-user.repository.ts` — implements UserRepository port
- [x] 4.4 Create `apps/api/src/identity/infrastructure/auth/jwt.service.ts` — sign() with HS256 + verify() using @nestjs/jwt
- [x] 4.5 Create `apps/api/src/identity/infrastructure/auth/refresh-token.service.ts` — Redis-based generate/consume/revoke with family tracking
- [x] 4.6 Create `apps/api/src/identity/infrastructure/persistence/prisma/seed.ts` — seed ADMIN + USER roles + initial admin
- [x] 4.7 Create `apps/api/package.json` + `tsconfig.json` + `nest-cli.json`
- [x] 4.8 Create `apps/api/src/main.ts` — boostrap NestJS, ValidationPipe, CORS, port 3001
- [x] 4.9 Create `apps/api/src/identity/identity.module.ts` — wires IdentityModule with PrismaService, JwtService, Redis, Passport
- [x] 4.10 Create `apps/api/src/app.module.ts` — imports IdentityModule + ConfigModule

## Phase 5: Presentation — Controller, DTOs, Guards, Web Scaffold

- [x] 5.1 Create `apps/api/src/shared/guards/jwt-auth.guard.ts` — extracts + validates Bearer JWT
- [x] 5.2 Create `apps/api/src/shared/decorators/current-user.decorator.ts` — extracts user from request
- [x] 5.3 Create `apps/api/src/identity/presentation/dto/register.dto.ts` — maps Zod RegisterSchema to NestJS DTO
- [x] 5.4 Create `apps/api/src/identity/presentation/dto/login.dto.ts` — maps Zod LoginSchema
- [x] 5.5 Create `apps/api/src/identity/presentation/dto/refresh.dto.ts` — maps Zod RefreshSchema
- [x] 5.6 Create `apps/api/src/identity/presentation/auth.controller.ts` — register(201), login(200), refresh(200), me(200) with JwtAuthGuard
- [x] 5.7 Create `apps/web/package.json` + `tsconfig.json` + `next.config.ts`
- [x] 5.8 Create `apps/web/app/layout.tsx` + `apps/web/app/page.tsx` — placeholder "Prestamos App"

## Phase 6: Testing — Unit, Integration, E2E vs Specs

- [x] 6.1 Test EmailVO and PhoneVO: valid formats, invalid formats → spec scenarios 3-4 (invalid email/phone → 400)
- [x] 6.2 Test RegisterHandler: success (scenario 1), duplicate email (scenario 2) → 409
- [x] 6.3 Test LoginHandler: success (scenario 5), wrong password (scenario 6) → 401 generic
- [x] 6.4 Test RefreshHandler: rotation (scenario 7), family revocation on reuse (scenario 8)
- [x] 6.5 Integration test: PrismaUserRepository save + findByEmail, RefreshTokenService generate/consume/reuse via Redis
- [x] 6.6 E2E with supertest: POST /register (201), POST /login (200), POST /refresh (rotation), GET /me (profile), expired token (401) → scenarios 1-10
