# MVP Roadmap — prestamos-app

**Basado en:** DAD-50 (MVP Implementation Roadmap) + DAD-44 (Customer Portal) + DAD-36 (WhatsApp)
**Estado:** Planning activo
**Última actualización:** 2026-07-20

---

## Visión del Flujo Completo

El MVP tiene **dos canales de entrada** que convergen en el mismo backend:

```
                     ┌─────────────────────────────┐
                     │                             │
  Cliente ──────────►│  LANDING PAGE               │
                     │  (pública)                  │
                     │                             │
                     │  ┌──────────────────────┐   │
                     │  │ 📱 WhatsApp          │   │
                     │  │ 🤖 Chatbot AI        │   │──► Registro + Solicitud
                     │  └──────────────────────┘   │
                     │                             │
                     │  ┌──────────────────────┐   │
                     │  │ 🌐 Registro web      │   │──► Crear cuenta
                     │  └──────────────────────┘   │
                     └─────────────────────────────┘

                                  │
                                  ▼
                     ┌─────────────────────────────┐
                     │                             │
  Cliente ──────────►│  CUSTOMER PORTAL            │
  (logueado)         │  (autenticado)              │
                     │                             │
                     │  ┌──────────────────────┐   │
                     │  │ Dashboard            │   │
                     │  │ Subir documentos     │   │
                     │  │ Solicitar préstamo   │   │
                     │  │ Ver estado           │   │
                     │  │ Pagar cuotas         │   │
                     │  │ Descargar contrato   │   │
                     │  └──────────────────────┘   │
                     └─────────────────────────────┘

                     ┌─────────────────────────────┐
                     │                             │
  Staff ─────────────►│  ADMIN BACKOFFICE           │
  (interno)          │  (autenticado)              │
                     │                             │
                     │  • Revisar solicitudes      │
                     │  • Aprobar/rechazar         │
                     │  • Gestionar clientes       │
                     │  • Registrar pagos          │
                     │  • Configurar productos     │
                     └─────────────────────────────┘

                            │
                            ▼
                   ┌─────────────────┐
                   │  BACKEND API    │
                   │  (NestJS)       │
                   └─────────────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │  PostgreSQL     │
                   └─────────────────┘
```

**El flujo del cliente empieza en DOS puntos:**
1. **Landing → WhatsApp Bot** → captación conversacional, registro y solicitud asistida
2. **Landing → Registro Web** → autoservicio

Ambos convergen en el Customer Portal para la gestión post-registro.

> DAD-44 lo dice claro: *"El portal debe complementar WhatsApp. No reemplazarlo."*

---

## Estado Actual

| Capa | Módulo | Backend | Frontend | Prisma |
|------|--------|---------|----------|--------|
| **Landing** | Página pública | — | ✅ Layout, HomePage, Simulator | — |
| **Auth** | Identity | ✅ Register, Login, Refresh, Me | ✅ LoginForm, RegisterForm, AuthProvider | ✅ User, Role, FailedLoginAttempt |
| **Portal** | Customer Dashboard | ✅ Profile CRUD | ✅ Dashboard, Profile, Sidebar | ✅ Customer (20 tablas) |
| **Portal** | Loan Application | ✅ CRUD + Admin Review | ✅ Apply, List, Track | ✅ LoanApplication |
| **Portal** | Document Upload | ✅ Upload endpoint | ✅ Documents page | ✅ CustomerDocument |
| **Portal** | Loan Simulator | ✅ Simulation engine | ✅ Simulator + Amortization | ✅ LoanSimulation |
| **Portal** | Payments | ✅ Loan disbursement, installment schedule, payment registration | ✅ DisbursementButton, PaymentDialog, ActiveLoanList, ActiveLoanDetail | ✅ Loan, Installment, LoanTransaction |
| **WhatsApp** | Cloud API + Webhook | ❌ | ❌ | ✅ Schema (4 tablas) |
| **Chatbot** | AI Bot + Sessions | ❌ | — | ✅ Schema |
| **Backend** | Customer Management | ✅ Full CRUD + auto-create | — | ✅ Customer + 8 sub-tablas |
| **Backend** | Loan Applications | ✅ Full + Admin review | — | ✅ LoanApplication + Timeline |
| **Backend** | Loans & Installments | ✅ DisburseLoanHandler, amortization calculator, ActiveLoanQuery | — | ✅ Loan, Installment |
| **Backend** | Payments Engine | ✅ RegisterPaymentHandler, atomic transactions, FIFO allocation | — | ✅ LoanTransaction |
| **Backend** | Legal Docs | ❌ | — | ❌ |
| **Admin** | Admin Backoffice | ✅ Loan admin endpoints | ✅ Admin loans pages | — |

