# Delta for Customer Management

## NEW Requirements

### Requirement: Customer Create on User Registration

Al registrar un User (`POST /api/auth/register`), el sistema DEBE crear automáticamente un registro Customer con `userId` igual al `id` del User creado, copiando el `name` como `firstName` y `phone` como primer `CustomerPhone`. Si la creación del Customer falla, el registro completo del User DEBE revertirse (rollback transaccional). El Customer se crea en estado `REGISTERED` con `kycStatus` `NOT_STARTED`. El cliente completa el perfil posteriormente desde el portal.

(Requirement nuevo: no existía Customer antes de esta fase)

#### Scenario: Customer created on user registration (happy path)

- GIVEN valid registration payload `{ "email": "a@b.com", "password": "12345678", "name": "Juan Perez", "phone": "+59176543210" }`
- WHEN `POST /api/auth/register` is called
- THEN a Customer record is created with `userId` matching the new User's `id`
- AND Customer `firstName` equals User `name`
- AND a `CustomerPhone` record is created with the `phone` value and `isPrimary=true`
- AND the response includes `{ "accessToken", "refreshToken", "user" }` with no Customer data
- AND HTTP status is `201 Created`

#### Scenario: Customer creation failure rolls back user registration

- GIVEN valid registration payload
- WHEN Customer creation fails (e.g. DB constraint violation)
- THEN the User record is NOT created (full rollback)
- AND the response is `500 Internal Server Error`

#### Scenario: No duplicate Customer per user

- GIVEN a User with an existing Customer record
- WHEN `POST /api/auth/register` attempts to create a second Customer for the same `userId`
- THEN the unique constraint on `userId` rejects the insert
- AND the response is `409 Conflict`

---

### Requirement: Get My Customer Profile

El sistema DEBE exponer `GET /api/customers/me` protegido por JWT que devuelva el Customer completo del usuario autenticado, incluyendo direcciones, teléfonos, emails, empleo, ingresos y cuentas bancarias como colecciones anidadas. Si el User autenticado no tiene Customer, DEBE responder `404 Not Found`.

(Requirement nuevo)

#### Scenario: Authenticated user gets own profile

- GIVEN a User with a valid JWT access token
- AND the User has a Customer record with addresses, phones, emails
- WHEN `GET /api/customers/me` is called with `Authorization: Bearer <token>`
- THEN response status is `200 OK`
- AND the response body includes `{ "id", "firstName", "lastName", "documentNumber", "status", "kycStatus", "addresses": [...], "phones": [...], "emails": [...], "employment": {...}, "incomes": [...], "bankAccounts": [...] }`

#### Scenario: User without Customer returns 404

- GIVEN a User with a valid JWT access token
- AND the User has NO Customer record
- WHEN `GET /api/customers/me` is called
- THEN response status is `404 Not Found`

#### Scenario: Unauthenticated request returns 401

- GIVEN no JWT access token
- WHEN `GET /api/customers/me` is called
- THEN response status is `401 Unauthorized`

---

### Requirement: Update My Customer Profile

El sistema DEBE exponer `PUT /api/customers/me` protegido por JWT para actualizar campos editables del perfil: `firstName`, `middleName`, `lastName`, `secondLastName`, `birthDate`, `gender`, `maritalStatus`, `occupation`. La respuesta DEBE devolver el Customer completo actualizado. El `documentType` y `documentNumber` solo se actualizan si están vacíos (no permitir cambiar documento después de registrado).

(Requirement nuevo)

#### Scenario: Update profile fields

- GIVEN an authenticated Customer with existing profile
- WHEN `PUT /api/customers/me` is called with body `{ "firstName": "Juan Carlos", "occupation": "Ingeniero" }`
- THEN response status is `200 OK`
- AND `firstName` in response equals `"Juan Carlos"`
- AND `occupation` in response equals `"Ingeniero"`
- AND unchanged fields keep their previous values

#### Scenario: Cannot change document after registration

- GIVEN an authenticated Customer with `documentNumber: "1234567"` already set
- WHEN `PUT /api/customers/me` is called with body `{ "documentNumber": "7654321" }`
- THEN response status is `200 OK`
- AND `documentNumber` in response remains `"1234567"`

