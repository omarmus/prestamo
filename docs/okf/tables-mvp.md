# Tablas MVP — prestamos-app

Listado completo de todas las tablas del MVP, con referencia al DAD de origen y al modelo de datos completo en `data-models.md`.

**Total:** 30 tablas (20 implementadas en Prisma, 10 pendientes)
**Fuente:** DAD-44 + DAD-50 + `data-models.md` (extraído de DAD 01-49)

---

## Convenciones Generales

Toda tabla del sistema sigue estas reglas (definidas en DAD-01):

| Regla | Estándar |
|-------|----------|
| Primary Key | `id` UUID v7 |
| Nombres tablas | plural_snake_case |
| Nombres columnas | snake_case |
| Foreign Keys | `tabla_id` (ej: `customer_id`) |
| Timestamps | `created_at`, `updated_at` timestamptz (UTC) |
| Soft Delete | `deleted_at`, `deleted_by` |
| Multi Tenant | `organization_id` UUID |
| Versión | `version` integer (optimistic locking) |
| Auditoría | `created_by`, `updated_by` UUID |
| Decimales | `numeric(18,2)` montos, `numeric(10,6)` tasas |

---

## Fase 0 ✅ — Identity & Auth

### users

| Propiedad | Valor |
|-----------|-------|
| **DAD ref** | DAD-02, DAD-40 |
| **Modelo completo** | `data-models.md` → 02 — Identity & Access Management |
| **Estado** | ✅ Implementada en Prisma |
| **Descripción** | Usuarios del sistema (internos + clientes) |

Campos actuales en Prisma:
`id`, `email`, `passwordHash`, `name`, `phone`, `roleId`, `createdAt`, `updatedAt`

**Pendiente MVP:** Agregar `organization_id`, `status`, `last_login_at`, `failed_attempts`, `locked_until`, soft delete.

### roles

| Propiedad | Valor |
|-----------|-------|
| **DAD ref** | DAD-02, DAD-40 |
| **Modelo completo** | `data-models.md` → 02 — Identity & Access Management |
| **Estado** | ✅ Implementada en Prisma |
| **Descripción** | Roles del sistema (ADMIN, ANALYST, CUSTOMER) |

Campos actuales: `id`, `name` (único), `createdAt`.

**Pendiente MVP:** Agregar `code`, `description`, campos base.

---

## Fase 1 — Fundación: Base de Datos & Plataforma

### audit_logs

| Propiedad | Valor |
|-----------|-------|
| **DAD ref** | DAD-40 |
| **Modelo completo** | `data-models.md` → 40 — Security Architecture Platform |
| **Estado** | ✅ Implementada en Prisma |
| **Descripción** | Registro de auditoría de todas las operaciones |

Campos: `id` (BigInt autoincrement), `entityType`, `entityId`, `action`, `actorId`, `changes` (Json), `sourceIp`, `createdAt`.

### system_configurations

| Propiedad | Valor |
|-----------|-------|
| **DAD ref** | DAD-45 |
| **Modelo completo** | `data-models.md` → 45 — Admin Backoffice Platform |
| **Estado** | ✅ Implementada en Prisma |
| **Descripción** | Configuraciones globales del sistema |

Campos: `key` (PK), `value` (Json), `description`, `updatedById`, `updatedAt`.

---

## Fase 2 ⭐ — Captación: WhatsApp + Chatbot AI

*Canal de adquisición PRIMARIO del MVP. Estas tablas soportan las conversaciones WhatsApp y las sesiones del chatbot AI que capturan clientes.*

### whatsapp_contacts

| Propiedad | Valor |
|-----------|-------|
| **DAD ref** | DAD-36 |
| **Modelo completo** | `data-models.md` → 36 — Notification & Communication Platform |
| **Estado** | ✅ Schema en Prisma (endpoints pendientes) |
| **Descripción** | Contactos de WhatsApp identificados |

Campos actuales: `id`, `phone` (unique), `name`, `userId` (FK User, unique), `conversations`, `createdAt`, `updatedAt`.

