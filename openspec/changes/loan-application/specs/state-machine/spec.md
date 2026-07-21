# Loan Application State Machine Specification

## Purpose

Define la máquina de estados de `LoanApplication` con sus 7 estados, todas las transiciones válidas e inválidas, los actores que pueden disparar cada transición, y la fórmula de scoring DTI utilizada en la aprobación.

## States

El sistema DEBE implementar exactamente 7 estados para `LoanApplication.status`:

| Estado | Descripción | Actor que lo crea |
|--------|-------------|-------------------|
| `DRAFT` | Solicitud creada pero NO enviada. Visible solo para el cliente. | Cliente (creación) |
| `PENDING` | Solicitud enviada, esperando ser asignada a un asesor. Visible para admins. | Cliente (submit) |
| `IN_REVIEW` | Solicitud siendo revisada activamente por un asesor. | Admin (assign) |
| `INFO_REQUESTED` | Admin solicitó información adicional. El cliente debe responder. | Admin (request-info) |
| `APPROVED` | Solicitud aprobada. Estado terminal. | Admin (approve) |
| `REJECTED` | Solicitud rechazada. Estado terminal. | Admin (reject) |
| `CANCELLED` | Solicitud cancelada por el cliente. Estado terminal. | Cliente (cancel) |

### Requirement: All Status Values Are Immutable Strings

Los valores de `status` DEBEN ser strings y DEBEN almacenarse en el campo `LoanApplication.status` en la base de datos. El enum `LoanStatusEnum` en `packages/shared` DEBE contener exactamente estos 7 valores.

#### Scenario: LoanStatusEnum has all 7 values

- GIVEN `LoanStatusEnum` exportado desde `packages/shared`
- WHEN se inspeccionan los valores
- THEN los valores son `['DRAFT', 'PENDING', 'IN_REVIEW', 'INFO_REQUESTED', 'APPROVED', 'REJECTED', 'CANCELLED']`

---

## Valid Transitions

### Transition: DRAFT → PENDING

**Actor**: Cliente (submit)
**Endpoint**: `POST /api/loans/applications` con `submit: true` (o endpoint separado de submit)
**Pre-condiciones**:
- El cliente DEBE tener al menos un `CustomerIncome` registrado (cualquier frecuencia).
**Post-condiciones**:
- `status` = `PENDING`
- La solicitud aparece en la lista de pendientes del admin.

#### Scenario: Submit from DRAFT to PENDING with incomes

- GIVEN una solicitud en `DRAFT` con un customer que tiene al menos 1 ingreso registrado
- WHEN el cliente envía la solicitud (submit)
- THEN `status` cambia a `PENDING`

#### Scenario: Submit without incomes is rejected

- GIVEN una solicitud en `DRAFT` con un customer que NO tiene ingresos registrados
- WHEN el cliente intenta enviar la solicitud
- THEN el sistema rechaza la transición con error `422 Unprocessable Entity`
- AND `status` permanece en `DRAFT`
- AND el error indica: "Debes registrar al menos un ingreso antes de enviar tu solicitud"

---

### Transition: DRAFT → CANCELLED

**Actor**: Cliente (cancel)
**Endpoint**: `DELETE /api/loans/applications/:id`
**Pre-condiciones**: Ninguna (el cliente siempre puede cancelar un borrador)
**Post-condiciones**:
- `status` = `CANCELLED`
- `reviewNotes` se actualiza con "Cancelado por el cliente"

#### Scenario: Cancel DRAFT application

- GIVEN una solicitud en `DRAFT`
- WHEN el cliente cancela
- THEN `status` es `CANCELLED`

---

### Transition: PENDING → IN_REVIEW

**Actor**: Admin (assign)
**Endpoint**: `POST /api/admin/loans/applications/:id/review`
**Pre-condiciones**:
- La solicitud DEBE estar en `PENDING`.
- `reviewerId` DEBE estar vacío (nadie más lo ha tomado).
**Post-condiciones**:
- `reviewerId` = id del admin autenticado.
- `status` = `IN_REVIEW`.

#### Scenario: Assign application to self

- GIVEN una solicitud en `PENDING` sin `reviewerId`
- WHEN un admin llama al endpoint de review
- THEN `reviewerId` se asigna al admin
- AND `status` cambia a `IN_REVIEW`

