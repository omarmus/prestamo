# Customer Loan Portal Specification

## Purpose

Define las vistas y operaciones que un cliente puede realizar sobre sus solicitudes de préstamo desde el portal web: listar sus solicitudes con indicadores de estado, ver el detalle de cada una con línea de tiempo, cancelar solicitudes en estados permitidos, y visualizar los documentos asociados.

## Requirements

### Requirement: List My Applications

El sistema DEBE exponer `GET /api/loans/applications` protegido con `JwtAuthGuard` + `CustomerGuard` que devuelva todas las solicitudes del customer autenticado, ordenadas por `createdAt` descendente (más recientes primero). La respuesta DEBE incluir por cada solicitud: `id`, `amount`, `termMonths`, `annualRate`, `monthlyPayment`, `purpose`, `status`, `riskScore`, `createdAt`, `updatedAt`.

#### Scenario: Customer lists own applications

- GIVEN un customer autenticado con 3 solicitudes (1 APPROVED, 1 PENDING, 1 DRAFT)
- WHEN `GET /api/loans/applications`
- THEN response status es `200 OK`
- AND `data` contiene 3 solicitudes
- AND la primera es la más reciente
- AND cada solicitud incluye `id`, `amount`, `status`, `createdAt`

#### Scenario: Customer with no applications

- GIVEN un customer autenticado sin ninguna solicitud
- WHEN `GET /api/loans/applications`
- THEN response status es `200 OK`
- AND `data` es un arreglo vacío `[]`

#### Scenario: Customer cannot see other customers' applications

- GIVEN dos customers (A y B), cada uno con 1 solicitud
- WHEN Customer A llama `GET /api/loans/applications`
- THEN `data` contiene SOLO la solicitud de Customer A

#### Scenario: Unauthenticated returns 401

- GIVEN no hay JWT access token
- WHEN `GET /api/loans/applications`
- THEN response status es `401 Unauthorized`

---

### Requirement: View Application Detail

El sistema DEBE exponer `GET /api/loans/applications/:id` protegido con `JwtAuthGuard` + `CustomerGuard` que devuelva el detalle de UNA solicitud del customer autenticado. DEBE incluir: `id`, `amount`, `termMonths`, `annualRate`, `monthlyPayment`, `totalInterest`, `totalPayment`, `purpose`, `status`, `riskScore`, `simulationId`, `reviewNotes`, `reviewedAt`, `createdAt`, `updatedAt`, y `timeline` con el historial de cambios de estado.

#### Scenario: Get application detail

- GIVEN un customer autenticado con una solicitud existente
- WHEN `GET /api/loans/applications/:id`
- THEN response status es `200 OK`
- AND el body incluye todos los campos del detalle
- AND `timeline` es un arreglo con al menos 1 entrada (la creación)
- AND cada entrada de timeline tiene `{ "status", "changedAt", "notes?" }`

#### Scenario: Cannot view another customer's application

- GIVEN un customer autenticado (Customer A)
- WHEN `GET /api/loans/applications/:id` con id de una solicitud de Customer B
- THEN response status es `404 Not Found`
- AND el error es genérico (no revela existencia de la solicitud de otro usuario)

#### Scenario: Application not found

- GIVEN un customer autenticado
- WHEN `GET /api/loans/applications/:id` con id inexistente
- THEN response status es `404 Not Found`

#### Scenario: Detail includes status badges on frontend

- GIVEN un customer viendo el detalle de su solicitud en `/portal/loans/:id`
- THEN el status se muestra como un badge con color semántico:
  - `DRAFT`: gris
  - `PENDING`: amarillo
  - `IN_REVIEW`: azul
  - `INFO_REQUESTED`: naranja
  - `APPROVED`: verde
  - `REJECTED`: rojo
  - `CANCELLED`: gris oscuro

---

### Requirement: Timeline Shows Status History

El sistema DEBE mantener y devolver un timeline de cambios de estado. Cada entrada DEBE incluir: `fromStatus`, `toStatus`, `changedAt`, `changedBy` (customer | admin), `notes` (opcional). El timeline DEBE devolverse como parte del detalle de la solicitud.

