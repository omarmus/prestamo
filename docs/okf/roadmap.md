# MVP Roadmap — prestamos-app

**Basado en:** DAD-50 (MVP Implementation Roadmap) + DAD-44 (Customer Portal) + DAD-36 (WhatsApp)
**Estado:** Planning activo
**Última actualización:** 2026-07-16

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
| **Landing** | Página pública | — | ✅ Layout, HomePage | — |
| **Auth** | Identity | ✅ Register, Login, Refresh, Me | ✅ LoginForm, RegisterForm, AuthProvider | ✅ User, Role |
| **Portal** | Customer Dashboard | ❌ | ❌ | ❌ |
| **Portal** | Loan Application | ❌ | ❌ | ❌ |
| **Portal** | Document Upload | ❌ | ❌ | ❌ |
| **Portal** | Payments | ❌ | ❌ | ❌ |
| **WhatsApp** | Cloud API + Webhook | ❌ | ❌ | ❌ |
| **Chatbot** | AI Bot + Sessions | ❌ | ❌ | ❌ |
| **Backend** | Customer Management | ❌ | — | ❌ |
| **Backend** | Loan Products | ❌ | — | ❌ |
| **Backend** | Loans & Installments | ❌ | — | ❌ |
| **Backend** | Payments Engine | ❌ | — | ❌ |
| **Backend** | Legal Docs | ❌ | — | ❌ |
| **Admin** | Admin Backoffice | ❌ | ❌ | ❌ |

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

### Fase 1 — Fundación: Base de Datos & Plataforma

**Duración:** 1 semana
**DAD ref:** DAD-01, DAD-40

**Objetivo:** Preparar la infraestructura compartida que TODO lo demás necesita.

**Backend:**
- Schema Prisma centralizado con los modelos base
- Campos base en cada tabla (`organization_id`, timestamps, soft delete, version)
- Shared NestJS module: BaseEntity, BaseRepository, PrismaService global
- `audit_logs` — middleware de auditoría automática
- `system_configurations` — settings globales

**Tablas nuevas:** `audit_logs`, `system_configurations`
**Tablas modificadas:** `users`, `roles` (agregar campos base)

---

### Fase 2 ⭐ — Captación: WhatsApp + Chatbot AI

**Duración:** 2-3 semanas
**DAD ref:** DAD-36 (WhatsApp & Notifications), DAD-50 Fase 2

**Objetivo:** El cliente llega a la Landing, hace clic en WhatsApp, y un chatbot AI lo guía para registrarse y solicitar su préstamo. **Este es el canal de adquisición PRIMARIO del MVP.**

#### Estrategia

El chatbot no reemplaza al portal — lo alimenta. El bot captura datos, crea el cliente y la solicitud, y luego deriva al portal para completar documentos y hacer seguimiento.

```
Landing Page
     │
     ▼
[Contáctanos por WhatsApp]  ← botón flotante
     │
     ▼
WhatsApp Cloud API → Webhook → Chatbot AI
     │                              │
     │   ╔══════════════════════╗   │
     │   ║  ¿Ya tienes cuenta?  ║   │
     │   ║                      ║   │
     │   ║  NO → Registro:      ║   │
     │   ║   • Nombre, CI,      ║   │
     │   ║     teléfono,        ║   │
     │   ║     ingresos         ║   │
     │   ║                      ║   │
     │   ║  → Crea customer     ║   │
     │   ║  → Envía link al     ║   │
     │   ║    portal para subir ║   │
     │   ║    documentos        ║   │
     │   ║                      ║   │
     │   ║  SÍ → Consulta:      ║   │
     │   ║   • Estado solicitud ║   │
     │   ║   • Próxima cuota    ║   │
     │   ║   • Saldo            ║   │
     │   ╚══════════════════════╝   │
     │                              │
     └──→ Crea customer + loan_application
          (si aplica)
```

#### Backend — WhatsApp + Chatbot

1. **WhatsApp Cloud API**
   - Webhook para recibir mensajes entrantes
   - Envío de mensajes (texto, plantillas, imágenes)
   - Verificación de webhook (challenge)
   - Manejo de rate limits y reconnects