#### Scenario: Race condition - same application assigned twice

- GIVEN una solicitud en `PENDING`
- WHEN Admin A la asigna (status → `IN_REVIEW`)
- AND Admin B intenta asignar la misma solicitud
- THEN Admin B recibe `409 Conflict`
- AND `reviewerId` es el de Admin A

---

### Transition: PENDING → CANCELLED

**Actor**: Cliente (cancel)
**Endpoint**: `DELETE /api/loans/applications/:id`
**Pre-condiciones**:
- La solicitud DEBE estar en `PENDING`.
- `CustomerGuard` verifica que la solicitud pertenezca al cliente autenticado.
**Post-condiciones**:
- `status` = `CANCELLED`.

#### Scenario: Cancel PENDING application

- GIVEN una solicitud en `PENDING`
- WHEN el cliente cancela
- THEN `status` es `CANCELLED`

---

### Transition: IN_REVIEW → APPROVED

**Actor**: Admin (approve)
**Endpoint**: `POST /api/admin/loans/applications/:id/approve`
**Pre-condiciones**:
- La solicitud DEBE estar en `IN_REVIEW`.
- `reviewerId` DEBE coincidir con el admin autenticado.
- El customer DEBE tener `CI_FRONT` y `CI_BACK` con status `VERIFIED`.
- El customer DEBE tener al menos un ingreso registrado O `Customer.monthlyIncome` no nulo.
**Post-condiciones**:
- `riskScore` = `LOW` | `MEDIUM` | `HIGH` (según DTI).
- `reviewedAt` = fecha actual.
- `status` = `APPROVED`.

#### Scenario: Approve low-risk application

- GIVEN una solicitud en `IN_REVIEW` con `reviewerId` del admin
- AND CI_FRONT + CI_BACK en VERIFIED
- AND `totalMonthlyIncome` = 10,000 y `monthlyPayment` = 2,500 (DTI = 0.25)
- WHEN admin aprueba
- THEN `status` = `APPROVED`
- AND `riskScore` = `"LOW"`

#### Scenario: Approve medium-risk application

- GIVEN DTI = 0.40 (entre 0.30 y 0.50)
- WHEN admin aprueba
- THEN `riskScore` = `"MEDIUM"`

#### Scenario: Attempt to approve high-risk (DTI > 0.50) is blocked

- GIVEN DTI = 0.60
- WHEN admin intenta aprobar
- THEN respuesta es `422 Unprocessable Entity`
- AND `riskScore` NO se calcula (la transición falla antes)

---

### Transition: IN_REVIEW → REJECTED

**Actor**: Admin (reject)
**Endpoint**: `POST /api/admin/loans/applications/:id/reject`
**Pre-condiciones**:
- La solicitud DEBE estar en `IN_REVIEW`.
- `reviewerId` DEBE coincidir con el admin autenticado.
- `reason` en body DEBE ser un string no vacío (máx. 1000 caracteres).
**Post-condiciones**:
- `reviewNotes` = `reason`.
- `reviewedAt` = fecha actual.
- `status` = `REJECTED`.

#### Scenario: Reject with reason

- GIVEN una solicitud en `IN_REVIEW`
- WHEN admin rechaza con `reason: "Historial crediticio insuficiente"`
- THEN `status` es `REJECTED`
- AND `reviewNotes` es `"Historial crediticio insuficiente"`
- AND `reviewedAt` es una fecha no nula

---

### Transition: IN_REVIEW → INFO_REQUESTED

**Actor**: Admin (request-info)
**Endpoint**: `POST /api/admin/loans/applications/:id/request-info`
**Pre-condiciones**:
- La solicitud DEBE estar en `IN_REVIEW`.
- `reviewerId` DEBE coincidir con el admin autenticado.
- `message` en body DEBE ser un string no vacío (máx. 1000 caracteres).
**Post-condiciones**:
- `reviewNotes` = `message`.
- `status` = `INFO_REQUESTED`.

#### Scenario: Request info during review

- GIVEN una solicitud en `IN_REVIEW`
- WHEN admin solicita más info con `message: "Sube tu recibo de sueldo"`
- THEN `status` es `INFO_REQUESTED`
- AND `reviewNotes` es `"Sube tu recibo de sueldo"`

