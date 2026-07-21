---
type: Architecture
title: System Architecture
description: Clean Architecture + DDD + Modular Monolith sobre NestJS con Turborepo.
tags: [architecture, ddd, clean-architecture, modular-monolith]
timestamp: 2026-07-20T12:00:00-04:00
---

# System Architecture

## Paradigma

**Clean Architecture + Domain-Driven Design + Modular Monolith** sobre un monorepo Turborepo. Cada módulo de dominio (Identity, Loans, Payments, etc.) vive en `apps/api/src/<module>/` con sus propias capas.

**Módulos activos:** `identity` (auth), `loans` (crédito), `customers` (perfil), `landing`, `whatsapp` (schema), `notifications` (core).

## Backend — Clean Architecture + DDD

### Capas por Módulo

```
<module>/
├── domain/            # Entidades, Value Objects, puertos (interfaces)
│   ├── user.entity.ts
│   ├── email.value-object.ts
│   ├── user.repository.ts (port)
│   └── errors/
├── application/       # Casos de uso (commands + handlers)
│   ├── register/
│   ├── login/
│   └── ports/         # Interfaces que la infraestructura implementa
├── infrastructure/    # Implementaciones concretas (Prisma, JWT, Redis)
│   ├── persistence/
│   ├── auth/
│   └── redis.provider.ts
└── presentation/      # Controladores, DTOs, guards, decoradores
    ├── auth.controller.ts
    ├── dto/
    └── guards/
```

### Reglas

- Dependencias inward: presentation → application → domain. Infrastructure implementa puertos de domain/application.
- Cada módulo es independiente. No compartir entidades entre módulos. Para integración, usar casos de uso o eventos.

## Frontend — DDD Lite + Atomic Design

### Estructura

```
app/                    # Next.js App Router (thin — routing + layouts)
├── layout.tsx
├── page.tsx
└── globals.css

components/
├── atoms/ui/           # shadcn/ui base components (8 instalados)
├── molecules/          # 2-3 atom combinations (FormField, SearchInput)
└── organisms/          # Complex sections (Header, LoginForm)

features/               # DDD feature modules
├── auth/
│   ├── components/     # LoginForm, RegisterForm
│   └── hooks/          # useAuth, useLogin
├── loans/
│   ├── components/     # LoanForm, LoanList, LoanDetail
│   └── hooks/          # useLoans
├── admin/
│   ├── components/     # AdminLoanTable, AdminLoanReview
│   └── hooks/          # useAdminLoans
├── landing/
│   ├── components/     # Hero, Features, Footer, Simulator
│   └── hooks/          # usePublicSimulator
└── portal/
    ├── components/     # Sidebar, CustomerForm, DocumentUploader, SimulatorForm
    └── hooks/          # useCustomer, useDocuments, useSimulator

lib/                    # Shared utilities (utils.ts con cn())
providers/              # React context providers
stories/                # Storybook stories (1 por componente)
bones/                  # Boneyard static registry (SEO)
```

### Reglas

- `app/` solo routing + layouts. Toda la lógica de negocio y UI en components/ y features/.
- shadcn/ui es el único sistema de componentes. No raw HTML inline, no librerías alternativas.
- Cada componente shadcn/ui debe tener una story en Storybook.
- Feature modules reflejan los módulos del backend (auth → identity).

## Branding & Design System

Basado en SDD Parte VIII: colores azul (#1D4ED8) + turquesa (#06B6D4) + naranja (#F97316).

Ver [stack.md](stack.md) para tokens completos. Implementado en `apps/web/app/globals.css`.

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend framework | NestJS 11 |
| ORM | Prisma 7 |
| Base de datos | PostgreSQL 16 |
| Cache / tokens | Redis 7 |
| Frontend | Next.js 16 + React 19 |
| Estilos | Tailwind CSS v4 + shadcn/ui |
| Componentes UI | shadcn/ui (único sistema) |
| Visual testing | Storybook 10.5 |
| Paquete compartido | Zod schemas + tipos |
| Auth | JWT (access + refresh rotation) |
| Hashing | argon2id |
| Monorepo | Turborepo + pnpm workspaces |