---

## Fases del MVP

### Fase 0 ✅ — Identity & Auth *(Completada)*

**Duración:** Ya implementada
**DAD ref:** DAD-02, DAD-40

**Logrado:**
- Backend: módulo Identity completo (register, login, refresh, me) con Clean Architecture
- Frontend: AuthProvider, LoginForm, RegisterForm, API client con refresh automático
- Páginas: `/login`, `/register` con redirect post-auth
- Landing page con auth guard

**Prisma actual:**
```prisma
model Role  { id String @id @default(uuid()); name String @unique; users User[]; createdAt DateTime @default(now()) }
model User  { id String @id @default(uuid()); email String @unique; passwordHash String; name String; phone String; roleId String; role Role @relation; createdAt DateTime @default(now()); updatedAt DateTime @updatedAt }
model FailedLoginAttempt { id String @id @default(uuid()); email String; ip String; timestamp DateTime @default(now()) }
```

**Tablas:** `users`, `roles`

> **Pendiente**: Completar campos base (`organization_id`, soft delete, versión).

---

### Fase 1 ✅ — Fundación: Base de Datos & Plataforma *(Completada)*

**Duración:** 1 semana
**DAD ref:** DAD-01, DAD-40

**Logrado:**
- Schema Prisma centralizado con modelos base
- Campos base en todas las tablas (`organizationId`, `deletedAt`, `version`, `createdById`, `updatedById`, `deletedById`)
- `@Inject()` explícito en todos los constructores NestJS para compatibilidad con tsx/esbuild
- Turborepo DI tokens con naming consistente
- Auditoría: `AuditLog` implementado en schema
- `SystemConfiguration` implementado en schema

**Tablas:** `audit_logs`, `system_configurations`
**Tablas modificadas:** `users`, `roles`, `failed_login_attempts` (+`organizationId`, soft delete, version, auditoría)

---

### Fase 2 ✅ — Captación: WhatsApp + Chatbot AI *(Schema completado, endpoints pendientes)*

**Duración:** 2-3 semanas
**DAD ref:** DAD-36 (WhatsApp & Notifications), DAD-50 Fase 2

**Objetivo:** El cliente llega a la Landing, hace clic en WhatsApp, y un chatbot AI lo guía para registrarse y solicitar su préstamo. **Este es el canal de adquisición PRIMARIO del MVP.**

#### Logrado (Phase 2 + Phase 3 del build real)

**WhatsApp + Chatbot (Schema-only):**
- Prisma schema completo: WhatsAppContact, WhatsAppConversation, WhatsAppMessage, ChatbotSession
- **Endpoints pendientes**: Cloud API Webhook + Chatbot AI logic quedan para fase dedicada

**Customer Management (Full CRUD):**
- Módulo Customers con Clean Architecture: domain, application, infrastructure, presentation
- Auto-creación de Customer al registrarse (AuthRegisterHandler)
- Portal profile: GET/me, PATCH/profile con datos personales, empleo, ingresos
- CustomerDocument: subida y listado de documentos (CI, selfie, recibos)
- LoanSimulation: simulador con cálculo de cuota mensual y tabla de amortización

**Landing Page:**
- Hero + features + footer
- Simulador público de crédito con cálculo de cuota mensual
- Diseño mobile-ready

