---
type: Domain Model
title: Loan Application Domain
description: Entidad LoanApplication, value objects, state machine y reglas de dominio para solicitudes de crédito.
tags: [domain, loans, credit, loan-application]
timestamp: 2026-07-20T12:00:00-04:00
---

# Loan Application Domain

## LoanApplication Entity

Entidad raíz del módulo Loans. Propiedades:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `string` (UUID) | Identificador único |
| `customerId` | `string` (UUID) | Cliente que solicita |
| `amount` | `number` | Monto solicitado |
| `termMonths` | `number` | Plazo en meses |
| `annualRate` | `number` | Tasa anual (%) |
| `monthlyPayment` | `number` | Cuota mensual calculada |
| `totalInterest` | `number` | Interés total |
| `totalPayment` | `number` | Pago total |
| `purpose` | `string?` | Propósito del préstamo |
| `status` | `LoanStatus` | Estado actual |
| `riskScore` | `string?` | Score de riesgo (asignado al aprobar) |
| `simulationId` | `string?` | Simulación de origen (opcional) |
| `reviewerId` | `string?` | Analista asignado |
| `reviewNotes` | `string?` | Notas de revisión |
| `reviewedAt` | `string?` | Fecha de revisión |
| `createdAt` | `string` | Fecha de creación |
| `updatedAt` | `string` | Última modificación |
| `timeline` | `TimelineEntry[]` | Historial de cambios de estado |

## LoanStatus Value Object

```
DRAFT | PENDING | IN_REVIEW | INFO_REQUESTED | APPROVED | REJECTED | CANCELLED
```

Transiciones válidas:

| Desde | Hacia |
|-------|-------|
| DRAFT | PENDING, CANCELLED |
| PENDING | IN_REVIEW, CANCELLED |
| IN_REVIEW | APPROVED, REJECTED, INFO_REQUESTED |
| INFO_REQUESTED | PENDING |
| APPROVED | — (terminal) |
| REJECTED | — (terminal) |
| CANCELLED | — (terminal) |

## TimelineEntry

```typescript
interface TimelineEntry {
  fromStatus: LoanStatus | null;
  toStatus: LoanStatus;
  changedBy: 'customer' | 'admin';
  changedAt: string;
  notes?: string;
}
```

## Reglas de Dominio

- Solo el analista asignado (`reviewerId`) puede aprobar, rechazar o solicitar información
- `approve()` y `reject()` validan que `actorId === this.reviewerId`
- Las transiciones de estado se validan contra `VALID_TRANSITIONS` lookup table
- `updateStatus` en infraestructura usa `updateMany` con `{ where: { id, status: fromStatus } }` para detectar condiciones de carrera

## Errores de Dominio

| Error | Causa |
|-------|-------|
| `LoanStatusTransitionError` | Transición inválida entre estados |
| `LoanNotOwnedByCustomerError` | Acción de admin realizada por otro analista |
| `ApplicationNotFoundError` | Solicitud no encontrada |