#### Scenario: Can set document if empty

- GIVEN an authenticated Customer with `documentNumber: null`
- WHEN `PUT /api/customers/me` is called with body `{ "documentNumber": "1234567", "documentType": "CI" }`
- THEN response status is `200 OK`
- AND `documentNumber` in response equals `"1234567"`

---

### Requirement: Manage Customer Addresses

El sistema DEBE exponer `POST`, `PUT`, `DELETE /api/customers/me/addresses` protegido por JWT para gestionar direcciones del cliente. Cada dirección tiene `type` (HOME | WORK | CORRESPONDENCE), `country`, `department`, `city`, `zone`, `street`, `number`, `isPrimary`. Solo puede haber una dirección primaria por cliente. Al marcar una dirección como primaria, las demás se desmarcan automáticamente.

(Requirement nuevo)

#### Scenario: Create address

- GIVEN an authenticated Customer
- WHEN `POST /api/customers/me/addresses` is called with `{ "city": "Santa Cruz", "street": "Av. San Martin", "isPrimary": true }`
- THEN response status is `201 Created`
- AND the address is persisted with the given values
- AND it is marked as the primary address

#### Scenario: Set new primary address demotes old one

- GIVEN an authenticated Customer with address A as primary
- WHEN `POST /api/customers/me/addresses` is called with `{ "city": "La Paz", "isPrimary": true }`
- THEN address A `isPrimary` becomes `false`
- AND the new address has `isPrimary: true`

#### Scenario: Delete address

- GIVEN an authenticated Customer with an existing address
- WHEN `DELETE /api/customers/me/addresses/:id` is called
- THEN response status is `204 No Content`
- AND the address is removed from the database

---

### Requirement: Manage Customer Phones

El sistema DEBE exponer `POST`, `DELETE /api/customers/me/phones` protegido por JWT para gestionar teléfonos. Cada teléfono tiene `phone` (validación formato boliviano `+591XXXXXXXX`), `isWhatsApp`, `isPrimary`. Solo puede haber un teléfono primario.

(Requirement nuevo)

#### Scenario: Create phone

- GIVEN an authenticated Customer
- WHEN `POST /api/customers/me/phones` is called with `{ "phone": "+59176543210", "isWhatsApp": true, "isPrimary": true }`
- THEN response status is `201 Created`
- AND phone is persisted with validated format

#### Scenario: Invalid phone format rejected

- GIVEN an authenticated Customer
- WHEN `POST /api/customers/me/phones` is called with `{ "phone": "7654321" }` (missing country code, wrong length)
- THEN response status is `400 Bad Request`
- AND error message indicates invalid phone format

#### Scenario: Cannot have two primary phones

- GIVEN an authenticated Customer with a primary phone
- WHEN `POST /api/customers/me/phones` is called with `{ "phone": "+59170010203", "isPrimary": true }`
- THEN the new phone is created as primary
- AND the old primary phone has `isPrimary: false`

---

### Requirement: Manage Customer Emails

El sistema DEBE exponer `POST`, `DELETE /api/customers/me/emails` protegido por JWT para gestionar emails. Cada email tiene `email` (validación formato email), `isPrimary`. Solo puede haber un email primario.

(Requirement nuevo)

#### Scenario: Create email

- GIVEN an authenticated Customer
- WHEN `POST /api/customers/me/emails` is called with `{ "email": "juan@example.com", "isPrimary": true }`
- THEN response status is `201 Created`
- AND email is persisted

#### Scenario: Invalid email format rejected

- GIVEN an authenticated Customer
- WHEN `POST /api/customers/me/emails` is called with `{ "email": "not-an-email" }`
- THEN response status is `400 Bad Request`

---

### Requirement: Manage Customer Employment

El sistema DEBE exponer `PUT /api/customers/me/employment` protegido por JWT para actualizar información laboral. Campos: `employer`, `position`, `employmentStatus` (EMPLOYEE | SELF_EMPLOYED | BUSINESS_OWNER | UNEMPLOYED | STUDENT), `yearsWorking`, `monthlySalary`, `startDate`. Un Customer tiene exactamente un registro de empleo activo (reemplaza al existente).

(Requirement nuevo)

#### Scenario: Create or update employment