**Portal Frontend:**
- Dashboard con resumen del cliente
- Profile: formulario completo de datos personales
- Documents: subir/ver documentos
- Simulator: monto, plazo, cuota, tabla de amortización

**Tablas nuevas implementadas:**
| Tabla | Descripción | Estado |
|-------|-------------|--------|
| customers | Datos principales del cliente | ✅ |
| customer_addresses | Direcciones | ✅ |
| customer_phones | Teléfonos | ✅ |
| customer_emails | Emails | ✅ |
| customer_employment | Información laboral | ✅ |
| customer_incomes | Fuentes de ingreso | ✅ |
| customer_bank_accounts | Cuentas bancarias | ✅ |
| customer_documents | Documentos subidos | ✅ |
| loan_simulations | Simulaciones de crédito | ✅ |
| portal_actions | Acciones del cliente | ✅ |
| whatsapp_contacts | Contactos WhatsApp | ✅ (schema) |
| whatsapp_conversations | Conversaciones | ✅ (schema) |
| whatsapp_messages | Mensajes | ✅ (schema) |
| chatbot_sessions | Sesiones del bot | ✅ (schema) |

---

### Fase 3 ✅ — Customer Portal Core + Clientes *(Completada — merged con Phase 2 del build)*

**Duración:** 2-3 semanas
**DAD ref:** DAD-44, DAD-37

**Objetivo:** Construir el portal autenticado donde el cliente gestiona su perfil, documentos y ve el estado de sus operaciones.

**Ver detalle en Fase 2 ✅** — esta fase se implementó junto con Customer Management.

---

### Fase 4 ✅ — Portal: Solicitud y Evaluación de Crédito *(Completada)*

**Duración:** 2-3 semanas
**DAD ref:** DAD-44 §7, DAD-32

**Logrado (3 PRs encadenados):**

**Domain + Create:**
- LoanApplication entity con state machine (`transition()`)
- LoanStatus value object con `VALID_TRANSITIONS` lookup
- Evento de dominio (timeline) registrado en cada transición
- Validación de dominio: amount, termMonths, annualRate, purpose
- Zod schemas compartidos en `packages/shared`

**Backend CRUD + Admin Review:**
- Portal endpoints: POST create, GET list, GET by id, POST cancel
- Admin endpoints: GET list (paginated), GET by id, POST assign, POST review, POST approve, POST reject, POST request-info
- `PrismaLoanApplicationRepository` con `updateStatus()` atómico (optimistic locking via status match)
- AdminGuard + CustomerGuard para separación de roles
- Comportamiento verificado con curl

**Frontend Portal:**
- `/portal/loans` — lista de solicitudes con estado
- `/portal/loans/new` — formulario: monto, plazo, propósito
- `/portal/loans/[id]` — detalle con timeline de estados

**Frontend Admin:**
- `/admin/loans` — bandeja con tabla de solicitudes pendientes
- `/admin/loans/[id]` — detalle + acciones (assign, review, approve, reject, request-info)
- AdminGuard en frontend

**Tablas:**
| Tabla | Descripción | Estado |
|-------|-------------|--------|
| loan_applications | Solicitud con amount, termMonths, annualRate, status, timeline | ✅ |
| loan_reviews | Integrada en timeline de loan_application (no tabla separada) | ✅ (embedded) |
| loan_products | Pendiente — productos se definen en configuración | 🔲 |
| approval_tasks | Pendiente — tareas separadas post-MVP | 🔲 |

---

### Fase 5 ✅ — Portal: Préstamos Activos y Pagos *(Completada)*

**Duración:** 2-3 semanas
**DAD ref:** DAD-44 §8, DAD-08, DAD-09

**Objetivo:** El cliente ve sus préstamos activos, cuotas, y puede pagar desde el portal.

**Logrado (3 chained PRs + verificación):**

