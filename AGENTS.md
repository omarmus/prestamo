---
type: Agent Guide
title: prestamos-app — Agent Instructions
description: Conventions, architecture, and workflow rules for AI coding agents working on this project.
---

# prestamos-app — Agent Guide

## Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS 11, TypeScript 5.9 |
| Frontend | Next.js 16, React 19, Tailwind CSS v4 + shadcn/ui |
| ORM | Prisma 7 (`@prisma/adapter-pg` + `pg.Pool`) |
| Database | PostgreSQL 16, Redis 7 |
| Auth | JWT (access 15m + refresh 7d rotation) |
| Shared | Zod schemas + types in `packages/shared` |
| Monorepo | Turborepo + pnpm workspaces |

## Architecture

### Backend — Clean Architecture + DDD + Modular Monolith

Each module lives in `apps/api/src/<module>/` with 4 layers:

```
<module>/
├── domain/          # Entities, VOs, repository ports, errors
├── application/     # Commands + handlers, port interfaces
├── infrastructure/  # Prisma repos, JWT, Redis, DI wiring
└── presentation/    # Controllers, DTOs, guards, decorators
```

Current modules: `identity`

### Frontend — DDD Lite + Atomic Design

Structure at `apps/web/`:

```
app/                    # Next.js App Router (thin — routing + layouts)
├── layout.tsx
├── page.tsx
└── globals.css

components/
├── atoms/ui/           # shadcn/ui base components
├── molecules/          # 2-3 atom combinations (FormField, SearchInput)
└── organisms/          # Complex sections (Header, LoginForm)

features/               # DDD feature modules
├── auth/
│   ├── components/     # Feature-specific organisms
│   └── hooks/          # Custom hooks (useAuth, useLogin)
└── loans/

lib/                    # Shared utilities (utils.ts, api client)
providers/              # React context providers
stories/                # Storybook stories
bones/                  # Boneyard static registry
```

## Prisma 7 Setup

Schema is at `apps/api/src/identity/infrastructure/persistence/prisma/schema.prisma`. No `url` in schema — use `prisma.config.ts` at `apps/api/` and pass adapter to PrismaClient:

```ts
const pool = new pg.Pool({ connectionString: process.env['DATABASE_URL'] });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
```

## Workflow

- **Feature Branch Chain**: `feature/phase-N` base branch with sequential PRs
- **Commands**: `pnpm dev` (dev), `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm type-check`
- **Prisma**: `pnpm --filter @prestamos/api exec prisma generate`, `prisma migrate dev`
- **Testing**: Jest — unit tests co-located with source (`*.spec.ts`), integration in `test/`

## Code Conventions

- `ponytail:` comments mark deliberate simplifications with known ceilings. Root cause fixes only — guard the shared function, not every caller. No speculative abstractions, no config for values that never change
- Imports: relative paths (not aliases), no index.ts barrels
- Components: shadcn/ui in `apps/web/components/atoms/ui/`. Add via `npx shadcn@latest add <name>` from `apps/web/`. Feature components in `features/<name>/components/`.
- Stories: co-located in `apps/web/stories/` or alongside components. Run `pnpm storybook` from `apps/web/`
- No AI attribution in commits. Conventional commits only
- Never commit secrets. Use `.env` (gitignored) from `.env.example`

## Mandatory Rules

These rules are NOT optional. Every agent working on this project MUST follow them:

### 1. DDD Clean Architecture
- **Backend**: Siempre DDD + Clean Architecture + Modular Monolith. Cada módulo en `apps/api/src/<module>/` con 4 capas: domain, application, infrastructure, presentation. No mezclar capas, no romper dependencias inward.
- **Frontend**: Siempre DDD Lite + Atomic Design. Componentes en components/{atoms,molecules,organisms}/, lógica de dominio en features/<name>/{components,hooks}/. app/ solo para routing y layouts.
- **Shared**: Todo tipo/validador compartido entre backend y frontend va en `packages/shared/`.

### 2. shadcn/ui — Único sistema de componentes
- **Todos** los componentes UI deben ser shadcn/ui. No crear componentes raw HTML inline, no usar librerías alternativas.
- Agregar cada componente vía `npx shadcn@latest add <name>` desde `apps/web/`.
- **Cada** componente shadcn/ui debe tener al menos una Storybook story en `apps/web/stories/`.
- Feature components van en `features/<name>/components/` y también deben tener stories.
- Excepción: componentes puramente funcionales (wrappers, HOCs, providers) sin UI visual no requieren story.

### 3. CodeGraph — Mantener índice actualizado
- Antes de cada commit, ejecutar codegraph sync para actualizar el índice AST.
- Si codegraph está disponible: `codegraph status`, luego reindexar si hay archivos pendientes.
- Si no está disponible: ignorar, no bloquear el commit.
- Consultar CodeGraph ANTES de escribir código (no grep primero).

### 4. OKF Wiki — Documentar cada cambio
- Con cada commit (o al finalizar una sesión), actualizar `docs/okf/` con los cambios relevantes.
- No escribir documentación redundante — solo lo que un agente nuevo necesitaría saber.
- Mantener `log.md` actualizado con entradas por fecha y cambio significativo.
- No crear archivos nuevos en OKF sin aprobación explícita.
