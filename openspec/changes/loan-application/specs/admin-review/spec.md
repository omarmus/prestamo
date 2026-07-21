# Admin Loan Review Specification

## Purpose

Define las operaciones que un administrador (asesor de crédito) puede realizar sobre las solicitudes de préstamo: listar solicitudes pendientes, ver detalle completo del cliente, asignarse una solicitud para revisión, aprobar con evaluación de riesgo DTI, rechazar con motivo, y solicitar información adicional al cliente.

## Requirements

### Requirement: List Pending Applications with Filters

El sistema DEBE exponer `GET /api/admin/loans/applications` protegido con `JwtAuthGuard` + `AdminGuard` que devuelva una lista paginada de solicitudes. DEBE soportar los siguientes filtros como query parameters:
- `status`: filtrar por estado (`PENDING`, `IN_REVIEW`, `INFO_REQUESTED`, `APPROVED`, `REJECTED`, `CANCELLED`). Si no se especifica, DEBE devolver SOLO las que están `PENDING` o `IN_REVIEW` (las que requieren acción).
- `page`: número de página (default: 1).
- `limit`: items por página (default: 20, max: 100).
- `dateFrom` / `dateTo`: filtrar por rango de `createdAt` (ISO date string).
- `search`: búsqueda textual por nombre del customer o número de documento.

#### Scenario: List pending applications (default filter)

- GIVEN un admin autenticado
- AND existen 5 solicitudes en `PENDING`, 2 en `IN_REVIEW`, 3 en `APPROVED`
- WHEN `GET /api/admin/loans/applications` sin filtros
- THEN response status es `200 OK`
- AND `data` contiene 7 solicitudes (5 PENDING + 2 IN_REVIEW)
- AND `pagination` contiene `{ "page": 1, "limit": 20, "total": 7, "totalPages": 1 }`

#### Scenario: Filter by specific status

- GIVEN un admin autenticado
- WHEN `GET /api/admin/loans/applications?status=APPROVED`
- THEN `data` contiene solo solicitudes con `status: "APPROVED"`

#### Scenario: Filter by date range

- GIVEN solicitudes creadas en diferentes fechas
- WHEN `GET /api/admin/loans/applications?dateFrom=2026-01-01&dateTo=2026-06-30`
- THEN `data` contiene solo solicitudes creadas entre esas fechas

#### Scenario: Search by customer name

- GIVEN una solicitud del customer "Juan Perez"
- WHEN `GET /api/admin/loans/applications?search=juan`
- THEN `data` contiene la solicitud de Juan Perez
- AND la respuesta incluye `customer.name` o similar para identificar

#### Scenario: Pagination with limit

- GIVEN 50 solicitudes pendientes
- WHEN `GET /api/admin/loans/applications?page=2&limit=10`
- THEN response status es `200 OK`
- AND `data` contiene 10 items
- AND `pagination.page` es 2
- AND `pagination.totalPages` es 5

#### Scenario: Invalid page parameter

- GIVEN un admin autenticado
- WHEN `GET /api/admin/loans/applications?page=0`
- THEN response status es `400 Bad Request`

#### Scenario: Limit exceeds maximum

- GIVEN un admin autenticado
- WHEN `GET /api/admin/loans/applications?limit=200`
- THEN response status es `400 Bad Request`
- AND el error indica que `limit` máximo es 100

#### Scenario: Unauthenticated request returns 401

- GIVEN no hay JWT token
- WHEN `GET /api/admin/loans/applications`
- THEN response status es `401 Unauthorized`

#### Scenario: Non-admin user returns 403

- GIVEN un customer autenticado (rol USER, no ADMIN)
- WHEN `GET /api/admin/loans/applications`
- THEN response status es `403 Forbidden`

---

### Requirement: View Application Detail with Customer Data

El sistema DEBE exponer `GET /api/admin/loans/applications/:id` protegido con `JwtAuthGuard` + `AdminGuard` que devuelva el detalle completo de una solicitud incluyendo:
- Datos de la solicitud (`amount`, `termMonths`, `annualRate`, `monthlyPayment`, `totalInterest`, `totalPayment`, `purpose`, `status`, `riskScore`, `createdAt`)
- Datos del perfil del cliente (`firstName`, `lastName`, `documentType`, `documentNumber`, `status`, `kycStatus`)
- Direcciones del cliente
- Teléfonos del cliente
- Empleo del cliente
- Ingresos del cliente (con `amount` convertido a mensual)
- Cuentas bancarias del cliente
- Documentos subidos (con `type`, `status`, `fileName`)
- Historial de simulaciones del cliente
- Historial de cambios de estado (timeline)

#### Scenario: Get application detail with full customer data