#### Backend — Loans & Payments
- `Loan` domain entity con balance tracking (simplificado: no `loan_accounts` separada)
- `Installment` entity con cronograma francés automático (P * r(1+r)^n / ((1+r)^n - 1))
- `LoanTransaction` libro mayor inmutable (reemplaza `payments` + `loan_accounts`)
- `AmortizationCalculator` con 12 tests
- `DisburseLoanHandler` — desembolso atómico con creación de cronograma
- `RegisterPaymentHandler` — pago FIFO sobre cuotas pendientes (sin pagos parciales, sin sobregiro)
- `ActiveLoanQuery` + `AdminActiveLoanQuery` — consultas para portal y admin
- ActiveLoanStatus: ACTIVE → CLOSED/DEFAULTED
- InstallmentStatus: PENDING → PAID | OVERDUE | DEFAULTED
- Loan.applicationId @unique — previene doble desembolso

#### Frontend — Portal Financiero
| Ruta | Propósito |
|------|-----------|
| `/portal/loans` | Mis préstamos activos |
| `/portal/loans/:id` | Detalle: cuotas, saldo, próxima cuota |
| `/admin/loans/active` | Admin — préstamos activos |

Componentes: ActiveLoanList, ActiveLoanDetail, DisbursementButton, PaymentDialog (admin), AdminLoanActiveTable

**Tablas nuevas:** `Loan`, `Installment`, `LoanTransaction` (3, simplificadas de 5 previstas)
**SDD archive:** `openspec/changes/archive/2026-07-20-loan-disbursement-payments/`

---

### Fase 6 — Portal: Documentos Legales

**Duración:** 1 semana
**DAD ref:** DAD-44 §9, DAD-49

**Objetivo:** Generar contratos al aprobar un préstamo, visibles desde el portal.

**Backend:** `document_templates`, `generated_documents`, generación de PDF
**Frontend (Portal):** `/portal/documents/:id` — visor y descarga

**Tablas nuevas:** `document_templates`, `generated_documents`

---

### Fase 7 — Admin Backoffice

**Duración:** 2-3 semanas
**DAD ref:** DAD-45

**Objetivo:** Panel interno completo para gestión diaria del staff.

| Ruta | Propósito |
|------|-----------|
| `/admin` | Dashboard métricas |
| `/admin/customers` | Búsqueda y detalle de clientes |
| `/admin/applications` | Bandeja + evaluación |
| `/admin/loans` | Préstamos activos |
| `/admin/payments` | Registrar pagos |
| `/admin/conversations` | Conversaciones WhatsApp |
| `/admin/products` | Configurar productos |
| `/admin/users` | Usuarios internos |
| `/admin/notes` | Notas internas |

**Tabla nueva:** `admin_notes`

---

## Flujo Completo del Cliente (MVP)