`ponytail: El timeline se puede derivar del `updatedAt` + `status` actual si no hay tabla de auditoría. Pero es mejor tener una tabla `LoanApplicationEvent` o usar el campo `timeline` como JSON en el mismo modelo. Para MVP, un campo JSON `timeline` en `LoanApplication` es suficiente.`

#### Scenario: Timeline shows complete history

- GIVEN una solicitud que pasó por DRAFT → PENDING → IN_REVIEW → INFO_REQUESTED → PENDING → IN_REVIEW → APPROVED
- WHEN el customer ve el detalle
- THEN `timeline` contiene 6 entradas
- AND la primera entrada es `{ "fromStatus": null, "toStatus": "DRAFT", "changedBy": "customer", "changedAt": "<creation date>" }`
- AND hay una entrada `{ "fromStatus": "DRAFT", "toStatus": "PENDING", "changedBy": "customer" }`
- AND hay una entrada `{ "fromStatus": "INFO_REQUESTED", "toStatus": "PENDING", "changedBy": "customer" }` (cliente respondió)
- AND la última entrada es `{ "fromStatus": "IN_REVIEW", "toStatus": "APPROVED", "changedBy": "admin" }`

---

### Requirement: Cancel Application (DRAFT or PENDING → CANCELLED)

El sistema DEBE exponer `DELETE /api/loans/applications/:id` protegido con `JwtAuthGuard` + `CustomerGuard` que permita al customer cancelar su propia solicitud. Solo DEBE ser posible cuando el estado actual es `DRAFT` o `PENDING`. Si la solicitud ya está en otro estado (`IN_REVIEW`, `INFO_REQUESTED`, `APPROVED`, `REJECTED`, `CANCELLED`), DEBE devolver error.

#### Scenario: Cancel DRAFT application

- GIVEN un customer autenticado con una solicitud en estado `DRAFT`
- WHEN `DELETE /api/loans/applications/:id`
- THEN response status es `200 OK`
- AND `status` es `"CANCELLED"`

#### Scenario: Cancel PENDING application

- GIVEN un customer autenticado con una solicitud en estado `PENDING`
- WHEN `DELETE /api/loans/applications/:id`
- THEN response status es `200 OK`
- AND `status` es `"CANCELLED"`

#### Scenario: Cannot cancel IN_REVIEW application

- GIVEN un customer autenticado con una solicitud en estado `IN_REVIEW`
- WHEN `DELETE /api/loans/applications/:id`
- THEN response status es `409 Conflict`
- AND el error indica que no se puede cancelar una solicitud que está siendo revisada

#### Scenario: Cannot cancel APPROVED application

- GIVEN un customer autenticado con una solicitud en estado `APPROVED`
- WHEN `DELETE /api/loans/applications/:id`
- THEN response status es `409 Conflict`

#### Scenario: Cannot cancel already CANCELLED application

- GIVEN un customer autenticado con una solicitud en estado `CANCELLED`
- WHEN `DELETE /api/loans/applications/:id`
- THEN response status es `409 Conflict`

#### Scenario: Cannot cancel another customer's application

- GIVEN Customer A autenticado
- WHEN `DELETE /api/loans/applications/:id` con id de una solicitud de Customer B
- THEN response status es `404 Not Found`

#### Scenario: Customer sees cancel button only when allowed

- GIVEN un customer en la página de detalle de su solicitud
- WHEN la solicitud está en `DRAFT` o `PENDING`
- THEN la UI muestra un botón "Cancelar solicitud" con confirmación
- WHEN la solicitud está en `IN_REVIEW`, `APPROVED`, `REJECTED` o `CANCELLED`
- THEN la UI NO muestra el botón de cancelar

---

### Requirement: Documents Sub-section on Detail View

La página de detalle de solicitud (`/portal/loans/[id]`) DEBE incluir una sub-sección "Documentos" que muestre los documentos que el cliente ha subido asociados a su perfil, con su estado de verificación. NO se suben documentos por solicitud — los documentos son a nivel de customer y se reutilizan entre solicitudes.

#### Scenario: Detail page shows documents section