- GIVEN un admin autenticado
- AND existe una solicitud con id válido
- WHEN `GET /api/admin/loans/applications/:id`
- THEN response status es `200 OK`
- AND el body contiene `{ "application": {...}, "customer": {...}, "documents": [...], "incomes": [...], "timeline": [...] }`
- AND `customer` incluye `firstName`, `lastName`, `documentNumber`, `status`, `kycStatus`
- AND `documents` incluye cada documento con `type`, `status`, `fileName`
- AND `incomes` incluye cada ingreso con `source`, `amount`, `frequency`

#### Scenario: Application not found

- GIVEN un admin autenticado
- WHEN `GET /api/admin/loans/applications/:id` con id inexistente
- THEN response status es `404 Not Found`

#### Scenario: Customer data includes normalized monthly income

- GIVEN una solicitud con un customer que tiene incomes
- WHEN `GET /api/admin/loans/applications/:id`
- THEN `incomes[].monthlyAmount` es calculado: `MONTHLY` = amount, `BIWEEKLY` = amount × 2, `WEEKLY` = amount × 4.33, `YEARLY` = amount / 12
- AND `totalMonthlyIncome` está presente como la suma de todos los `monthlyAmount`

---

### Requirement: Assign and Start Review (PENDING → IN_REVIEW)

El sistema DEBE exponer `POST /api/admin/loans/applications/:id/review` protegido con `JwtAuthGuard` + `AdminGuard` que:
1. Asigna `reviewerId` al admin autenticado.
2. Cambia el estado de la solicitud de `PENDING` a `IN_REVIEW`.
3. Si la solicitud NO está en `PENDING`, DEBE rechazar la operación.

#### Scenario: Successfully assign and start review

- GIVEN un admin autenticado
- AND una solicitud en estado `PENDING`
- WHEN `POST /api/admin/loans/applications/:id/review`
- THEN response status es `200 OK`
- AND `status` es `"IN_REVIEW"`
- AND `reviewerId` es el id del admin autenticado

#### Scenario: Cannot review application not in PENDING

- GIVEN un admin autenticado
- AND una solicitud en estado `APPROVED`
- WHEN `POST /api/admin/loans/applications/:id/review`
- THEN response status es `409 Conflict`
- AND el error indica que la solicitud no está en estado `PENDING`

#### Scenario: Race condition - two admins try to review same application

- GIVEN dos admins (Admin A y Admin B)
- AND una solicitud en estado `PENDING`
- WHEN Admin A llama `POST /api/admin/loans/applications/:id/review` y el estado cambia a `IN_REVIEW`
- AND Admin B llama al mismo endpoint inmediatamente después
- THEN la respuesta de Admin B es `409 Conflict`
- AND el error indica que la solicitud ya está siendo revisada por otro asesor
- AND `reviewerId` queda como el id de Admin A

`ponytail: La actualización atómica con Prisma `updateMany({ where: { id, status: 'PENDING' } })` previene la race condition. Si `count === 0`, el segundo admin recibe 409.`

---

### Requirement: Approve Application with DTI Assessment

El sistema DEBE exponer `POST /api/admin/loans/applications/:id/approve` protegido con `JwtAuthGuard` + `AdminGuard` que:
1. Verifica que la solicitud esté en estado `IN_REVIEW`.
2. Calcula el ratio DTI (`monthlyPayment / totalMonthlyIncome`).
3. Asigna `riskScore`: `LOW` si DTI ≤ 0.3, `MEDIUM` si DTI ≤ 0.5, `HIGH` si DTI > 0.5.
4. Verifica que el cliente tenga documentos mínimos requeridos (CI_FRONT + CI_BACK con status `VERIFIED`).
5. Cambia el estado a `APPROVED`.
6. Guarda `reviewNotes` si se proveen.
7. Guarda `reviewedAt` con la fecha actual.

#### Scenario: Approve low-risk application

- GIVEN un admin autenticado
- AND una solicitud en estado `IN_REVIEW` con el admin como `reviewerId`
- AND el customer tiene CI_FRONT y CI_BACK en estado `VERIFIED`
- AND el customer tiene incomes que suman 10,000 BOB/mes
- AND el `monthlyPayment` de la solicitud es 2,500 BOB (DTI = 0.25)
- WHEN `POST /api/admin/loans/applications/:id/approve` con body `{ "notes": "Cliente cumple perfil" }`
- THEN response status es `200 OK`
- AND `status` es `"APPROVED"`
- AND `riskScore` es `"LOW"`
- AND `reviewNotes` es `"Cliente cumple perfil"`
- AND `reviewedAt` es una fecha no nula

#### Scenario: Approve medium-risk application

- GIVEN una solicitud en `IN_REVIEW` con DTI = 0.40
- WHEN `POST /api/admin/loans/applications/:id/approve`
- THEN `riskScore` es `"MEDIUM"`
- AND la aprobación es exitosa (no hay bloqueo automático para MEDIUM)