```
┌─────────────────────────────────────────────────────────┐
│                   CANAL WHATSAPP                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Landing Page                                           │
│      │                                                  │
│      ▼                                                  │
│  [Botón WhatsApp]                                       │
│      │                                                  │
│      ▼                                                  │
│  Chatbot AI: "Hola, ¿en qué puedo ayudarte?"            │
│      │                                                  │
│      ├── "Quiero solicitar un préstamo"                 │
│      │      │                                           │
│      │      ▼                                           │
│      │  Bot pregunta: nombre, CI, teléfono, ingresos    │
│      │      │                                           │
│      │      ▼                                           │
│      │  → Se crea customer + loan_application (DRAFT)   │
│      │  → "Te envié un link para subir tus documentos"  │
│      │  → Cliente entra al portal                       │
│      │                                                  │
│      ├── "Quiero saber mi estado"                       │
│      │      │                                           │
│      │      ▼                                           │
│      │  Bot consulta solicitud activa → responde        │
│      │                                                  │
│      └── "Quiero pagar"                                 │
│             │                                           │
│             ▼                                           │
│         Bot informa próxima cuota → link al portal      │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                   CANAL WEB                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Landing Page → Registro → Portal Dashboard              │
│                                                         │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                 CUSTOMER PORTAL                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Dashboard → Completa perfil / Sube documentos           │
│       │                                                 │
│       ▼                                                 │
│  Solicita préstamo (elige monto y plazo)                 │
│       │                                                 │
│       ▼                                                 │
│  "En revisión" → espera evaluación                      │
│       │                                                 │
│       ▼                                                 │
│  Recibe notificación (WhatsApp): aprobado/rechazado      │
│       │                                                 │
│       ├── Rechazado → Fin                               │
│       │                                                 │
│       └── Aprobado → Acepta contrato → Préstamo activo  │
│                        │                                │
│                        ▼                                │
│             Dashboard: ve cuotas, saldo                  │
│             Paga cuotas desde el portal                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Resumen de Tablas por Fase

| Fase | Channel | Frontend | Backend | Tablas Nuevas | Acum. |
|------|---------|----------|---------|---------------|-------|
| **0** ✅ | — | Login, Register | Identity Module | 3 (users, roles, failed_login_attempts) | 3 |
| **1** ✅ | — | — | Infra compartida | 2 (audit_logs, system_configurations) | 5 |
| **2** ✅ | **WhatsApp + Portal** | Landing, Dashboard, Profile, Docs, Simulator | Customers + WhatsApp Schema | 14 (customers, addresses, phones, emails, employment, incomes, bank_accounts, documents, loan_simulations, portal_actions, whatsapp_contacts, conversations, messages, chatbot_sessions) | 19 |
| **3** ✅ | — | — | *(merged con Fase 2)* | 0 | 19 |
| **4** ✅ | **Portal + Admin** | Apply, List, Track, Admin Review | Loans: Application + Admin Review | 1 (loan_applications) | **20** |
| **5** ✅ | **Portal** | My Loans, Pay | Loans + Payments | 3 (Loan, Installment, LoanTransaction — simplified) | **23** |
| **6** | **Portal** | Document Viewer | Legal Docs | 2 (document_templates, generated_documents) | 27 |
| **7** | **Admin** | Admin Panel | Admin Backoffice | 3 (loan_products, approval_tasks, admin_notes) | **30** |

---

## Tiempo Estimado

| Fase | Tiempo | Estado |
|------|--------|--------|
| Fase 0 — Identity & Auth | — | ✅ **Completado** |
| Fase 1 — Fundación | 1 semana | ✅ **Completado** |
| Fase 2 — Portal + WhatsApp + Clientes | 2-3 semanas | ✅ **Completado** |
| Fase 3 — Portal Core | *(merged)* | ✅ **Completado** |
| Fase 4 — Solicitud y Evaluación | 2 semanas | ✅ **Completado** |
| Fase 5 — Préstamos y Pagos | 2-3 semanas | ✅ **Completado** |
| Fase 6 — Documentos Legales | 1 semana | ✅ **Completado** |
| Fase 7 — Admin Backoffice | 2-3 semanas | ✅ **Completado** |
| **WhatsApp Bot** — Migrado a Mastra AI | — | ✅ **Completado** |
| **MVP Completo** | **~10 semanas** | ✅ |

---

## Post-MVP

1. **DAD-31** — Credit Scoring AI (automatizar evaluación)
2. **DAD-35** — Payment Platform Bolivia (QR, transferencias, ACH)
3. **DAD-39** — Data Analytics & BI (reportes, dashboards)
4. **DAD-48** — Fraud Detection (antifraude automatizado)
5. **DAD-43** — Mobile Apps (React Native)
6. **DAD-38** — Partner & Ecosystem

---

## Referencias

- [Data Models](data-models.md) — Modelo de datos completo por módulo
- [Tables MVP](tables-mvp.md) — Listado detallado de todas las tablas
- [DAD-44](../DAD/44%20customer%20portal.md) — Customer Portal Platform
- [DAD-36](../DAD/36%20notification.md) — WhatsApp & Notifications
- [DAD-50](../DAD/50%20mvp%20road.md) — Documento original de roadmap MVP
