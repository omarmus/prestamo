---
type: Reference
title: Project Overview
description: Visión general del proyecto prestamos-app, fases y objetivos estratégicos.
tags: [project, roadmap]
timestamp: 2026-07-16T12:00:00-04:00
---

# Project Overview

## Visión

Plataforma digital de préstamos para Bolivia que permita solicitud, evaluación, desembolso y cobranza de créditos de forma completamente digital, con scoring basado en IA y análisis de riesgo crediticio.

## Fases

| Fase | Enfoque | Estado |
|------|---------|--------|
| **Phase 0** | Scaffold + Design System + Branding | ✅ Completado |
| **Phase 1** | Auth completo + Onboarding de clientes | ⏳ Pendiente |
| **Phase 2** | Solicitud de préstamo, evaluación, riesgo crediticio | 📅 Futuro |
| **Phase 3** | Desembolso, cobranzas, pagos | 📅 Futuro |
| **Phase 4** | Scoring IA, integración WhatsApp, dashboard admin | 📅 Futuro |

## Phase 0 — Completado

| Item | Detalle |
|------|---------|
| Monorepo | Turborepo + pnpm workspaces |
| Backend scaffold | NestJS 11 con módulo Identity (register, login, refresh, me) |
| Prisma 7 | Schema, migración, seed, adapter pg |
| Docker | PostgreSQL 16 + Redis 7 |
| Tests | 41 tests (7 suites), 100% passing |
| shadcn/ui | 8 componentes instalados (Button, Card, Input, Label, Dialog, Select, Badge, Avatar) |
| Storybook | v10.5 configurado con 4 stories |
| Frontend DDD Lite | Atomic Design + features/ structure |
| Branding | Colores, dark mode, radius, tipografía en globals.css |
| Boneyard | Static skeleton registry para SEO |
| CodeGraph | Índice AST inicializado (378 nodos, 668 edges) |
| OKF Wiki | docs/okf/ completo con arquitectura, módulos, decisiones |
| Ponytail | Modo lazy activo con convenciones en AGENTS.md |
| AGENTS.md | Guía completa para agentes con mandatory rules |

## Estrategia de Entrega

Feature Branch Chain con PRs secuenciales por fase:
- Rama base: `feature/phase-N`
- Cada PR mergea a la rama base, no a `main`
- PRs pequeños (~400 líneas), revisables independientemente
- Al completar la fase, merge a `main`
