# Delta for Portal Profile

## NEW Requirements

### Requirement: Portal Layout with Auth Guard

El sistema DEBE proveer un layout protegido en `app/portal/layout.tsx` que verifique la sesión activa. Sin sesión válida, redirige a `/login`. Con sesión, renderiza un sidebar de navegación y un `children` outlet. El sidebar contiene: Dashboard, Mi Perfil, Documentos, Simulador. El layout DEBE llamar `POST /api/customers/me/actions` con `VIEW_DASHBOARD` en cada navegación entre rutas para tracking.

(Requirement nuevo)

#### Scenario: Unauthenticated redirects to login

- GIVEN no active session (no valid JWT in localStorage)
- WHEN navigating to `/portal/dashboard`
- THEN user is redirected to `/login?redirect=/portal/dashboard`

#### Scenario: Authenticated shows sidebar

- GIVEN an active session with a valid JWT
- WHEN navigating to `/portal/dashboard`
- THEN the sidebar is visible with navigation links
- AND the main content area renders the dashboard

---

### Requirement: Dashboard Page (`/portal/dashboard`)

El sistema DEBE mostrar una página de dashboard en `/portal/dashboard` con: nombre del cliente (desde `GET /api/customers/me`), progreso de documentos (pendientes/verificados), acceso rápido a simulador y documentos. Si el Customer tiene `status: "REGISTERED"`, mostrar banner de perfil incompleto con link a `/portal/profile`. Si el perfil está completo (firstName, lastName, documentNumber, al menos 1 phone), ocultar el banner.

(Requirement nuevo)

#### Scenario: Dashboard shows incomplete profile banner

- GIVEN an authenticated Customer with `status: "REGISTERED"` and missing `documentNumber`
- WHEN visiting `/portal/dashboard`
- THEN a banner is visible: "Completa tu perfil para solicitar un préstamo"
- AND the banner links to `/portal/profile`

#### Scenario: Dashboard hides banner when profile is complete

- GIVEN an authenticated Customer with `firstName`, `lastName`, `documentNumber`, and at least one phone
- WHEN visiting `/portal/dashboard`
- THEN no profile banner is shown

#### Scenario: Dashboard shows action cards

- GIVEN an authenticated Customer
- WHEN visiting `/portal/dashboard`
- THEN cards are visible: "Simular préstamo", "Subir documentos"
- AND clicking "Simular préstamo" navigates to `/portal/simulator`
- AND clicking "Subir documentos" navigates to `/portal/documents`

---

### Requirement: Profile Page (`/portal/profile`)

El sistema DEBE exponer la ruta `/portal/profile` con un formulario en tabs (shadcn/ui Tabs) para editar: **Datos personales** (firstName, middleName, lastName, secondLastName, birthDate, gender, maritalStatus, occupation, documentType, documentNumber), **Dirección** (type, department, city, zone, street, number), **Teléfonos** (lista con agregar/eliminar), **Emails** (lista con agregar/eliminar), **Empleo** (employer, position, employmentStatus, monthlySalary), **Ingresos** (lista fuente/monto/frecuencia), **Cuentas bancarias** (lista banco/tipo/número/titular). Cada tab tiene su propio botón "Guardar". Los formularios DEBEN usar Zod validation del lado del cliente (schemas compartidos en `packages/shared`).

(Requirement nuevo)

#### Scenario: Profile loads customer data into form

- GIVEN an authenticated Customer with existing profile data
- WHEN visiting `/portal/profile`
- THEN each tab pre-fills with the corresponding data from `GET /api/customers/me`
- AND form fields are editable

#### Scenario: Update personal data saves correctly

- GIVEN an authenticated Customer viewing `/portal/profile`
- WHEN the user edits `firstName` and clicks "Guardar" on the Personal Data tab
- THEN `PUT /api/customers/me` is called with the updated data
- AND a success toast (Sonner) shows "Datos actualizados correctamente"
- AND the form reflects the saved values

#### Scenario: Validation error shows inline message

- GIVEN an authenticated Customer viewing `/portal/profile`
- WHEN the user enters an invalid phone number `"123"` on the Phones tab
- THEN an inline error message shows "Formato de teléfono inválido. Use +591XXXXXXXX"
- AND the form is NOT submitted

#### Scenario: Add phone dynamically

- GIVEN an authenticated Customer viewing `/portal/profile`
- WHEN the user clicks "Agregar teléfono" on the Phones tab
- THEN a new phone input row appears
- AND the user fills `+59176543210` and clicks "Guardar"
- THEN `POST /api/customers/me/phones` is called
- AND the new phone appears in the list

#### Scenario: Delete phone

- GIVEN an authenticated Customer with at least two phones viewing `/portal/profile`
- WHEN the user clicks "Eliminar" on a non-primary phone
- THEN `DELETE /api/customers/me/phones/:id` is called
- AND the phone is removed from the list
- AND a success toast shows

---

### Requirement: Loading and Error States

El sistema DEBE mostrar un skeleton (shadcn/ui Skeleton) mientras carga los datos del perfil. Si la carga falla (network error), DEBE mostrar un mensaje de error con botón "Reintentar". Si el Customer no existe (404), DEBE mostrar pantalla de "Perfil no encontrado" con link a soporte.

(Requirement nuevo)

#### Scenario: Shows skeleton while loading

- GIVEN an authenticated Customer
- WHEN navigating to `/portal/profile`
- THEN a skeleton placeholder is shown for each form section
- AND the skeleton is replaced by the actual form once data loads

#### Scenario: Shows error with retry on network failure

- GIVEN an authenticated Customer
- WHEN the API call to `GET /api/customers/me` fails (network error)
- THEN an error message is displayed: "Error al cargar perfil"
- AND a "Reintentar" button is visible
- WHEN clicking "Reintentar"
- THEN the API call is retried