---

### Transition: INFO_REQUESTED → PENDING

**Actor**: Cliente (responde subiendo documentos o actualizando perfil)
**Trigger**: El cliente sube el documento solicitado o actualiza su perfil. No hay un endpoint específico — la transición ocurre cuando el cliente notifica que completó lo solicitado.

`ponytail: Para MVP, la transición INFO_REQUESTED → PENDING se hace manualmente desde el portal con un botón "Listo, revisar de nuevo". En el futuro se puede automatizar cuando se sube el documento específico.`

**Pre-condiciones**:
- La solicitud DEBE estar en `INFO_REQUESTED`.
- El cliente DEBE estar autenticado y ser el dueño de la solicitud.
**Post-condiciones**:
- `status` = `PENDING`.
- `reviewerId` y `reviewNotes` se mantienen (el review continúa con el mismo admin cuando se re-asigna).

#### Scenario: Customer responds to info request

- GIVEN una solicitud en `INFO_REQUESTED`
- WHEN el cliente hace clic en "Listo, revisar de nuevo"
- THEN `status` es `PENDING`
- AND `reviewerId` NO se modifica (se conserva para que el mismo admin retome)
- AND la solicitud aparece en la lista de pendientes del admin

---

## Invalid Transitions (Domain Errors)

CUALQUIER transición no listada en la sección anterior DEBE arrojar un `LoanStatusTransitionError` con código de error específico. El sistema DEBE implementar una función `canTransition(from: LoanStatus, to: LoanStatus): boolean` en el dominio que valide todas las transiciones.

### Terminal States

`APPROVED`, `REJECTED` y `CANCELLED` son estados terminales. NO DEBE ser posible transicionar DESDE ninguno de estos estados a OTRO estado.

#### Scenario: Cannot transition from APPROVED

- GIVEN una solicitud en `APPROVED`
- WHEN se intenta cualquier transición (cancel, approve, reject, request-info, submit, review)
- THEN el sistema arroja `LoanStatusTransitionError`
- AND el error indica: "No se puede cambiar el estado de una solicitud APPROVED"

#### Scenario: Cannot transition from REJECTED

- GIVEN una solicitud en `REJECTED`
- WHEN se intenta cualquier transición
- THEN arroja `LoanStatusTransitionError`
- AND el error indica: "No se puede cambiar el estado de una solicitud REJECTED"

#### Scenario: Cannot transition from CANCELLED

- GIVEN una solicitud en `CANCELLED`
- WHEN se intenta cualquier transición
- THEN arroja `LoanStatusTransitionError`

### Invalid: DRAFT → APPROVED (skip review)

#### Scenario: Cannot approve a DRAFT application

- GIVEN una solicitud en `DRAFT`
- WHEN el admin intenta aprobar directamente
- THEN el sistema arroja `LoanStatusTransitionError`
- AND el error indica que la solicitud debe estar en `IN_REVIEW` para ser aprobada

### Invalid: PENDING → APPROVED (skip assign)

#### Scenario: Cannot approve a PENDING application without assigning first

- GIVEN una solicitud en `PENDING`
- WHEN el admin intenta aprobar directamente
- THEN el sistema arroja `LoanStatusTransitionError`

### Invalid: IN_REVIEW → CANCELLED by customer

#### Scenario: Customer cannot cancel an application in review

- GIVEN una solicitud en `IN_REVIEW`
- WHEN el cliente intenta cancelar
- THEN el sistema arroja `LoanStatusTransitionError`
- AND el error indica que no se puede cancelar una solicitud en revisión

### Invalid: DRAFT → INFO_REQUESTED (admin cannot request info on draft)

#### Scenario: Admin cannot request info on DRAFT

- GIVEN una solicitud en `DRAFT`
- WHEN el admin intenta request-info
- THEN arroja `LoanStatusTransitionError`

### Invalid: APPROVED → REJECTED (change mind)

#### Scenario: Admin cannot reject an already approved application

- GIVEN una solicitud en `APPROVED`
- WHEN el admin intenta rechazar
- THEN arroja `LoanStatusTransitionError`

---

