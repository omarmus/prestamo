# Loan Application Creation Specification

## Purpose

Define cómo un cliente crea una solicitud de préstamo, ya sea desde una simulación existente (con `simulationId`) o directamente ingresando los datos del préstamo deseado. Este es el punto de entrada del workflow de solicitudes: sin una solicitud creada, no hay expediente que un asesor pueda revisar.

## Requirements

### Requirement: Create Application from Simulation

El sistema DEBE exponer `POST /api/loans/applications` protegido con `JwtAuthGuard` + `CustomerGuard` que acepte un `simulationId` UUID opcional. Cuando se provee `simulationId`, el sistema DEBE cargar la simulación desde la base de datos, verificar que pertenezca al customer autenticado, y pre-poblar los campos `amount`, `termMonths`, `annualRate`, `monthlyPayment`, `totalInterest` y `totalPayment` desde la simulación. La solicitud se crea en estado `DRAFT`.

#### Scenario: Create from simulation (happy path)

- GIVEN un customer autenticado con una simulación existente (`simulationId`)
- WHEN `POST /api/loans/applications` es llamado con body `{ "simulationId": "<uuid>", "purpose": "NEGOCIO" }`
- THEN response status es `201 Created`
- AND el body contiene `{ "id", "status": "DRAFT", "amount", "termMonths", "annualRate", "monthlyPayment", "totalInterest", "totalPayment", "purpose": "NEGOCIO", "simulationId": "<uuid>", "createdAt" }`
- AND los valores de `amount`, `termMonths`, `annualRate`, `monthlyPayment` coinciden con la simulación
- AND se crea un registro `LoanApplication` en la base de datos con `customerId` del customer autenticado

#### Scenario: Simulation belongs to another customer

- GIVEN un customer autenticado
- WHEN `POST /api/loans/applications` es llamado con `simulationId` de una simulación que pertenece a OTRO customer
- THEN response status es `404 Not Found`
- AND el error indica que la simulación no existe o no pertenece al customer

#### Scenario: Simulation not found

- GIVEN un customer autenticado
- WHEN `POST /api/loans/applications` es llamado con `simulationId` que no existe en la base de datos
- THEN response status es `404 Not Found`

#### Scenario: Purpose is optional when coming from simulation

- GIVEN un customer autenticado con una simulación existente
- WHEN `POST /api/loans/applications` es llamado con body `{ "simulationId": "<uuid>" }` (sin `purpose`)
- THEN response status es `201 Created`
- AND `purpose` en la respuesta es `null`

---

### Requirement: Create Application Directly (Without Simulation)

El sistema DEBE permitir crear una solicitud sin `simulationId`. En este caso, el cliente DEBE proveer `amount`, `termMonths`, `annualRate` directamente. El sistema DEBE calcular `monthlyPayment`, `totalInterest` y `totalPayment` usando `calculateLoan()` y crear la solicitud en estado `DRAFT`.

#### Scenario: Create directly with all fields

- GIVEN un customer autenticado
- WHEN `POST /api/loans/applications` con body `{ "amount": 10000, "termMonths": 12, "annualRate": 12, "purpose": "EDUCACION" }`
- THEN response status es `201 Created`
- AND `status` es `"DRAFT"`
- AND `simulationId` es `null`
- AND `monthlyPayment` es calculado correctamente (~888.49 para 10,000 a 12% en 12 meses)
- AND `totalInterest` y `totalPayment` son calculados y devueltos

#### Scenario: Create without purpose

- GIVEN un customer autenticado
- WHEN `POST /api/loans/applications` con body `{ "amount": 10000, "termMonths": 12, "annualRate": 12 }` (sin `purpose`)
- THEN response status es `201 Created`
- AND `purpose` es `null`

#### Scenario: Validation error - amount exceeds maximum

- GIVEN un customer autenticado
- WHEN `POST /api/loans/applications` con body `{ "amount": 600000, "termMonths": 12, "annualRate": 12 }`
- THEN response status es `400 Bad Request`
- AND el error indica que `amount` excede el máximo (500,000)

#### Scenario: Validation error - amount below minimum

- GIVEN un customer autenticado
- WHEN `POST /api/loans/applications` con body `{ "amount": 50, "termMonths": 12, "annualRate": 12 }`
- THEN response status es `400 Bad Request`
- AND el error indica que `amount` está por debajo del mínimo

#### Scenario: Validation error - term below minimum

- GIVEN un customer autenticado
- WHEN `POST /api/loans/applications` con body `{ "amount": 10000, "termMonths": 1, "annualRate": 12 }`
- THEN response status es `400 Bad Request`
- AND el error indica que `termMonths` debe ser mínimo 3