### whatsapp_conversations

| Propiedad | Valor |
|-----------|-------|
| **DAD ref** | DAD-36 |
| **Modelo completo** | `data-models.md` → 36 — Notification & Communication Platform |
| **Estado** | ✅ Schema en Prisma (endpoints pendientes) |
| **Descripción** | Conversaciones por WhatsApp |

Campos actuales: `id`, `contactId` (FK), `messages`, `createdAt`, `updatedAt`.

### whatsapp_messages

| Propiedad | Valor |
|-----------|-------|
| **DAD ref** | DAD-36 |
| **Modelo completo** | `data-models.md` → 36 — Notification & Communication Platform |
| **Estado** | ✅ Schema en Prisma (endpoints pendientes) |
| **Descripción** | Mensajes individuales de WhatsApp |

Campos actuales: `id`, `conversationId`, `direction` (incoming/outgoing), `messageType` (text/interactive/image), `content`, `metaId`, `status` (sent/delivered/read/failed), `createdAt`.

### chatbot_sessions

| Propiedad | Valor |
|-----------|-------|
| **DAD ref** | DAD-36 |
| **Modelo completo** | `data-models.md` → 36 — Notification & Communication Platform |
| **Estado** | ✅ Schema en Prisma (endpoints pendientes) |
| **Descripción** | Sesiones del chatbot AI. Mantiene estado y datos capturados del cliente |

Campos actuales: `id`, `phone` (unique), `intent` (REGISTER/APPLY_LOAN/CHECK_STATUS/HELP), `state`, `data` (Json), `createdAt`, `updatedAt`.

---

## Fase 3 ⭐ — Portal: Core + Clientes

*El portal autenticado donde el cliente gestiona su perfil, documentos y visualiza su estado financiero.*

### customers

| Propiedad | Valor |
|-----------|-------|
| **DAD ref** | DAD-37, DAD-44 |
| **Modelo completo** | `data-models.md` → 04 — Customer Management & KYC, 37 — Identity & KYC |
| **Estado** | ✅ Implementada + API CRUD |
| **Descripción** | Datos principales del cliente financiero |

Campos actuales: `id`, `userId` (FK User, unique), `firstName`, `lastName`, `documentType`, `documentNumber`, `birthDate`, `gender`, `maritalStatus`, `occupation`, `monthlyIncome` (Decimal), `status` (REGISTERED / VERIFIED), `kycStatus`, campos base + relaciones a addresses, phones, emails, employment, incomes, bankAccounts, documents, simulations, portalActions.

### customer_documents

| Propiedad | Valor |
|-----------|-------|
| **DAD ref** | DAD-37, DAD-44 |
| **Modelo completo** | `data-models.md` → 04 — Customer Management & KYC, 06 — Document Management |
| **Estado** | ✅ Implementada + Upload endpoint |
| **Descripción** | Documentos subidos por el cliente (CI, selfie, comprobantes) |

Campos actuales: `id`, `customerId`, `type` (CI_FRONT, CI_BACK, SELFIE, PAYSLIP, BANK_STATEMENT, SERVICE_BILL), `fileName`, `mimeType`, `data` (base64, ponytail: S3 post-MVP), `notes`, `status` (PENDING / VERIFIED / REJECTED).

### customer_addresses

| Propiedad | Valor |
|-----------|-------|
| **DAD ref** | DAD-04 |
| **Modelo completo** | `data-models.md` → 04 — Customer Management & KYC |
| **Estado** | ✅ Implementada en Prisma |
| **Descripción** | Direcciones del cliente |

Campos actuales: `id`, `customerId`, `type` (HOME/WORK/CORRESPONDENCE), `country`, `department`, `city`, `zone`, `street`, `number`, `isPrimary`.

### customer_phones

| Propiedad | Valor |
|-----------|-------|
| **DAD ref** | DAD-04 |
| **Modelo completo** | `data-models.md` → 04 — Customer Management & KYC |
| **Estado** | ✅ Implementada en Prisma |
| **Descripción** | Teléfonos del cliente |

