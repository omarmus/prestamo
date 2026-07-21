# Proposal: Loan Application Workflow

## Intent

Hoy un cliente puede simular un préstamo, registrarse, completar su perfil, subir documentos — pero NO puede solicitar un préstamo. El simulador termina en una tabla de amortización y ahí se corta el flujo. Sin una solicitud real, el negocio no existe: no hay expediente que un asesor pueda revisar, no hay decisión de crédito, no hay préstamo que desembolsar.

Este cambio cierra la brecha entre "simular" y "solicitar". Crea el modelo de dominio `LoanApplication`, su ciclo de vida (solicitado → revisado → aprobado/rechazado), y las interfaces de cliente y asesor para que el primer préstamo real pueda fluir de punta a punta.

## Scope

### In Scope

- **Prisma**: modelo `LoanApplication` con campos: customerId, simulationId (opcional), amount, termMonths, annualRate, monthlyPayment, totalInterest, totalPayment, purpose, status, reviewerId, reviewNotes, reviewNotes, reviewedAt, createdAt, updatedAt
- **Backend module**: nuevo módulo `loans/` con Clean Architecture (domain/ → application/ → infrastructure/ → presentation/)
- **Customer endpoints**:
  - `POST /api/loans/applications` — crear solicitud (desde datos directos o simulationId)
  - `GET /api/loans/applications` — listar mis solicitudes
  - `GET /api/loans/applications/:id` — detalle de una solicitud
  - `DELETE /api/loans/applications/:id` — cancelar solicitud (solo si está DRAFT o PENDING)
- **Admin endpoints**:
  - `GET /api/admin/loans/applications` — listar todas (filtro por status)
  - `GET /api/admin/loans/applications/:id` — detalle con datos del cliente
  - `POST /api/admin/loans/applications/:id/approve` — aprobar
  - `POST /api/admin/loans/applications/:id/reject` — rechazar (con motivo)
  - `POST /api/admin/loans/applications/:id/request-info` — solicitar más información
- **State machine**: DRAFT → PENDING_REVIEW → (UNDER_REVIEW) → APPROVED | REJECTED
  - De DRAFT y PENDING se puede cancelar (CANCELLED)
  - De PENDING_REVIEW puede pasar a IN_REVIEW cuando un asesor lo toma
  - De IN_REVIEW puede ir a APPROVED, REJECTED, o INFO_REQUESTED
  - De INFO_REQUESTED vuelve a PENDING_REVIEW cuando el cliente responde
- **Shared Zod schemas**: `loan.schema.ts` en `packages/shared/` con schemas y tipos
- **Frontend portal**: sección "Mis Préstamos" en la barra lateral con lista y detalle de solicitudes
- **Frontend admin**: ruta `/admin/loans` con tabla de solicitudes pendientes y panel de review (detalle del cliente + documentos + decisión)
- **Simulator → Apply flow**: botón "Solicitar este préstamo" al final del simulador que pre-pobló los campos y crea la aplicación
- **Risk assessment**: cálculo simple de ratio DTI (monthlyPayment / monthlyIncome) al aprobar. `ponytail: scoring linear basado en DTI + documentos subidos. Deuda técnica: burel de crédito (ASFI/Infocred) se integra después.`

### Out of Scope

- Desembolso real de fondos (disbursement)
- Cobranza / cronograma de pagos real
- Generación de contratos digitales
- Integración con buró de crédito (ASFI/Infocred)
- Score de crédito avanzado (machine learning, históricos)
- Carga masiva de solicitudes
- Notificaciones push/email (solo status en UI por ahora)
- Historial de cambios / auditoría granular del workflow (el `updatedAt` + reviewerId es suficiente para MVP)

## Architectural Approach

### New Module: `loans/`

