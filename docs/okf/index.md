---
okf_version: "0.2"
type: Bundle
title: prestamos-app Knowledge Bundle
description: Conocimiento curado del sistema de préstamos digitales para Bolivia — arquitectura, módulos, dominio, decisiones técnicas y operaciones.
timestamp: 2026-07-16T12:00:00-04:00
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

## Quick Links

- [Identity Module](modules/identity.md) — autenticación y usuarios
- [User Auth Domain](domain/user-auth.md) — entidades y value objects de autenticación
- [Feature Branch Chain](decisions/feature-branch-chain.md) — estrategia de entrega
- [Frontend Architecture](architecture.md#frontend--ddd-lite--atomic-design) — DDD Lite + Atomic Design
- [Branding Tokens](stack.md#branding-design-tokens) — colores, dark mode, radius