Campos actuales: `id`, `customerId`, `phone`, `isWhatsApp`, `isPrimary`.

### customer_emails

| Propiedad | Valor |
|-----------|-------|
| **DAD ref** | DAD-04 |
| **Modelo completo** | `data-models.md` → 04 — Customer Management & KYC |
| **Estado** | ✅ Implementada en Prisma |
| **Descripción** | Correos electrónicos del cliente |

Campos actuales: `id`, `customerId`, `email`, `isPrimary`.

### customer_employment

| Propiedad | Valor |
|-----------|-------|
| **DAD ref** | DAD-04 |
| **Modelo completo** | `data-models.md` → 04 — Customer Management & KYC |
| **Estado** | ✅ Implementada en Prisma |
| **Descripción** | Información laboral del cliente |

Campos actuales: `id`, `customerId` (unique), `employer`, `position`, `employmentStatus` (EMPLOYEE/SELF_EMPLOYED/BUSINESS_OWNER/UNEMPLOYED), `monthlySalary` (Decimal), `yearsWorking`.

### customer_income

| Propiedad | Valor |
|-----------|-------|
| **DAD ref** | DAD-04 |
| **Modelo completo** | `data-models.md` → 04 — Customer Management & KYC |
| **Estado** | ✅ Implementada en Prisma |
| **Descripción** | Fuentes de ingreso (soporta múltiples) |

Campos actuales: `id`, `customerId`, `source` (SALARY/BUSINESS/RENT/COMMISSION/PENSION/OTHER), `amount` (Decimal), `frequency` (MONTHLY/BIWEEKLY/WEEKLY/YEARLY).

### customer_bank_accounts

| Propiedad | Valor |
|-----------|-------|
| **DAD ref** | DAD-04 |
| **Modelo completo** | `data-models.md` → 04 — Customer Management & KYC |
| **Estado** | ✅ Implementada en Prisma |
| **Descripción** | Cuentas bancarias del cliente para desembolsos |

Campos actuales: `id`, `customerId`, `bank`, `accountType` (SAVINGS/CHECKING), `accountNumber`, `holderName`, `isPrimary`.

### loan_simulations *(Portal)*

| Propiedad | Valor |
|-----------|-------|
| **DAD ref** | DAD-44 §6 Simulador Crédito |
| **Modelo completo** | `data-models.md` → 44 — Customer Portal Platform |
| **Estado** | ✅ Implementada + API |
| **Descripción** | Simulaciones de crédito realizadas por clientes desde el portal |

Campos actuales: `id`, `customerId`, `amount` (Decimal), `termMonths`, `annualRate` (Decimal), `monthlyPayment` (Decimal), `schedule` (Json), `applications` (relation).

> Esta tabla permite trackear qué están simulando los clientes, incluso si no llegan a aplicar.

### portal_actions *(Portal)*

| Propiedad | Valor |
|-----------|-------|
| **DAD ref** | DAD-44 |
| **Modelo completo** | `data-models.md` → 44 — Customer Portal Platform |
| **Estado** | ✅ Implementada en Prisma |
| **Descripción** | Registro de acciones del cliente en el portal (clicks, navegación) |

Campos actuales: `id`, `customerId`, `action`, `metadata` (Json).

> **ponytail:** Tabla liviana, insert-only. Sirve para entender comportamiento del cliente sin analytics externo.

---

## Fase 4 — Portal: Solicitud de Crédito

### loan_products

| Propiedad | Valor |
|-----------|-------|
| **DAD ref** | DAD-32 |
| **Modelo completo** | `data-models.md` → 08 — Loan Core Banking, 32 — Loan Management, 46 — Product Configuration |
| **Estado** | 🔲 Pendiente |
| **Descripción** | Catálogo de productos de crédito visibles desde el portal |

Campos MVP: `id`, `name`, `code`, `min_amount`, `max_amount`, `min_term`, `max_term`, `interest_rate`, `currency`, `active`.

### loan_applications