```
apps/api/src/loans/
├── domain/
│   ├── loan-application.entity.ts      # Entidad con state machine
│   ├── loan-application.repository.ts  # Port
│   ├── loan-application.errors.ts      # Domain errors
│   └── value-objects/
│       ├── loan-status.ts              # Enum + transitions
│       └── loan-amount.vo.ts           # Value Object con validación
├── application/
│   ├── create-application/
│   │   └── create-application.handler.ts
│   ├── get-applications/
│   │   └── get-applications.handler.ts  # Customer: filtrar por customerId
│   ├── get-application/
│   │   └── get-application.handler.ts
│   ├── cancel-application/
│   │   └── cancel-application.handler.ts
│   ├── review-application/              # Admin: approve, reject, request-info
│   │   └── review-application.handler.ts
│   ├── list-pending-applications/       # Admin: listar con filtros
│   │   └── list-pending-applications.handler.ts
│   └── ports/
│       └── admin-query.port.ts          # Para obtener datos del customer + documentos
├── infrastructure/
│   ├── persistence/
│   │   └── prisma-loan-application.repository.ts
│   └── admin-query/
│       └── prisma-admin-query.impl.ts
├── presentation/
│   ├── loan-application.controller.ts  # Customer endpoints
│   ├── admin-loan-application.controller.ts  # Admin endpoints
│   └── dto/
│       ├── create-application.dto.ts
│       └── review-application.dto.ts
├── loans.module.ts
└── loans.tokens.ts
```

### Loan Status State Machine

```
                  ┌──────────┐
                  │  DRAFT   │  (creada desde simulador, no enviada)
                  └────┬─────┘
                       │ submit
                  ┌────▼──────┐
           ┌──────┤ PENDING   │  (enviada, esperando asesor)
           │      └────┬──────┘
           │           │ assign
           │      ┌────▼─────┐
           │      │ IN_REVIEW│  (asesor la está revisando)
           │      └────┬─────┘
           │       ┌───┴───┐
           │       │       │
           │  ┌────▼──┐ ┌──▼───────┐     ┌───────────────┐
           │  │APPROVED│ │ REJECTED │     │ INFO_REQUESTED│
           │  └────────┘ └──────────┘     └───────┬───────┘
           │          cancel (DRAFT|PENDING)      │ customer responds
           │          ┌──────────┐                │
           └──────────┤CANCELLED │◄────────────────┘
                      └──────────┘
```

Transiciones no permitidas (arrojan `LoanStatusTransitionError`):
- APPROVED → cualquier cosa (es terminal para el workflow de aplicación)
- CANCELLED → cualquier cosa
- REJECTED → cualquier cosa

### Risk Assessment

`ponytail: scoring minimal.` Al aprobar, se calcula:

```
dti = monthlyPayment / totalMonthlyIncome
score = 
  dti <= 0.3 → "LOW"    (aprobación automática si documents ok)
  dti <= 0.5 → "MEDIUM" (requiere revisión manual)
  dti > 0.5  → "HIGH"   (rechazo recomendado)
```

- `totalMonthlyIncome` se obtiene de `CustomerIncome[]` (sumando los MONTHLY + convirtiendo BIWEEKLY/WEEKLY/YEARLY a mensual)
- Si el cliente no tiene incomes registrados, se usa `Customer.monthlyIncome` como fallback
- Si no hay ningún ingreso registrado → se rechaza automáticamente por "datos insuficientes"
- El score se guarda en `LoanApplication.riskScore` (campo opcional)
- `ponytail: no burel, no ML, no historial. Agregar cuando el volumen lo justifique.`

### Relación con Simulation

- `LoanApplication.simulationId` es opcional (nullable UUID)
- Cuando se crea desde el simulador, se pasa `simulationId` para trazabilidad
- Cuando se crea directo (sin simular), va null — el backend calcula monthlyPayment con `calculateLoan()`
- No hay cascade ni dependencia fuerte: la simulación es solo contexto, no requisito

### Admin Identity

