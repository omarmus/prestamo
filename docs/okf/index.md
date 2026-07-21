---
okf_version: "0.3"
type: Bundle
title: prestamos-app Knowledge Bundle
description: Conocimiento curado del sistema de préstamos digitales para Bolivia — arquitectura, módulos, dominio, decisiones técnicas y operaciones.
timestamp: 2026-07-20T12:00:00-04:00
tags: [fintech, loans, bolivia, nestjs, nextjs, ddd, clean-architecture, shadcn-ui, storybook]
---

# prestamos-app

Plataforma de préstamos digitales para el mercado boliviano. Arquitectura DDD + Clean Architecture + Modular Monolith sobre NestJS y Next.js. Design system con shadcn/ui + Storybook + branding personalizado.

## Sections

- [Project Overview](project.md) — visión general, fases, objetivos
- [Architecture](architecture.md) — decisiones arquitectónicas, diagramas
- [Stack](stack.md) — tecnologías y justificación
- [Modules](modules/) — módulos del sistema
- [Domain](domain/) — modelo de dominio
- [Decisions](decisions/) — ADRs y decisiones técnicas
- [Operations](ops.md) — Docker, CI/CD, despliegue
- [Data Models](data-models.md) — modelo de datos completo extraído del DAD (02-49)
- [Roadmap](roadmap.md) — plan de implementación MVP por fases
- [Tables MVP](tables-mvp.md) — listado completo de las 28 tablas del MVP

## Quick Links

- [Identity Module](modules/identity.md) — autenticación y usuarios
- [Loans Module](modules/loans.md) — solicitud y revisión de crédito
- [User Auth Domain](domain/user-auth.md) — entidades y value objects de autenticación
- [Loan Application Domain](domain/loans.md) — state machine y reglas de dominio
- [Feature Branch Chain](decisions/feature-branch-chain.md) — estrategia de entrega
- [Frontend Architecture](architecture.md#frontend--ddd-lite--atomic-design) — DDD Lite + Atomic Design
- [Branding Tokens](stack.md#branding-design-tokens) — colores, dark mode, radius