#### Scenario: Reject when DTI exceeds 0.50

- GIVEN una solicitud en `IN_REVIEW` con DTI = 0.60
- WHEN `POST /api/admin/loans/applications/:id/approve`
- THEN response status es `422 Unprocessable Entity`
- AND el error indica que el DTI es muy alto (rechazo recomendado)
- AND `riskScore` es `"HIGH"`
- AND `status` NO cambia (sigue `IN_REVIEW`)

`ponytail: DTI > 0.50 es rechazo recomendado pero NO automático. El admin puede override con un flag explícito. Esto se agrega cuando haya un caso de negocio que lo requiera.`

#### Scenario: Cannot approve without verified CI documents

- GIVEN una solicitud en `IN_REVIEW`
- AND el customer tiene CI_FRONT pero en estado `PENDING` (no `VERIFIED`)
- WHEN `POST /api/admin/loans/applications/:id/approve`
- THEN response status es `422 Unprocessable Entity`
- AND el error indica que se requieren documentos CI_FRONT y CI_BACK en estado VERIFIED

#### Scenario: Cannot approve without CI_BACK document

- GIVEN una solicitud en `IN_REVIEW`
- AND el customer tiene CI_FRONT `VERIFIED` pero NO tiene CI_BACK
- WHEN `POST /api/admin/loans/applications/:id/approve`
- THEN response status es `422 Unprocessable Entity`
- AND el error indica que falta el documento CI_BACK

#### Scenario: Cannot approve application not in IN_REVIEW

- GIVEN una solicitud en `PENDING` (no asignada)
- WHEN `POST /api/admin/loans/applications/:id/approve`
- THEN response status es `409 Conflict`
- AND el error indica que la solicitud debe estar en `IN_REVIEW` para ser aprobada

#### Scenario: Only the assigned reviewer can approve

- GIVEN una solicitud en `IN_REVIEW` con `reviewerId` del Admin A
- WHEN Admin B intenta aprobar
- THEN response status es `403 Forbidden`
- AND el error indica que solo el asesor asignado puede aprobar esta solicitud

`ponytail: Restricción de reviewerId es una decisión de negocio. Si se requiere revisión en equipo, se elimina esta validación.`

#### Scenario: Customer has no incomes registered

- GIVEN una solicitud en `IN_REVIEW`
- AND el customer NO tiene incomes registrados ni `monthlyIncome` en Customer
- WHEN `POST /api/admin/loans/applications/:id/approve`
- THEN response status es `422 Unprocessable Entity`
- AND el error indica que el cliente no tiene ingresos registrados

#### Scenario: Fallback to Customer.monthlyIncome when no CustomerIncome records

- GIVEN una solicitud en `IN_REVIEW`
- AND el customer NO tiene `CustomerIncome` records
- BUT `Customer.monthlyIncome` es 8,000 BOB
- WHEN `POST /api/admin/loans/applications/:id/approve`
- THEN el DTI se calcula usando `Customer.monthlyIncome` como `totalMonthlyIncome`
- AND el proceso continúa normalmente

#### Scenario: Race condition - application status changed before approve

- GIVEN una solicitud en `IN_REVIEW`
- AND entre que el admin carga el detalle y hace clic en "Aprobar", OTRO admin (o el sistema) cambió el estado
- WHEN `POST /api/admin/loans/applications/:id/approve`
- THEN response status es `409 Conflict`
- AND el error indica que el estado de la solicitud cambió desde que fue cargada

`ponytail: updateMany atómico con `where: { id, status: 'IN_REVIEW' }` — si count es 0, la transición ya no es válida.`

---

### Requirement: Reject Application with Reason

El sistema DEBE exponer `POST /api/admin/loans/applications/:id/reject` protegido con `JwtAuthGuard` + `AdminGuard` que:
1. Verifica que la solicitud esté en estado `IN_REVIEW`.
2. Requiere `reason` en el body (string no vacío, máximo 1000 caracteres).
3. Cambia el estado a `REJECTED`.
4. Guarda `reviewNotes` con el motivo de rechazo.
5. Guarda `reviewedAt` con la fecha actual.

#### Scenario: Reject application with reason

- GIVEN un admin autenticado con una solicitud en `IN_REVIEW` asignada a él
- WHEN `POST /api/admin/loans/applications/:id/reject` con body `{ "reason": "Documentación insuficiente" }`
- THEN response status es `200 OK`
- AND `status` es `"REJECTED"`
- AND `reviewNotes` es `"Documentación insuficiente"`

#### Scenario: Reject requires non-empty reason

- GIVEN un admin autenticado
- WHEN `POST /api/admin/loans/applications/:id/reject` con body `{}`
- THEN response status es `400 Bad Request`
- AND el error indica que `reason` es requerido