Se asume que los admins son usuarios con `role.name = 'ADMIN'` (ya existe `Role` model). Se crea un `AdminGuard` que verifica `request.user.role === 'ADMIN'` (similar a `CustomerGuard` pero por rol).

## Key Technical Decisions

### Prisma Model

```prisma
model LoanApplication {
  id             String   @id @default(uuid())
  customerId     String
  customer       Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  simulationId   String?  // optional reference to the simulation that originated this
  simulation     LoanSimulation? @relation(fields: [simulationId], references: [id])

  amount         Decimal  @db.Decimal(18, 2)
  termMonths     Int
  annualRate     Decimal  @db.Decimal(10, 6)
  monthlyPayment Decimal  @db.Decimal(18, 2)
  totalInterest  Decimal  @db.Decimal(18, 2)
  totalPayment   Decimal  @db.Decimal(18, 2)
  purpose        String?  // e.g. "NEGOCIO", "EDUCACION", "SALUD", "VIAJE", "OTRO"
  status         String   @default("PENDING")  // DRAFT | PENDING | IN_REVIEW | INFO_REQUESTED | APPROVED | REJECTED | CANCELLED
  riskScore      String?  // LOW | MEDIUM | HIGH

  reviewerId     String?
  reviewer       User?    @relation(fields: [reviewerId], references: [id])
  reviewNotes    String?  // motivo de rechazo o notas del asesor
  reviewedAt     DateTime?

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

### API Endpoints

#### Customer (`/api/loans/applications`) — protegido con `JwtAuthGuard` + `CustomerGuard`

| Method | Path | Handler | Description |
|--------|------|---------|-------------|
| POST | `/api/loans/applications` | `createApplication` | Crear solicitud. Body: `{ simulationId?, amount, termMonths, annualRate, purpose }` |
| GET | `/api/loans/applications` | `listApplications` | Listar solicitudes del customer autenticado |
| GET | `/api/loans/applications/:id` | `getApplication` | Detalle de una solicitud (solo propia, con `CustomerGuard`) |
| DELETE | `/api/loans/applications/:id` | `cancelApplication` | Cancelar solicitud (solo DRAFT o PENDING) |

#### Admin (`/api/admin/loans/applications`) — protegido con `JwtAuthGuard` + `AdminGuard`

| Method | Path | Handler | Description |
|--------|------|---------|-------------|
| GET | `/api/admin/loans/applications` | `listPending` | Listar todas. Query: `?status=PENDING&page=1&limit=20` |
| GET | `/api/admin/loans/applications/:id` | `getApplicationDetail` | Detalle + datos del cliente (profile, documents, incomes) |
| POST | `/api/admin/loans/applications/:id/approve` | `approveApplication` | Aprobar. Body opcional: `{ notes }` |
| POST | `/api/admin/loans/applications/:id/reject` | `rejectApplication` | Rechazar. Body: `{ reason }` |
| POST | `/api/admin/loans/applications/:id/request-info` | `requestInfo` | Pedir más info. Body: `{ message }` |
| POST | `/api/admin/loans/applications/:id/review` | `assignAndReview` | Auto-asignarse + cambiar a IN_REVIEW |

### Shared Zod Schemas

Archivo nuevo: `packages/shared/src/schemas/loan.schema.ts`

```typescript
export const LoanPurposeEnum = z.enum(['NEGOCIO', 'EDUCACION', 'SALUD', 'VIAJE', 'OTRO']);
export type LoanPurpose = z.infer<typeof LoanPurposeEnum>;

export const LoanStatusEnum = z.enum(['DRAFT', 'PENDING', 'IN_REVIEW', 'INFO_REQUESTED', 'APPROVED', 'REJECTED', 'CANCELLED']);
export type LoanStatus = z.infer<typeof LoanStatusEnum>;