- GIVEN an authenticated Customer with no employment record
- WHEN `PUT /api/customers/me/employment` is called with `{ "employer": "Empresa SA", "position": "Analista", "employmentStatus": "EMPLOYEE", "monthlySalary": 5000 }`
- THEN response status is `200 OK`
- AND employment record is created

#### Scenario: Update replaces existing

- GIVEN an authenticated Customer with an existing employment record
- WHEN `PUT /api/customers/me/employment` is called with `{ "position": "Senior" }`
- THEN response status is `200 OK`
- AND the existing record is updated (not duplicated)

---

### Requirement: Manage Customer Incomes

El sistema DEBE exponer `POST`, `DELETE /api/customers/me/incomes` protegido por JWT para gestionar múltiples fuentes de ingreso. Cada ingreso tiene `source` (SALARY | BUSINESS | RENT | COMMISSION | PENSION | OTHER), `amount`, `frequency` (MONTHLY | WEEKLY | ANNUAL).

(Requirement nuevo)

#### Scenario: Create income source

- GIVEN an authenticated Customer
- WHEN `POST /api/customers/me/incomes` is called with `{ "source": "SALARY", "amount": 5000, "frequency": "MONTHLY" }`
- THEN response status is `201 Created`

#### Scenario: Customer can have multiple incomes

- GIVEN an authenticated Customer with one income record
- WHEN `POST /api/customers/me/incomes` is called with `{ "source": "RENT", "amount": 1500, "frequency": "MONTHLY" }`
- THEN response status is `201 Created`
- AND the Customer now has two income records

---

### Requirement: Manage Customer Bank Accounts

El sistema DEBE exponer `POST`, `DELETE /api/customers/me/bank-accounts` protegido por JWT para gestionar cuentas bancarias. Campos: `bank`, `accountType` (SAVINGS | CHECKING), `accountNumber`, `holderName`, `isPrimary`. Solo puede haber una cuenta primaria.

(Requirement nuevo)

#### Scenario: Create bank account

- GIVEN an authenticated Customer
- WHEN `POST /api/customers/me/bank-accounts` is called with `{ "bank": "Banco Unión", "accountType": "SAVINGS", "accountNumber": "1234567890", "holderName": "Juan Perez", "isPrimary": true }`
- THEN response status is `201 Created`
- AND bank account is persisted

---

### Requirement: Portal Action Tracking (insert-only)

El sistema DEBE exponer `POST /api/customers/me/actions` protegido por JWT para registrar acciones del cliente en el portal: `action` (string, ej: VIEW_DASHBOARD | VIEW_PROFILE | VIEW_DOCUMENTS | VIEW_SIMULATOR | UPLOAD_DOCUMENT | RUN_SIMULATION | APPLY_CLICK) y `metadata` (JSON opcional). Es insert-only, sin actualizaciones ni eliminaciones. No tiene FK a otras tablas de negocio.

(Requirement nuevo)

#### Scenario: Track portal action

- GIVEN an authenticated Customer
- WHEN `POST /api/customers/me/actions` is called with `{ "action": "VIEW_DASHBOARD", "metadata": { "source": "sidebar" } }`
- THEN response status is `201 Created`
- AND the action is persisted

#### Scenario: Invalid action value

- GIVEN an authenticated Customer
- WHEN `POST /api/customers/me/actions` is called with `{ "action": "" }`
- THEN response status is `400 Bad Request`

---

### Requirement: All Customer endpoints require Customer scope guard

Todos los endpoints bajo `/api/customers/me/*` DEBEN verificar que el JWT autenticado tiene un Customer asociado. Si no existe, DEBEN responder `404 Not Found`. Los endpoints DEBEN usar un guard `CustomerGuard` que lee el `userId` del JWT payload y busca el Customer en DB.

(Requirement nuevo)

#### Scenario: Endpoint returns 404 when user has no customer

- GIVEN a User with valid JWT and NO Customer record
- WHEN calling any `GET /api/customers/me/*`
- THEN response status is `404 Not Found`

#### Scenario: Customer guard caches lookup per request

- GIVEN an authenticated Customer
- WHEN multiple endpoints under `/api/customers/me/*` are called in the same request chain
- THEN the Customer lookup happens only once per request (performance)
