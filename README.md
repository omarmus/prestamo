# prestamos-app

Plataforma de préstamos digitales para Bolivia. Arquitectura DDD + Clean Architecture + Modular Monolith sobre Turborepo.

## Stack

- **Backend**: NestJS 11 + TypeScript + Prisma 7 + PostgreSQL 16 + Redis 7
- **Frontend**: Next.js 16 + React 19 + Tailwind CSS v4 + shadcn/ui
- **Auth**: JWT (access + refresh rotation) con argon2id
- **Monorepo**: Turborepo + pnpm workspaces

## Quick Start

```bash
# Iniciar servicios
docker compose up -d

# Instalar dependencias
pnpm install

# Generar Prisma client + migraciones + seed
pnpm --filter @prestamos/api exec prisma generate
pnpm --filter @prestamos/api exec prisma migrate dev
pnpm --filter @prestamos/api exec tsx src/identity/infrastructure/persistence/prisma/seed.ts

# Iniciar desarrollo
pnpm dev
```

- API: http://localhost:3001
- Web: http://localhost:3000

## Scripts

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Inicia API + web en dev |
| `pnpm build` | Build de todos los paquetes |
| `pnpm test` | Tests unitarios + integración |
| `pnpm lint` | ESLint |
| `pnpm type-check` | TypeScript strict check |
| `pnpm --filter @prestamos/api exec prisma studio` | Prisma Studio |
| `pnpm --filter @prestamos/web exec bones:build` | Generar skeletons Boneyard |

## Project Structure

```
├── apps/
│   ├── api/              # NestJS API
│   │   └── src/
│   │       ├── identity/ # Módulo de autenticación
│   │       │   ├── domain/
│   │       │   ├── application/
│   │       │   ├── infrastructure/
│   │       │   └── presentation/
│   │       └── shared/   # Guards, decoradores, filters
│   └── web/              # Next.js frontend
├── packages/
│   └── shared/           # Zod schemas + types compartidos
├── docs/
│   └── okf/              # Open Knowledge Format bundle
├── openspec/             # SDD artifacts
└── docker-compose.yml
```

## Fases

| Fase | Enfoque | Estado |
|------|---------|--------|
| **Phase 0** | Scaffold: CI/CD, Docker, Auth module, Web placeholder | ✅ Completado |
| **Phase 1** | Auth completo + Onboarding clientes | ⏳ Pendiente |
| **Phase 2** | Solicitud préstamo, evaluación, riesgo | 📅 Futuro |
| **Phase 3** | Desembolso, cobranzas, pagos | 📅 Futuro |
| **Phase 4** | Scoring IA, WhatsApp, Admin dashboard | 📅 Futuro |

## Documentación

- [OKF Knowledge Bundle](docs/okf/) — arquitectura, módulos, decisiones, operaciones
- [AGENTS.md](AGENTS.md) — guía para agentes de IA
- [OpenSpec](openspec/) — SDD specs y cambios

## Licencia

MIT