## Transition Matrix (Complete)

La siguiente matriz resume TODAS las transiciones válidas:

| From ↓ \ To → | DRAFT | PENDING | IN_REVIEW | INFO_REQUESTED | APPROVED | REJECTED | CANCELLED |
|---------------|-------|---------|-----------|----------------|----------|----------|-----------|
| **DRAFT** | — | ✅ Cliente (submit) | ❌ | ❌ | ❌ | ❌ | ✅ Cliente (cancel) |
| **PENDING** | ❌ | — | ✅ Admin (assign) | ❌ | ❌ | ❌ | ✅ Cliente (cancel) |
| **IN_REVIEW** | ❌ | ❌ | — | ✅ Admin (request-info) | ✅ Admin (approve) | ✅ Admin (reject) | ❌ |
| **INFO_REQUESTED** | ❌ | ✅ Cliente (respond) | ❌ | — | ❌ | ❌ | ❌ |
| **APPROVED** | ❌ | ❌ | ❌ | ❌ | — | ❌ | ❌ |
| **REJECTED** | ❌ | ❌ | ❌ | ❌ | ❌ | — | ❌ |
| **CANCELLED** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | — |

**Total**: 7 estados, 8 transiciones válidas.

---

## DTI Risk Scoring Formula

### Definition

El Debt-to-Income ratio (DTI) se calcula al momento de aprobar la solicitud:

```
DTI = monthlyPayment / totalMonthlyIncome
```

Donde:
- `monthlyPayment`: cuota mensual del préstamo solicitado (del campo `LoanApplication.monthlyPayment`).
- `totalMonthlyIncome`: suma de todos los ingresos mensuales del customer.

### Income Normalization

Cada ingreso (`CustomerIncome`) se normaliza a valor mensual según su frecuencia:

| Frequency | Multiplicador |
|-----------|--------------|
| `MONTHLY` | × 1 |
| `BIWEEKLY` | × 2 |
| `WEEKLY` | × 4.33 |
| `YEARLY` | ÷ 12 |

```
normalizedAmount = amount * multiplier
totalMonthlyIncome = SUM(normalizedAmount for all incomes)
```

Si el customer NO tiene registros `CustomerIncome`, el sistema DEBE usar `Customer.monthlyIncome` como `totalMonthlyIncome`.

Si ambos son nulos (sin incomes y sin `monthlyIncome` en Customer), el sistema DEBE rechazar la aprobación con error "El cliente no tiene ingresos registrados".

### Risk Score Assignment

| DTI Range | Risk Score | Comportamiento |
|-----------|-----------|----------------|
| DTI ≤ 0.30 | `LOW` | Aprobación permitida. Documentos OK verificados. |
| 0.30 < DTI ≤ 0.50 | `MEDIUM` | Aprobación permitida. El admin puede aprobar bajo su criterio. |
| DTI > 0.50 | `HIGH` | Aprobación RECHAZADA automáticamente con error `422`. El admin NO puede override sin un flag explícito. |

#### Scenario: DTI calculation with multiple incomes

- GIVEN un customer con 2 incomes:
  - SALARY: 5,000 MONTHLY → normalized = 5,000
  - RENT: 1,500 MONTHLY → normalized = 1,500
  - `totalMonthlyIncome` = 6,500
- AND `monthlyPayment` = 1,950
- WHEN se calcula DTI
- THEN DTI = 1,950 / 6,500 = 0.30
- AND `riskScore` = `"LOW"`

#### Scenario: DTI with mixed frequencies

- GIVEN un customer con 2 incomes:
  - BUSINESS: 3,000 BIWEEKLY → normalized = 6,000
  - COMMISSION: 24,000 YEARLY → normalized = 2,000
  - `totalMonthlyIncome` = 8,000
- AND `monthlyPayment` = 2,400
- WHEN se calcula DTI
- THEN DTI = 2,400 / 8,000 = 0.30

#### Scenario: DTI edge case at 0.30 boundary

- GIVEN `monthlyPayment` = 3,000 y `totalMonthlyIncome` = 10,000
- WHEN se calcula DTI
- THEN DTI = 0.30
- AND `riskScore` = `"LOW"` (≤ 0.30 es LOW)