| Propiedad | Valor |
|-----------|-------|
| **DAD ref** | DAD-32 |
| **Modelo completo** | `data-models.md` → 05 — Loan Application, 32 — Loan Management |
| **Estado** | ✅ Implementada + API + Frontend |
| **Descripción** | Solicitudes de préstamo creadas por el cliente desde el portal |

Campos actuales: `id`, `customerId`, `simulationId`, `amount` (Decimal), `termMonths`, `annualRate` (Decimal), `monthlyPayment` (Decimal), `totalInterest` (Decimal), `totalPayment` (Decimal), `purpose`, `status` (DRAFT / PENDING / IN_REVIEW / INFO_REQUESTED / APPROVED / REJECTED / CANCELLED), `riskScore`, `timeline` (Json), `reviewerId`, `reviewNotes`, `reviewedAt`, `createdAt`, `updatedAt`.

Índices: `[customerId]`, `[status]`, `[reviewerId]`, `[createdAt]`.

### loan_reviews

| Propiedad | Valor |
|-----------|-------|
| **DAD ref** | DAD-32 |
| **Modelo completo** | `data-models.md` → 05 — Loan Application, 07 — Credit Decision Engine |
| **Estado** | 🔲 Pendiente |
| **Descripción** | Revisión del analista. El resultado se refleja en el portal |

Campos MVP: `id`, `application_id`, `reviewer_id`, `decision` (APPROVE / REJECT / MORE_INFO), `notes`, `created_at`.

### approval_tasks

| Propiedad | Valor |
|-----------|-------|
| **DAD ref** | DAD-45 |
| **Modelo completo** | `data-models.md` → 45 — Admin Backoffice Platform |
| **Estado** | 🔲 Pendiente |
| **Descripción** | Tareas de aprobación asignadas a analistas |

Campos MVP: `id`, `application_id`, `assigned_user`, `status` (PENDING / COMPLETED / SKIPPED), `due_date`, `created_at`.

---

## Fase 5 — Portal: Préstamos Activos y Pagos

### loans

| Propiedad | Valor |
|-----------|-------|
| **DAD ref** | DAD-32 |
| **Modelo completo** | `data-models.md` → 08 — Loan Core Banking, 32 — Loan Management |
| **Estado** | 🔲 Pendiente |
| **Descripción** | Préstamo activo. Visible en el dashboard del portal |

Campos MVP: `id`, `customer_id`, `application_id`, `loan_number`, `principal_amount`, `interest_amount`, `total_amount`, `start_date`, `end_date`, `status`, `opened_at`, `closed_at`.

### loan_accounts

| Propiedad | Valor |
|-----------|-------|
| **DAD ref** | DAD-08 |
| **Modelo completo** | `data-models.md` → 08 — Loan Core Banking |
| **Estado** | 🔲 Pendiente |
| **Descripción** | Cuenta financiera del préstamo. Fuente de verdad para el saldo en el portal |

Campos MVP: `id`, `loan_id`, `principal_balance`, `interest_balance`, `fee_balance`, `penalty_balance`, `total_balance`, `next_due_date`.

### installments

| Propiedad | Valor |
|-----------|-------|
| **DAD ref** | DAD-08 |
| **Modelo completo** | `data-models.md` → 08 — Loan Core Banking |
| **Estado** | 🔲 Pendiente |
| **Descripción** | Cuotas del cronograma. Se muestran en el portal como "Mis Cuotas" |

Campos MVP: `id`, `loan_id`, `installment_number`, `due_date`, `principal`, `interest`, `fees`, `penalties`, `total`, `paid`, `status` (PENDING / PAID / PARTIAL / OVERDUE / DEFAULTED).

### loan_transactions

| Propiedad | Valor |
|-----------|-------|
| **DAD ref** | DAD-08 |
| **Modelo completo** | `data-models.md` → 08 — Loan Core Banking |
| **Estado** | 🔲 Pendiente |
| **Descripción** | Libro mayor del préstamo. Inmutable — nunca modificar. Respalda el historial del portal |