2. **Chatbot AI**
   - `chatbot_sessions` — estado de cada conversación (intent, state, data_collected)
   - Intents MVP:
     - `REGISTER` → capturar datos: nombre, CI, teléfono, ingresos → crear customer
     - `APPLY_LOAN` → capturar: monto, plazo, propósito → crear loan_application
     - `CHECK_STATUS` → consultar estado de solicitud activa
     - `HELP` → menú de opciones
   - Integración con API de AI (Claude/GPT) para理解和 respuesta natural
   - Fallback a menú estructurado cuando AI no responde

3. **Tablas**
   - `whatsapp_contacts`: contacto identificado
   - `whatsapp_conversations`: sesión de conversación
   - `whatsapp_messages`: cada mensaje individual
   - `chatbot_sessions`: estado del bot, intent, datos capturados

#### Frontend — Landing Page

- Botón flotante de WhatsApp con número configurable
- Metatags para compartir en WhatsApp (preview con texto)
- Landing adaptada para mobile (donde se usa WhatsApp)

**Tablas nuevas:**
| Tabla | Descripción |
|-------|-------------|
| whatsapp_contacts | Contactos identificados vía WhatsApp |
| whatsapp_conversations | Conversaciones |
| whatsapp_messages | Mensajes individuales |
| chatbot_sessions | Estado de sesión del bot AI |

---

### Fase 3 — Customer Portal Core + Clientes

**Duración:** 2-3 semanas
**DAD ref:** DAD-44, DAD-37

**Objetivo:** Construir el portal autenticado donde el cliente gestiona su perfil, documentos y ve el estado de sus operaciones.

Esto es lo que el cliente ve DESPUÉS de registrarse (por WhatsApp o web).

#### Backend — Customer Management

- Módulo Customers (NestJS, Clean Architecture)
- Tablas: `customers`, `customer_documents`, `customer_addresses`, `customer_phones`, `customer_emails`, `customer_employment`, `customer_income`, `customer_bank_accounts`
- Endpoints CRUD + subida de documentos a S3

#### Frontend — Portal Core

| Ruta | Propósito |
|------|-----------|
| `/portal/dashboard` | Dashboard: resumen, acciones rápidas |
| `/portal/profile` | Perfil y datos personales |
| `/portal/documents` | Subir y gestionar documentos |
| `/portal/simulator` | Simulador de crédito |

Dashboard del cliente (sin préstamo activo):
```
┌─────────────────────────────────────┐
│  ¡Bienvenido, Juan!                 │
│                                     │
│  📄 Documentos: 2 de 4 subidos      │
│                                     │
│  ┌──────────────┐  ┌──────────────┐ │
│  │ Solicitar     │  │ Simular      │ │
│  │ préstamo     │  │ préstamo     │ │
│  └──────────────┘  └──────────────┘ │
│                                     │
│  ¿Hablaste con nosotros por         │
│  WhatsApp? Tus datos ya están acá.  │
└─────────────────────────────────────┘
```

**Tablas nuevas:** `customers`, `customer_documents`, `customer_addresses`, `customer_phones`, `customer_emails`, `customer_employment`, `customer_income`, `customer_bank_accounts`, `loan_simulations`, `portal_actions`

---

### Fase 4 — Portal: Solicitud y Evaluación de Crédito

**Duración:** 2-3 semanas
**DAD ref:** DAD-44 §7, DAD-32

**Objetivo:** El cliente solicita un préstamo desde el portal, y el analista lo evalúa desde el admin.

#### Backend — Loan Products & Applications

- `loan_products`: catálogo (tipo, monto, plazo, tasa)
- `loan_applications`: solicitud con flujo de estados
- `loan_reviews`: revisión del analista
- `approval_tasks`: tareas asignadas

#### Frontend — Portal Aplicación

| Ruta | Propósito |
|------|-----------|
| `/portal/apply` | Seleccionar producto → monto/plazo → enviar |
| `/portal/apply/:id` | Tracking: "En revisión", "Aprobado", "Rechazado" |

#### Admin — Evaluación

| Ruta | Propósito |
|------|-----------|
| `/admin/applications` | Bandeja de solicitudes |
| `/admin/applications/:id` | Detalle + evaluar (aprobar/rechazar) |