- GIVEN un customer con 3 documentos subidos (CI_FRONT, CI_BACK, SELFIE)
- WHEN ve el detalle de su solicitud en `/portal/loans/:id`
- THEN ve una sección "Documentos" con 3 filas
- AND cada fila muestra: tipo de documento, nombre de archivo, estado (VERIFICADO/PENDIENTE/RECHAZADO)
- AND los documentos con estado `VERIFIED` tienen un icono verde de check
- AND los documentos con estado `PENDING` tienen un icono amarillo de reloj
- AND los documentos con estado `REJECTED` tienen un icono rojo de advertencia

#### Scenario: Documents section is empty state

- GIVEN un customer sin documentos subidos
- WHEN ve el detalle de su solicitud
- THEN la sección "Documentos" muestra "Aún no has subido documentos"
- AND un enlace a la página de subida de documentos

---

### Requirement: Frontend Portal Sidebar Navigation

El sistema DEBE agregar un ítem "Mis Préstamos" con icono `CreditCard` (de `lucide-react`) en la barra lateral del portal (`PortalSidebar`), entre los ítems existentes.

#### Scenario: Sidebar shows loans link

- GIVEN un customer autenticado en el portal
- WHEN la barra lateral se renderiza
- THEN existe un ítem "Mis Préstamos" con icono de tarjeta de crédito
- AND al hacer clic navega a `/portal/loans`
- AND el ítem se marca como activo cuando la ruta actual empieza con `/portal/loans`

---

### Requirement: Frontend Pages Structure

El frontend DEBE tener las siguientes páginas bajo la ruta `/portal/loans/`:

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/portal/loans` | `LoanListPage` | Lista de solicitudes del cliente con status badges |
| `/portal/loans/new` | `LoanFormPage` | Formulario de creación (pre-poblado si viene con `simulationId`) |
| `/portal/loans/[id]` | `LoanDetailPage` | Detalle de una solicitud con timeline y documentos |

#### Scenario: Loan list page shows status badges

- GIVEN el customer navega a `/portal/loans`
- WHEN la página carga exitosamente
- THEN se muestra una tabla con columnas: Monto, Plazo, Cuota Mensual, Propósito, Estado, Fecha
- AND cada fila tiene un badge de estado con color semántico
- AND al hacer clic en una fila navega a `/portal/loans/[id]`

#### Scenario: Loan form page pre-populated from simulation

- GIVEN el customer navega a `/portal/loans/new?simulationId=<uuid>`
- WHEN la página carga
- THEN los campos `amount`, `termMonths`, `annualRate` están pre-poblados y deshabilitados (read-only)
- AND el campo `purpose` está habilitado para selección
- AND el botón "Enviar solicitud" crea la solicitud con `simulationId`

#### Scenario: Loan form page for direct creation

- GIVEN el customer navega a `/portal/loans/new` sin `simulationId`
- WHEN la página carga
- THEN los campos `amount`, `termMonths`, `annualRate` están vacíos y habilitados
- AND el botón "Enviar solicitud" muestra loading state mientras se procesa

---

### Requirement: Loan Form Validation Mirrors Backend

El formulario de creación en el frontend DEBE reutilizar los schemas de Zod desde `packages/shared` para validación del lado del cliente. Los mismos rangos y reglas DEBEN aplicarse antes de enviar al backend.

#### Scenario: Frontend prevents invalid amount before submit

- GIVEN el formulario de creación de préstamo
- WHEN el customer ingresa `amount: 600000` (excede máximo)
- THEN se muestra un error en el campo "El monto máximo es 500,000 BOB"
- AND el botón "Enviar solicitud" está deshabilitado

---

### Requirement: Shared Hook for Loan Operations

El frontend DEBE exportar un hook `useLoans()` desde `features/loans/hooks/use-loans.ts` con los siguientes métodos:
- `create(input)` → crea una solicitud
- `list()` → lista las solicitudes del customer
- `get(id)` → obtiene detalle de una solicitud
- `cancel(id)` → cancela una solicitud
- `loading`, `error` estados reactivos

#### Scenario: Hook manages loading state

- GIVEN el hook `useLoans()`
- WHEN `list()` es llamado
- THEN `loading` es `true` durante la petición
- AND `loading` es `false` cuando la petición termina
- AND `error` es `null` si la petición fue exitosa
- AND `data` contiene el arreglo de solicitudes