Campos MVP: `id`, `loan_id`, `transaction_type` (DISBURSEMENT / PAYMENT / INTEREST / FEE / PENALTY / ADJUSTMENT), `amount`, `balance_after`, `reference`, `created_at`.

### payments

| Propiedad | Valor |
|-----------|-------|
| **DAD ref** | DAD-35 |
| **Modelo completo** | `data-models.md` → 09 — Payment Hub & QR Banking |
| **Estado** | 🔲 Pendiente |
| **Descripción** | Pagos registrados. El cliente puede registrar pagos desde el portal |

Campos MVP: `id`, `loan_id`, `customer_id`, `amount`, `payment_date`, `method` (CASH / TRANSFER / OTHER), `reference`, `status` (PENDING / COMPLETED / FAILED / REVERSED).

---

## Fase 6 — Portal: Documentos Legales

### document_templates

| Propiedad | Valor |
|-----------|-------|
| **DAD ref** | DAD-49 |
| **Modelo completo** | `data-models.md` → 49 — Legal Documents & Contract Management |
| **Estado** | 🔲 Pendiente |
| **Descripción** | Plantillas de documentos legales (contratos, pagarés) |

Campos MVP: `id`, `code`, `name`, `type`, `content_template`, `version`, `active`.

### generated_documents

| Propiedad | Valor |
|-----------|-------|
| **DAD ref** | DAD-49 |
| **Modelo completo** | `data-models.md` → 49 — Legal Documents & Contract Management |
| **Estado** | 🔲 Pendiente |
| **Descripción** | Documentos generados. Visibles y descargables desde el portal |

Campos MVP: `id`, `customer_id`, `loan_id`, `template_id`, `type`, `file_url`, `generated_at`, `signed_at`.

---

## Fase 7 — Admin Backoffice

### admin_notes

| Propiedad | Valor |
|-----------|-------|
| **DAD ref** | DAD-45 |
| **Modelo completo** | `data-models.md` → 45 — Admin Backoffice Platform |
| **Estado** | 🔲 Pendiente |
| **Descripción** | Notas internas del equipo sobre clientes, solicitudes, etc. |

Campos MVP: `id`, `user_id`, `customer_id` (nullable), `application_id` (nullable), `note`, `created_at`.

---

## Resumen

| # | Tabla | Fase | DAD Ref | Canal | Estado |
|---|-------|------|---------|-------|--------|
| 1 | users | Fase 0 | DAD-02, DAD-40 | Portal + Admin | ✅ |
| 2 | roles | Fase 0 | DAD-02, DAD-40 | Admin | ✅ |
| 3 | audit_logs | Fase 1 | DAD-40 | — | ✅ |
| 4 | system_configurations | Fase 1 | DAD-45 | Admin | ✅ |
| 5 | whatsapp_contacts | **Fase 2** ⭐ | DAD-36 | 📱 WhatsApp | ✅ (schema) |
| 6 | whatsapp_conversations | **Fase 2** ⭐ | DAD-36 | 📱 WhatsApp | ✅ (schema) |
| 7 | whatsapp_messages | **Fase 2** ⭐ | DAD-36 | 📱 WhatsApp | ✅ (schema) |
| 8 | chatbot_sessions | **Fase 2** ⭐ | DAD-36 | 📱 WhatsApp | ✅ (schema) |
| 9 | customers | Fase 3 | DAD-37, DAD-44 | 🟦 Portal | ✅ |
| 10 | customer_documents | Fase 3 | DAD-37, DAD-44 | 🟦 Portal | ✅ |
| 11 | customer_addresses | Fase 3 | DAD-04 | 🟦 Portal | ✅ |
| 12 | customer_phones | Fase 3 | DAD-04 | 🟦 Portal | ✅ |
| 13 | customer_emails | Fase 3 | DAD-04 | 🟦 Portal | ✅ |
| 14 | customer_employment | Fase 3 | DAD-04 | 🟦 Portal | ✅ |
| 15 | customer_income | Fase 3 | DAD-04 | 🟦 Portal | ✅ |
| 16 | customer_bank_accounts | Fase 3 | DAD-04 | 🟦 Portal | ✅ |
| 17 | loan_simulations | Fase 3 | DAD-44 | 🟦 Portal | ✅ |
| 18 | portal_actions | Fase 3 | DAD-44 | 🟦 Portal | ✅ |
| 19 | loan_products | Fase 4 | DAD-32 | 🟦 Portal | 🔲 |
| 20 | loan_applications | Fase 4 | DAD-32 | 🟦 Portal | ✅ |
| 21 | loan_reviews | Fase 4 | DAD-32 | Admin | ✅ (embedded) |
| 22 | approval_tasks | Fase 4 | DAD-45 | Admin | 🔲 |
| 23 | loans | Fase 5 | DAD-32 | 🟦 Portal | 🔲 |
| 24 | loan_accounts | Fase 5 | DAD-08 | 🟦 Portal | 🔲 |
| 25 | installments | Fase 5 | DAD-08 | 🟦 Portal | 🔲 |
| 26 | loan_transactions | Fase 5 | DAD-08 | 🟦 Portal | 🔲 |
| 27 | payments | Fase 5 | DAD-35 | 🟦 Portal | 🔲 |
| 28 | document_templates | Fase 6 | DAD-49 | Admin | 🔲 |
| 29 | generated_documents | Fase 6 | DAD-49 | 🟦 Portal | 🔲 |
| 30 | admin_notes | Fase 7 | DAD-45 | Admin | 🔲 |