#### Scenario: Reject requires maximum 1000 characters

- GIVEN un admin autenticado
- WHEN `POST /api/admin/loans/applications/:id/reject` con body `{ "reason": "A".repeat(1001) }`
- THEN response status es `400 Bad Request`
- AND el error indica que `reason` excede los 1000 caracteres

#### Scenario: Cannot reject application not in IN_REVIEW

- GIVEN una solicitud en estado `APPROVED`
- WHEN `POST /api/admin/loans/applications/:id/reject`
- THEN response status es `409 Conflict`

#### Scenario: Only assigned reviewer can reject

- GIVEN una solicitud en `IN_REVIEW` con `reviewerId` del Admin A
- WHEN Admin B intenta rechazar
- THEN response status es `403 Forbidden`

---

### Requirement: Request Additional Information (IN_REVIEW → INFO_REQUESTED)

El sistema DEBE exponer `POST /api/admin/loans/applications/:id/request-info` protegido con `JwtAuthGuard` + `AdminGuard` que:
1. Verifica que la solicitud esté en estado `IN_REVIEW`.
2. Requiere `message` en el body (máximo 1000 caracteres) describiendo qué información adicional se necesita.
3. Cambia el estado a `INFO_REQUESTED`.
4. Guarda `reviewNotes` con el mensaje.

#### Scenario: Request additional info from customer

- GIVEN un admin autenticado con una solicitud en `IN_REVIEW`
- WHEN `POST /api/admin/loans/applications/:id/request-info` con body `{ "message": "Por favor sube tu último recibo de sueldo" }`
- THEN response status es `200 OK`
- AND `status` es `"INFO_REQUESTED"`
- AND `reviewNotes` es `"Por favor sube tu último recibo de sueldo"`

#### Scenario: Request-info requires message

- GIVEN un admin autenticado
- WHEN `POST /api/admin/loans/applications/:id/request-info` con body `{}`
- THEN response status es `400 Bad Request`
- AND el error indica que `message` es requerido

#### Scenario: Cannot request info on approved application

- GIVEN una solicitud en estado `APPROVED`
- WHEN `POST /api/admin/loans/applications/:id/request-info`
- THEN response status es `409 Conflict`

---

### Requirement: AdminGuard Verifies ADMIN Role

El sistema DEBE implementar `AdminGuard` que funciona igual que `CustomerGuard` pero verifica que `request.user.role === 'ADMIN'`. Todos los endpoints bajo `/api/admin/loans/applications/*` DEBEN usar `@UseGuards(JwtAuthGuard, AdminGuard)`.

`ponytail: AdminGuard es básico (role check). Agregar RBAC granular cuando haya más roles (SUPERVISOR, AGENTE, etc.).`

#### Scenario: AdminGuard rejects non-admin users

- GIVEN un User autenticado con `role: 'USER'`
- WHEN `GET /api/admin/loans/applications`
- THEN response status es `403 Forbidden`

#### Scenario: AdminGuard allows admin users

- GIVEN un User autenticado con `role: 'ADMIN'`
- WHEN `GET /api/admin/loans/applications`
- THEN response status es `200 OK`

---

### Requirement: Response Includes Enriched Application Data

La respuesta de `GET /api/admin/loans/applications` (lista) DEBE incluir por cada solicitud:
- `id`, `amount`, `termMonths`, `annualRate`, `monthlyPayment`, `purpose`, `status`, `riskScore`, `createdAt`
- `customer`: `{ "id", "firstName", "lastName", "documentNumber" }`
- `reviewer`: `{ "id", "name" }` (si está asignada)

La respuesta de `GET /api/admin/loans/applications/:id` (detalle) DEBE incluir todo lo anterior más:
- `customer`: con perfil completo (`firstName`, `lastName`, `middleName`, `secondLastName`, `birthDate`, `gender`, `maritalStatus`, `occupation`, `documentType`, `documentNumber`, `status`, `kycStatus`)
- `customer.addresses[]`: dirección con `type`, `city`, `street`, `isPrimary`
- `customer.phones[]`: teléfono con `phone`, `isWhatsApp`, `isPrimary`
- `customer.incomes[]`: ingreso con `source`, `amount`, `frequency`, `monthlyAmount` (normalizado)
- `customer.employments[]`: empleo con `employer`, `position`, `employmentStatus`, `monthlySalary`
- `customer.bankAccounts[]`: cuenta con `bank`, `accountType`, `accountNumber`, `isPrimary`
- `customer.documents[]`: documento con `type`, `fileName`, `status`, `createdAt`
- `totalMonthlyIncome`: number (suma de incomes normalizados)
- `dti`: number (ratio calculado)
- `timeline[]`: arreglo de eventos de cambio de estado con `{ "fromStatus", "toStatus", "changedBy", "changedAt", "notes" }`