#### Scenario: Validation error - term exceeds maximum

- GIVEN un customer autenticado
- WHEN `POST /api/loans/applications` con body `{ "amount": 10000, "termMonths": 150, "annualRate": 12 }`
- THEN response status es `400 Bad Request`
- AND el error indica que `termMonths` excede el máximo (120)

#### Scenario: Validation error - rate exceeds maximum

- GIVEN un customer autenticado
- WHEN `POST /api/loans/applications` con body `{ "amount": 10000, "termMonths": 12, "annualRate": 40 }`
- THEN response status es `400 Bad Request`
- AND el error indica que `annualRate` excede el máximo (36%)

#### Scenario: Validation error - invalid purpose enum

- GIVEN un customer autenticado
- WHEN `POST /api/loans/applications` con body `{ "amount": 10000, "termMonths": 12, "annualRate": 12, "purpose": "INVALIDO" }`
- THEN response status es `400 Bad Request`
- AND el error indica que `purpose` debe ser uno de los valores válidos (`NEGOCIO`, `EDUCACION`, `SALUD`, `VIAJE`, `OTRO`)

#### Scenario: Validation error - simulationId and direct fields conflict

- GIVEN un customer autenticado
- WHEN `POST /api/loans/applications` con body `{ "simulationId": "<uuid>", "amount": 5000, "termMonths": 12, "annualRate": 12 }`
- THEN response status es `400 Bad Request`
- AND el error indica que no se puede enviar `simulationId` junto con `amount`/`termMonths`/`annualRate`

#### Scenario: Unauthenticated request returns 401

- GIVEN no hay JWT access token
- WHEN `POST /api/loans/applications` es llamado
- THEN response status es `401 Unauthorized`

#### Scenario: Customer without profile returns error

- GIVEN un User autenticado pero que NO tiene un Customer registrado (no pasa `CustomerGuard`)
- WHEN `POST /api/loans/applications` es llamado
- THEN response status es `404 Not Found` (rechazado por `CustomerGuard`)

---

### Requirement: Partial Input Validation via Shared Zod Schema

Los schemas de validación DEBEN vivir en `packages/shared/src/schemas/loan.schema.ts` para ser reutilizados entre backend y frontend. El schema `CreateLoanApplicationSchema` DEBE validar:
- `simulationId`: UUID opcional. Si se provee, NO se permiten `amount`, `termMonths`, `annualRate`.
- `amount`: número positivo, mínimo 100, máximo 500,000.
- `termMonths`: entero, mínimo 3, máximo 120.
- `annualRate`: número positivo, mínimo 0, máximo 36 (porcentaje).
- `purpose`: enum opcional con valores `NEGOCIO | EDUCACION | SALUD | VIAJE | OTRO`.

#### Scenario: Schema validates on frontend before submit

- GIVEN el schema `CreateLoanApplicationSchema` exportado desde `packages/shared`
- WHEN se valida `{ "amount": 50, "termMonths": 12, "annualRate": 12 }` en el frontend
- THEN la validación falla con `amount` por debajo del mínimo
- AND el formulario muestra el error antes de enviar al backend

---

### Requirement: Initial Status is DRAFT

Toda solicitud creada DEBE iniciar en estado `DRAFT` independientemente de si viene de simulación o es directa. El estado `DRAFT` indica que el cliente aún no ha "enviado" formalmente la solicitud. El cliente DEBE explícitamente enviar la solicitud para que pase a `PENDING` y sea visible para los asesores.

`ponytail: DRAFT permite que el cliente guarde y revise antes de enviar. Si en la práctica nadie usa DRAFT, simplificar a creación directa en PENDING.`

#### Scenario: New application starts as DRAFT

- GIVEN un customer autenticado
- WHEN crea una solicitud (con o sin simulación)
- THEN `status` es `"DRAFT"`

#### Scenario: Application in DRAFT is not visible to admin reviewers

- GIVEN una solicitud en estado `DRAFT`
- WHEN el admin lista todas las solicitudes con filtro `status=PENDING`
- THEN esa solicitud NO aparece en los resultados

---

### Requirement: Submit Application (DRAFT → PENDING)

El sistema DEBE exponer un mecanismo para que el cliente envíe una solicitud en estado `DRAFT` a `PENDING`. Esto puede ser:
- Un endpoint `POST /api/loans/applications/:id/submit` que cambia el estado de `DRAFT` a `PENDING`.
- O un flag `submit: true` en el body de creación.

