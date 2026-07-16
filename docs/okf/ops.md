---
type: Operations
title: Operations & DevOps
description: Docker, CI/CD, codegraph, y configuración del entorno local.
tags: [ops, docker, ci, devops, codegraph, storybook, boneyard]
timestamp: 2026-07-16T12:00:00-04:00
---

# Operations

## Entorno Local

```bash
# Iniciar servicios
docker compose up -d

# Instalar dependencias
pnpm install

# Generar Prisma client
pnpm --filter @prestamos/api prisma:generate

# Correr migraciones
pnpm --filter @prestamos/api prisma:migrate

# Seed
pnpm --filter @prestamos/api seed

# Iniciar dev
pnpm dev
```

## Comandos Frontend

```bash
# Agregar componente shadcn/ui (desde apps/web/)
npx shadcn@latest add <componente>

# Iniciar Storybook
pnpm --filter @prestamos/web storybook

# Build Storybook
pnpm --filter @prestamos/web build-storybook

# Regenerar Boneyard (skeleton estático para SEO)
pnpm --filter @prestamos/web bones:build
```

## CodeGraph (Índice AST)

Consultar ANTES de escribir código. No usar grep primero.

```bash
# Ver estado del índice
codegraph status

# Reindexar si hay archivos pendientes
codegraph init -i

# Sincronizar antes de commit
codegraph sync
```

Si CodeGraph no está instalado, no bloquea el commit.

## Docker Compose

```yaml
services:
  postgres:16-alpine    # Puerto 5432
  redis:7-alpine        # Puerto 6379
```

## CI (GitHub Actions — Pendiente)

- **Lint**: ESLint en todos los paquetes
- **Type Check**: TypeScript strict en todos los paquetes
- **Build**: Turbo build con cache
- **Test**: Jest unit + E2E
- **Prisma**: Generate + migrate check