#### Scenario: DTI edge case at 0.50 boundary

- GIVEN `monthlyPayment` = 5,000 y `totalMonthlyIncome` = 10,000
- WHEN se calcula DTI
- THEN DTI = 0.50
- AND `riskScore` = `"MEDIUM"` (≤ 0.50 es MEDIUM, no HIGH)

#### Scenario: DTI precision

- GIVEN `monthlyPayment` = 888.49 y `totalMonthlyIncome` = 5,000
- WHEN se calcula DTI
- THEN DTI = 888.49 / 5,000 = 0.177698 ≈ 0.18 (redondeado a 2 decimales)
- AND `riskScore` = `"LOW"`

---

## Domain Entity: State Machine Implementation

### Requirement: LoanApplication Entity Guards Transitions

La entidad `LoanApplication` en `apps/api/src/loans/domain/loan-application.entity.ts` DEBE encapsular la máquina de estados. Cada método de transición DEBE:
1. Validar que la transición es válida desde el estado actual.
2. Validar pre-condiciones específicas de la transición.
3. Mutar el estado.
4. NO tener efectos secundarios fuera de la entidad (persistencia, notificaciones, etc.).

#### Scenario: Entity enforces valid transitions

- GIVEN una entidad `LoanApplication` con status `DRAFT`
- WHEN se llama `entity.approve()`
- THEN arroja `LoanStatusTransitionError`
- AND el status NO cambia

#### Scenario: Entity enforces actor validation at application layer

- GIVEN una entidad `LoanApplication` con status `IN_REVIEW` y `reviewerId: "admin-1"`
- WHEN se llama `entity.approve("admin-2")` (diferente admin)
- THEN arroja `LoanStatusTransitionError`
- AND el mensaje indica que solo el reviewer asignado puede aprobar

### Transition Methods on Entity

La entidad DEBE exponer los siguientes métodos de transición:

| Método | Transición | Parámetros |
|--------|-----------|------------|
| `submit()` | DRAFT → PENDING | — |
| `assignReviewer(reviewerId)` | PENDING → IN_REVIEW | `reviewerId: string` |
| `approve(reviewerId, riskScore)` | IN_REVIEW → APPROVED | `reviewerId: string`, `riskScore: RiskScore` |
| `reject(reviewerId, reason)` | IN_REVIEW → REJECTED | `reviewerId: string`, `reason: string` |
| `requestInfo(reviewerId, message)` | IN_REVIEW → INFO_REQUESTED | `reviewerId: string`, `message: string` |
| `respondToInfo()` | INFO_REQUESTED → PENDING | — |
| `cancel()` | DRAFT/PENDING → CANCELLED | — |

---

## Domain Errors

El sistema DEBE definir los siguientes errores de dominio en `apps/api/src/loans/domain/loan-application.errors.ts`:

| Error | Extends | Se usa cuando |
|-------|---------|---------------|
| `LoanStatusTransitionError` | `DomainError` | Transición de estado inválida |
| `LoanNotFoundError` | `DomainError` | Solicitud no encontrada |
| `LoanNotOwnedByCustomerError` | `DomainError` | Cliente intenta acceder solicitud de otro |
| `InsufficientIncomeError` | `DomainError` | Cliente sin ingresos registrados al submit/aprobar |
| `MissingDocumentsError` | `DomainError` | CI_FRONT + CI_BACK no están VERIFIED |
| `HighRiskLoanError` | `DomainError` | DTI > 0.50 impide aprobación automática |

### Error Response Format

Todos los errores de dominio DEBEN traducirse a respuestas HTTP con el siguiente formato:

```json
{
  "statusCode": 409,
  "error": "Conflict",
  "message": "No se puede cambiar el estado de APPROVED a CANCELLED",
  "code": "LOAN_STATUS_TRANSITION_ERROR"
}
```

#### Scenario: Error response includes domain code

- GIVEN un `LoanStatusTransitionError` con `code: "LOAN_STATUS_TRANSITION_ERROR"`
- WHEN se lanza desde el handler
- THEN la respuesta HTTP incluye el campo `code` en el body
- AND el status HTTP es `409 Conflict` (para transiciones inválidas) o `422 Unprocessable Entity` (para pre-condiciones de negocio)