`ponytail: Se prefiere el flag `submit: true` en creación para evitar un viaje extra de API. Si se necesita DRAFT persistente en el futuro, se agrega el endpoint separado.`

#### Scenario: Create and submit in one call

- GIVEN un customer autenticado
- WHEN `POST /api/loans/applications` con body `{ "amount": 10000, "termMonths": 12, "annualRate": 12, "purpose": "NEGOCIO", "submit": true }`
- THEN response status es `201 Created`
- AND `status` es `"PENDING"`
- AND la solicitud aparece en la lista de solicitudes pendientes del admin

#### Scenario: Cannot submit without required profile data in PENDING

- GIVEN un customer autenticado que NO tiene incomes registrados
- WHEN `POST /api/loans/applications` con `{ "amount": 10000, "termMonths": 12, "annualRate": 12, "submit": true }`
- THEN response status es `422 Unprocessable Entity`
- AND el error indica que se requiere al menos un ingreso registrado antes de enviar la solicitud
- AND la solicitud NO es creada (rollback completo)

`ponytail: La validación de incomes es mínima. En el futuro se podría validar también documentos mínimos (CI) antes de permitir PENDING, pero por ahora el admin revisa eso.`

#### Scenario: Submit is optional - create stays DRAFT

- GIVEN un customer autenticado con incomes registrados
- WHEN `POST /api/loans/applications` con `{ "amount": 10000, "termMonths": 12, "annualRate": 12 }` (sin `submit`)
- THEN response status es `201 Created`
- AND `status` es `"DRAFT"`

---

### Requirement: Simulator → Apply Button Flow

El sistema DEBE mostrar un botón "Solicitar este préstamo" en el componente `AmortizationTable` cuando el simulador muestra resultados. Al hacer clic:
1. Si el usuario NO está autenticado, DEBE redirigir al login.
2. Si el usuario está autenticado pero NO tiene Customer, DEBE redirigir a completar perfil.
3. Si el usuario está autenticado y tiene Customer, DEBE redirigir a la página de creación de solicitud con los parámetros de la simulación pre-cargados (`simulationId`).

#### Scenario: Authenticated user clicks apply from simulator

- GIVEN un customer autenticado viendo resultados del simulador
- WHEN hace clic en "Solicitar este préstamo"
- THEN es redirigido a `/portal/loans/new?simulationId=<uuid>`
- AND el formulario de creación está pre-poblado con los datos de la simulación
- AND `simulationId` se pasa al backend al crear

#### Scenario: Unauthenticated user clicks apply

- GIVEN un visitante NO autenticado viendo resultados del simulador
- WHEN hace clic en "Solicitar este préstamo"
- THEN es redirigido a `/auth/login?redirect=/portal/loans/new?simulationId=<uuid>`
- AND después de login exitoso, continúa a la creación con simulación pre-cargada

#### Scenario: Authenticated user without Customer clicks apply

- GIVEN un User autenticado pero SIN Customer registrado
- WHEN hace clic en "Solicitar este préstamo"
- THEN es redirigido a `/portal/profile` para completar su perfil
- AND se muestra un mensaje: "Completa tu perfil antes de solicitar un préstamo"

---

### Requirement: All Monetary Values Use Decimal Precision

Todos los montos (`amount`, `monthlyPayment`, `totalInterest`, `totalPayment`) DEBEN almacenarse como `Decimal(18, 2)` en PostgreSQL y como `number` en la API (Zod transforma). El cálculo con `calculateLoan()` DEBE redondear a 2 decimales usando `Math.round(value * 100) / 100`.

#### Scenario: Monetary values have exactly 2 decimal places

- GIVEN un customer autenticado
- WHEN crea una solicitud con `amount: 10000`
- THEN todos los valores monetarios en la respuesta tienen máximo 2 decimales
- AND `monthlyPayment` es un `number`, no un `string`

---

### Requirement: Request Validation Returns 400 for Malformed Body

El endpoint DEBE devolver `400 Bad Request` cuando el body no puede ser parseado como JSON o no cumple el schema de validación.

#### Scenario: Invalid JSON body

- GIVEN un customer autenticado
- WHEN `POST /api/loans/applications` con body malformado `{ "amount": "not-a-number" }`
- THEN response status es `400 Bad Request`

#### Scenario: Empty body

- GIVEN un customer autenticado
- WHEN `POST /api/loans/applications` con body `{}`
- THEN response status es `400 Bad Request`
- AND el error indica que `amount` es requerido (cuando no hay `simulationId`)