**Tablas nuevas:** `loan_products`, `loan_applications`, `loan_reviews`, `approval_tasks`

---

### Fase 5 — Portal: Préstamos Activos y Pagos

**Duración:** 2-3 semanas
**DAD ref:** DAD-44 §8, DAD-08, DAD-09

**Objetivo:** El cliente ve sus préstamos activos, cuotas, y puede pagar desde el portal.

#### Backend — Loans & Payments

- `loans`: préstamo aprobado
- `loan_accounts`: balance financiero
- `installments`: cronograma con generación automática
- `loan_transactions`: libro mayor inmutable
- `payments`: registro de pagos (cash, transfer, other)
- Cálculo de intereses y mora

#### Frontend — Portal Financiero

| Ruta | Propósito |
|------|-----------|
| `/portal/loans` | Mis préstamos |
| `/portal/loans/:id` | Detalle: cuotas, saldo, próxima cuota |
| `/portal/loans/:id/pay` | Pagar cuota |

Dashboard con préstamo activo:
```
┌─────────────────────────────────────┐
│  Préstamo Bs5,000                   │
│  Saldo: Bs2,800  ▼░░░░░░░░░ 44%    │
│                                     │
│  Próxima cuota: Bs350               │
│  Vence: 15 agosto                   │
│                                     │
│  ┌──────────────────────────────┐   │
│  │ [Pagar cuota]                │   │
│  └──────────────────────────────┘   │
│                                     │
│  Cuotas:                            │
│  ┌──┬────────┬───────┬──────────┐  │
│  │ #│ Vence  │ Monto │ Estado   │  │
│  ├──┼────────┼───────┼──────────┤  │
│  │ 1│ 15/06  │ 350   │ ✅ Pagada│  │
│  │ 2│ 15/07  │ 350   │ ✅ Pagada│  │
│  │ 3│ 15/08  │ 350   │ ⏳ Pend. │  │
│  └──┴────────┴───────┴──────────┘  │
└─────────────────────────────────────┘
```

#### Admin — Gestión

| Ruta | Propósito |
|------|-----------|
| `/admin/loans` | Todos los préstamos activos |
| `/admin/payments` | Registrar pago manual |

**Tablas nuevas:** `loans`, `loan_accounts`, `installments`, `loan_transactions`, `payments`

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
| **0** ✅ | — | Login, Register | Identity Module | 2 (users, roles) | 2 |
| **1** | — | — | Infra compartida | 2 (audit_logs, system_configurations) | 4 |
| **2** ⭐ | **WhatsApp** | Widget Landing | WhatsApp Cloud + Chatbot AI | 4 (whatsapp_contacts, conversations, messages, chatbot_sessions) | 8 |
| **3** | **Portal** | Dashboard, Perfil, Docs | Customers Module | 10 (customers, customer_documents, addresses, phones, emails, employment, income, bank_accounts, loan_simulations, portal_actions) | 18 |
| **4** | **Portal** | Apply Loan, Track | Loan Products + Applications | 4 (loan_products, loan_applications, loan_reviews, approval_tasks) | 22 |
| **5** | **Portal** | My Loans, Pay | Loans + Payments | 5 (loans, loan_accounts, installments, loan_transactions, payments) | 27 |
| **6** | **Portal** | Document Viewer | Legal Docs | 2 (document_templates, generated_documents) | 29 |
| **7** | **Admin** | Admin Panel | Admin Backoffice | 1 (admin_notes) | **30** |

---

## Tiempo Estimado

| Fase | Tiempo |
|------|--------|
| Fase 1 — Fundación | 1 semana |
| Fase 2 — WhatsApp + Chatbot ⭐ | 2-3 semanas |
| Fase 3 — Portal Core + Clientes | 2-3 semanas |
| Fase 4 — Solicitud y Evaluación | 2 semanas |
| Fase 5 — Préstamos y Pagos | 2-3 semanas |
| Fase 6 — Documentos Legales | 1 semana |
| Fase 7 — Admin Backoffice | 2-3 semanas |
| **Total restante** | **12-16 semanas** |
| **Total acumulado** | **~4 meses** |

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