export const CreateLoanApplicationSchema = z.object({
  simulationId: z.string().uuid().optional(),
  amount: z.number().positive().max(500000),
  termMonths: z.number().int().min(3).max(120),
  annualRate: z.number().positive().max(36),
  purpose: LoanPurposeEnum.optional(),
});
export type CreateLoanApplicationInput = z.infer<typeof CreateLoanApplicationSchema>;

export const ReviewLoanApplicationSchema = z.object({
  notes: z.string().max(1000).optional(),
  reason: z.string().max(1000).optional(),  // required for reject
});
export type ReviewLoanApplicationInput = z.infer<typeof ReviewLoanApplicationSchema>;
```

Actualizar `packages/shared/src/index.ts` para exportar el nuevo schema.

### Frontend Portal

- Nuevo ítem en sidebar: "Mis Préstamos" con icono `CreditCard` (de `lucide-react`)
- Ruta: `/portal/loans` — lista de solicitudes con status badges
- Ruta: `/portal/loans/[id]` — detalle de solicitud + timeline de status
- Botón "Solicitar este préstamo" en `SimulatorForm`/`AmortizationTable` (después de mostrar resultado de simulación, aparece un CTA que redirige a creación desde simulación)
- Hook: `features/loans/hooks/use-loans.ts` con métodos `create`, `list`, `get`, `cancel`
- Componentes: `features/loans/components/loan-list.tsx`, `loan-detail.tsx`, `loan-form.tsx`

### Frontend Admin

- Nueva ruta: `/admin/loans` — tabla con solicitudes pendientes
- Ruta: `/admin/loans/[id]` — panel de review con:
  - Datos del cliente (profile, employment, incomes, bank accounts)
  - Documentos subidos (CI, selfie, payslips, bank statements)
  - Historial de simulaciones
  - Detalle de la solicitud (monto, plazo, cuota, DTI)
  - Acciones: Aprobar | Rechazar (con motivo) | Solicitar más info
- Hook: `features/admin/hooks/use-admin-loans.ts`

### Guard/Composability

- `AdminGuard` nuevo: similar a `CustomerGuard` pero verifica `role === 'ADMIN'`
- Las rutas admin usan `@UseGuards(JwtAuthGuard, AdminGuard)`
- Las rutas customer de loans usan `@UseGuards(JwtAuthGuard, CustomerGuard)` y filtran por `request.customer`
- `ponytail: AdminGuard es básico (role check). Agregar RBAC granular cuando haya más roles.`

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `apps/api/prisma/schema.prisma` | **Modified** | Nuevo modelo `LoanApplication` + relación con `Customer` y `LoanSimulation` |
| `apps/api/src/loans/` | **New** | Módulo completo con 4 capas, ~15 archivos |
| `apps/api/src/app.module.ts` | **Modified** | Importar `LoansModule` |
| `packages/shared/src/schemas/loan.schema.ts` | **New** | Zod schemas y tipos compartidos |
| `packages/shared/src/index.ts` | **Modified** | Exportar loan schemas |
| `packages/shared/src/types/customer.types.ts` | **Modified** | Agregar `LoanApplicationResponse` |
| `apps/web/features/loans/` | **New** | Componentes y hooks del portal |
| `apps/web/features/admin/` | **New** | Componentes y hooks admin |
| `apps/web/features/portal/components/portal-sidebar.tsx` | **Modified** | Agregar nav item "Mis Préstamos" |
| `apps/web/features/portal/components/amortization-table.tsx` | **Modified** | Agregar botón "Solicitar este préstamo" |
| `apps/web/app/portal/loans/` | **New** | Páginas del portal de préstamos |
| `apps/web/app/admin/loans/` | **New** | Páginas del admin de préstamos |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Migración de Prisma bloquea por datos existentes | Bajo | `simulationId` es nullable, `customerId` ya existe. `reviewerId` nullable. Agregar columna con `@default` o nullable siempre. |
| Customer aplica sin tener perfil completo (sin ingresos, sin documentos) | Med | Validar al crear: si no hay incomes registrados, no se puede crear solicitud (status PENDING se rechaza automáticamente con "datos insuficientes"). Mejor: permitir crear pero mostrar warning. |
| Race condition: dos admins revisan la misma solicitud | Bajo | Transición de estado atómica en Prisma (`updateMany` con `where: { id, status: 'PENDING' }`). Si ya fue tomada, el segundo recibe error. |
| Admin aprueba sin documentos verificados | Med | Validación en handler: si el customer no tiene documentos CI_FRONT + CI_BACK con status VERIFIED, rechazar approve con mensaje claro. |
| Cancelación en estado incorrecto | Bajo | State machine en dominio — `LoanApplication.cancel()` arroja error si status no es DRAFT o PENDING |
| Rate limiting en endpoints públicos no-auth | Bajo | Todos los endpoints requiren auth (JWT). Admin endpoints requieren ADMIN role. |

## Rollback Plan

1. **Prisma**: crear migración con `CREATE TABLE IF NOT EXISTS loan_applications`. Rollback: `DROP TABLE loan_applications` (sin datos críticos en MVP se puede dropear). Si ya hay datos, agregar columna `deleted_at` y hacer soft delete.
2. **Backend**: eliminar `LoansModule` de `app.module.ts`. Eliminar archivos del módulo.
3. **Frontend**: revertir sidebar, eliminar rutas `/portal/loans` y `/admin/loans`.
4. **Shared**: eliminar `loan.schema.ts` y revertir `index.ts`.
5. No hay cambios en endpoints existentes — todo es aditivo.

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Customer module | ✅ Exists | `Customer` entity, `CustomerRepository`, `CustomerGuard` |
| Simulation module | ✅ Exists | `LoanSimulation` model, `calculateLoan()` shared |
| Shared module | ✅ Exists | PrismaService, guards, decorators |
| JWT auth guards | ✅ Exists | `JwtAuthGuard`, `CurrentUser` decorator |
| Admin role | ✅ Exists | `Role` model con `name: 'ADMIN'`. Seed data ya debería tener un admin. |
| Zod schemas | ✅ Exists | Patrón establecido en `packages/shared/src/schemas/` |
| LoanCalculator | ✅ Exists | `calculateLoan()` en `apps/api/src/shared/loan-calculator.ts` |
| shadcn/ui components | ✅ Exists | Button, Card, Table, Badge, Dialog, Select, Textarea disponibles |

## Effort Estimate

| Area | Files | Estimated Lines | Notes |
|------|-------|----------------|-------|
| **Prisma schema** | 1 | +30 | Modelo + relaciones |
| **Shared schemas** | 2 | +50 | `loan.schema.ts` + tipos + export |
| **Backend: Domain** | 4 | +180 | Entity, Repository port, Errors, Value Objects |
| **Backend: Application** | 7 | +350 | Handlers (create, list, get, cancel, review, list-pending) |
| **Backend: Infrastructure** | 2 | +120 | Prisma repository + admin query impl |
| **Backend: Presentation** | 3 | +200 | Controller customer, controller admin, DTOs |
| **Backend: Module wiring** | 2 | +60 | `loans.module.ts`, `loans.tokens.ts`, `AdminGuard` |
| **Frontend: Portal** | 5 | +350 | Pages (list, detail), components, hook, sidebar |
| **Frontend: Admin** | 5 | +400 | Pages (list, review), components, hook |
| **Frontend: Simulator integration** | 1 | +20 | Botón "Solicitar" en amortization table |
| **Total** | **32** | **~1760** | Backend ~940, Frontend ~770, Shared ~50 |

- Backend: ~940 líneas (~54%)
- Frontend: ~770 líneas (~44%)
- Shared: ~50 líneas (~2%)

`ponytail: estimación lineal de ~1.8K líneas para MVP completo. Si se elimina admin panel (solo portal + endpoint), ~1.1K líneas.`
