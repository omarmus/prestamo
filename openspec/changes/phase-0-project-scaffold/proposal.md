# Proposal: Phase 0 — Project Scaffold

## Intent

Desbloquear el desarrollo del monorepo. Sin este scaffold no se puede escribir una sola línea de código. Establece la base técnica sobre la que se construirán los 12 dominios DDD.

## Scope

### In Scope
- Monorepo Turborepo + pnpm workspaces (root, configs compartidas)
- `apps/api/` — NestJS scaffold con estructura DDD (domain/application/infrastructure/presentation) + shared base classes
- `apps/web/` — Next.js scaffold con página placeholder
- `packages/shared/` — Zod schemas + TypeScript tipos para contratos frontend/backend
- Módulo **Identity** (Auth) funcional: entidad User, VO Email/Phone, Register + LocalLogin commands, JWT access/refresh tokens, Prisma adapter + migración, AuthController (register, login, refresh, me)
- `docker-compose.yml` — PostgreSQL 16 + Redis 7 para desarrollo local
- CI básico — GitHub Actions: lint + type-check + build en PRs

### Out of Scope
- Landing page con diseño visual (siguiente cambio: Phase 0b)
- Los otros 11 dominios DDD (se agregan cuando se necesiten)
- WhatsApp, OCR, Evaluación, Motor de reglas, Pagos QR, AI Service
- Portal del cliente, app móvil, multi-tenant SaaS
- Despliegue a AWS (solo dev local)

## Capabilities

### New Capabilities
- `project-scaffold`: estructura del monorepo, tooling compartido, Docker Compose, CI
- `user-auth`: registro, login local, JWT (access + refresh), consulta de perfil propio

### Modified Capabilities
None — greenfield, no existen specs previas.

## Approach

Turborepo sobre Nx (Nx es overkill para 2 apps). Modular Monolith con DDD, no microservicios. Identity como primer módulo porque todos los dominios dependen de auth. Dependencias justificadas: Next.js (frontend), NestJS (backend), Prisma (ORM), Zod (validación compartida), Turborepo (orquestación), Docker Compose (postgres + redis local) — todas son el stack definido en análisis.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `package.json` (root) | New | pnpm workspace root |
| `turbo.json` | New | Pipeline de builds |
| `tsconfig.base.json` | New | TypeScript base config |
| `.eslintrc.js` / `.prettierrc` | New | Estilo compartido |
| `apps/api/` | New | NestJS + DDD scaffold + Identity module |
| `apps/web/` | New | Next.js placeholder |
| `packages/shared/` | New | Zod schemas + tipos TS |
| `docker-compose.yml` | New | PostgreSQL 16 + Redis 7 |
| `.github/workflows/ci.yml` | New | Lint + type-check + build |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Overengineering (crear para 12 dominios) | Med | YAGNI — solo Identity, los demás llegan en fases posteriores |
| Prisma schema mal diseñado | Med | Migraciones desde día 1, schema simple (User, Role), fácil de iterar |
| Dependencia servicios externos para dev | Low | Docker Compose evita depender de cloud |
| Lock-in Turborepo | Low | Si duele, reemplazar con pnpm workspaces solos es trivial |

## Rollback Plan

1. **Monorepo**: `rm -rf apps packages turbo.json tsconfig.base.json .eslintrc.js .prettierrc docker-compose.yml .github` — se revierte todo el scaffold en segundos.
2. **Base de datos**: `npx prisma migrate reset` borra datos. Si hay deploy, `prisma migrate down` revierte la migración.
3. **Git**: `git checkout HEAD~1` — el cambio completo es un solo commit atómico.

## Dependencies

- Node.js 20+ (LTS), pnpm 9+
- Docker Desktop (o Docker Engine) para PostgreSQL + Redis local
- Ninguna API externa — todo corre localmente

## Success Criteria

- [ ] `pnpm install` desde root instala dependencias de todas las apps
- [ ] `pnpm dev` levanta API + Web simultáneamente
- [ ] `docker compose up` levanta PostgreSQL 16 + Redis 7
- [ ] `POST /api/auth/register` crea usuario y devuelve tokens
- [ ] `POST /api/auth/login` autentica y devuelve access + refresh tokens
- [ ] `GET /api/auth/me` devuelve perfil con JWT válido
- [ ] `pnpm lint && pnpm type-check && pnpm build` pasan limpios en CI
- [ ] Prisma migration genera las tablas `User` y `Role` correctamente
