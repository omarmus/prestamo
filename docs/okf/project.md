---
type: Reference
title: Project Overview
description: Visión general del proyecto prestamos-app, fases y objetivos estratégicos.
tags: [project, roadmap]
timestamp: 2026-07-20T12:00:00-04:00
---

# Project Overview

## Visión

Plataforma digital de préstamos para Bolivia que permita solicitud, evaluación, desembolso y cobranza de créditos de forma completamente digital, con scoring basado en IA y análisis de riesgo crediticio.

## Fases

| Fase | Enfoque | Estado |
|------|---------|--------|
| **Phase 0** | Scaffold + Identity + Auth Frontend | ✅ Completado |
| **Phase 1** | Infraestructura compartida + Prisma base | ✅ Completado |
| **Phase 2** | Portal Core + Customers + WhatsApp Schema + Landing | ✅ Completado |
| **Phase 3** | Loan Application (backend + portal + admin review) | ✅ Completado |
| **Phase 4** | Préstamos activos + Pagos | 📅 Futuro |
| **Phase 5** | Documentos Legales + Contratos | 📅 Futuro |
| **Phase 6** | Admin Backoffice completo + Dashboard métricas | 📅 Futuro |

## Phase 0 — Completado

| Item | Detalle |
|------|---------|
| Monorepo | Turborepo + pnpm workspaces |
| Backend scaffold | NestJS 11 con módulo Identity (register, login, refresh, me) |
| Prisma 7 | Schema, migración, seed, adapter pg |
| Docker | PostgreSQL 16 + Redis 7 |
| shadcn/ui | 8 componentes instalados (Button, Card, Input, Label, Dialog, Select, Badge, Avatar) |
| Storybook | v10.5 configurado con 4+ stories |
| Frontend DDD Lite | Atomic Design + features/ structure |
| Branding | Colores, dark mode, radius, tipografía en globals.css |
| Auth Frontend | LoginForm, RegisterForm, AuthProvider, API client con refresh |
| Landing Page | Hero, features, footer, simulador público |
| Boneyard | Static skeleton registry para SEO |
| CodeGraph | Índice AST inicializado |
| OKF Wiki | docs/okf/ completo con arquitectura, módulos, decisiones |
| Ponytail | Modo lazy activo con convenciones en AGENTS.md |
| AGENTS.md | Guía completa para agentes con mandatory rules |

## Phase 1 — Completado (Fundación)

| Item | Detalle |
|------|---------|
| Prisma base | Campos base en todos los modelos (organizationId, soft delete, version, auditoría) |
| AuditLog | Modelo implementado en schema |
| SystemConfiguration | Settings globales en schema |
| @Inject() | Decorador explícito en todos los constructores NestJS |
| DI Tokens | Naming consistente por módulo |

## Phase 2 — Completado (Portal Core + Customers + WhatsApp)

| Item | Detalle |
|------|---------|
| Customer Module | Clean Architecture: domain, application, infrastructure, presentation |
| Auto-create | Customer creado automáticamente al registrar usuario |
| Portal Profile | GET/me, PATCH/profile con datos personales + empleo + ingresos |
| CustomerDocuments | Subida y listado (base64 local, S3 post-MVP) |
| LoanSimulator | Cálculo de cuota mensual, tabla de amortización |
| Portal Dashboard | Resumen del cliente con acciones rápidas |
| WhatsApp Schema | 4 tablas: contacts, conversations, messages, chatbot_sessions |
| Landing Page | Hero + features + simulator público + footer |

## Phase 3 — Completado (Loan Application)

| Item | Detalle |
|------|---------|
| Loans Module | Clean Architecture: domain, application, infrastructure, presentation |
| State Machine | DRAFT → PENDING → IN_REVIEW → APPROVED/REJECTED/CANCELLED/INFO_REQUESTED |
| Portal Apply | `/portal/loans/new` — formulario con monto, plazo, propósito |
| Portal Tracking | `/portal/loans/[id]` — timeline con historial de estados |
| Admin Review | `/admin/loans` — bandeja + asignar + aprobar/rechazar/solicitar info |
| Optimistic Locking | `updateStatus` con `updateMany { where: { id, status } }` |
| Timeline | Cada transición registra fromStatus, toStatus, changedBy, changedAt |

## Estrategia de Entrega

Feature Branch Chain con PRs secuenciales por fase:
- Rama base: `feature/phase-N`
- Cada PR mergea a la rama base, no a `main`
- PRs pequeños (~400 líneas), revisables independientemente
- Al completar la fase, merge a `main`
