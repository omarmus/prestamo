---
type: Module
title: Loans Module
description: Módulo de solicitud y evaluación de crédito — aplicación, revisión por analista, aprobación/rechazo, cancelación.
tags: [module, loans, credit, applications]
timestamp: 2026-07-20T12:00:00-04:00
---

# Loans Module

## Capacidades

- **Crear solicitud** — desde el portal con monto, plazo, tasa, propósito
- **Listar solicitudes** — del cliente autenticado o todas pendientes (admin)
- **Ver detalle** — timeline de estados, datos financieros
- **Cancelar** — el cliente puede cancelar su solicitud en DRAFT o PENDING
- **Asignar revisor** — analista toma la solicitud para evaluar
- **Aprobar/Rechazar** — solo el analista asignado puede decidir
- **Solicitar información** — el analista pide más datos, el cliente responde

## Domain Entity

`LoanApplication` — entidad con state machine usando `transition()`:

```
DRAFT → PENDING → IN_REVIEW → APPROVED
  │                  │             │
  └→ CANCELLED       ├→ REJECTED  │
                     │             │
                     └→ INFO_REQUESTED → PENDING (cliente responde)
```

Reglas de dominio:
- `approve()` y `reject()` solo si `reviewerId === actorId`
- `updateStatus()` en repositorio usa `updateMany` con `{ where: { id, status: fromStatus } }` — optimistic locking
- Timeline inmutable: cada transición agrega entrada con `fromStatus`, `toStatus`, `changedBy`, `changedAt`

## Puertos (Application Layer)

| Puerto | Implementación |
|--------|---------------|
| `LoanApplicationRepository` | `PrismaLoanApplicationRepository` |
| `AdminQueryPort` | `PrismaAdminQueryImpl` |

## Endpoints — Portal (Customer)

| Método | Ruta | Auth | Body |
|--------|------|------|------|
| POST | `/loan-applications` | CustomerGuard | `{ simulationId? \| amount, termMonths, annualRate, purpose }` |
| GET | `/loan-applications` | CustomerGuard | — |
| GET | `/loan-applications/:id` | CustomerGuard | — |
| POST | `/loan-applications/:id/cancel` | CustomerGuard | — |

## Endpoints — Admin

| Método | Ruta | Auth | Body |
|--------|------|------|------|
| GET | `/admin/loans` | AdminGuard | `?status=PENDING&page=1&limit=20` |
| GET | `/admin/loans/:id` | AdminGuard | — |
| POST | `/admin/loans/:id/assign` | AdminGuard | — |
| POST | `/admin/loans/:id/review` | AdminGuard | `{ notes? }` |
| POST | `/admin/loans/:id/approve` | AdminGuard | `{ riskScore }` |
| POST | `/admin/loans/:id/reject` | AdminGuard | `{ reason }` |
| POST | `/admin/loans/:id/request-info` | AdminGuard | `{ message }` |

## Tablas Prisma

- `LoanApplication` — solicitud completa con monto, plazo, rate, status, timeline, reviewer

## Frontend

| Ruta | Propósito |
|------|-----------|
| `/portal/loans` | Mis solicitudes (lista con estados) |
| `/portal/loans/new` | Nueva solicitud (formulario monto/plazo/propósito) |
| `/portal/loans/[id]` | Tracking con timeline |
| `/admin/loans` | Bandeja de solicitudes pendientes |
| `/admin/loans/[id]` | Detalle + evaluar (assign/review/approve/reject) |