**Legend:** ✅ = Implementada en Prisma + API, ✅ (schema) = Schema en Prisma (endpoints pendientes), 🔲 = Pendiente, 📱 = WhatsApp/Landing, 🟦 = Customer Portal

> **Estado:** 20/30 tablas implementadas en Prisma (Fases 0-4 completas). Fases 5-7 pendientes.
> **Canal de entrada:** Las 4 tablas de WhatsApp (Fase 2) son el canal de adquisición. Las 16 tablas del Portal (Fases 3-6) son la experiencia post-registro. El Admin (Fase 7) es operación interna.

---

## Tablas Diferidas (Post-MVP)

Estas tablas existen en el modelo de datos completo pero no son necesarias para el MVP:

| Tabla | DAD | Motivo |
|-------|-----|--------|
| permissions | DAD-02 | Permisos granulares, MVP usa roles simples |
| user_roles | DAD-02 | Hoy se maneja vía `roleId` directo en User |
| sessions | DAD-02 | Sesiones con refresh token implícito en JWT |
| refresh_tokens | DAD-02 | Rotation ya implementada, tabla opcional para MVP |
| mfa_devices | DAD-02 | MFA se agrega post-MVP |
| api_keys | DAD-02 | Integraciones externas futuras |
| leads | DAD-03 | CRM completo post-MVP |
| loan_offers | DAD-08 | Ofertas automáticas, MVP usa aprobación manual |
| loan_guarantees | DAD-08 | Garantías formales post-MVP |
| loan_restructures | DAD-08 | Reestructuraciones post-MVP |
| ocr_results | DAD-06 | OCR automatizado post-MVP |
| biometric_validations | DAD-06 | Biometría post-MVP |
| electronic_signatures | DAD-49 | Firma electrónica post-MVP |
| notification_templates | DAD-36 | Notificaciones push/email post-MVP |
| kyc_cases | DAD-37 | KYC automatizado post-MVP |
| customer_sessions | DAD-44 | Sesiones de portal, se manejan con JWT |
| customer_preferences | DAD-44 | Preferencias, se guardan como JSONB en customers para MVP |
| document_access_logs | DAD-44 | Auditoría de acceso a documentos post-MVP |

---

## Referencia

- [Roadmap](roadmap.md) — Fases y plan de implementación con el portal como eje
- [Data Models](data-models.md) — Modelo de datos completo del DAD
- [DAD-44](../DAD/44%20customer%20portal.md) — Customer Portal Platform
- [DAD-50](../DAD/50%20mvp%20road.md) — Documento original de roadmap
