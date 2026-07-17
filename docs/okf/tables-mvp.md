# Tablas MVP — prestamos-app

Listado completo de todas las tablas del MVP, con referencia al DAD de origen y al modelo de datos completo en `data-models.md`.

**Total:** 30 tablas
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
| **Estado** | 🔲 Pendiente |
| **Descripción** | Registro de auditoría de todas las operaciones |

Campos: `id`, `user_id`, `action`, `entity`, `entity_id`, `ip`, `metadata`, `created_at`.

### system_configurations

| Propiedad | Valor |
|-----------|-------|
| **DAD ref** | DAD-45 |
| **Modelo completo** | `data-models.md` → 45 — Admin Backoffice Platform |
| **Estado** | 🔲 Pendiente |
| **Descripción** | Configuraciones globales del sistema |

Campos: `id`, `key`, `value`, `type`, `description`, `updated_by`.

---

## Fase 2 ⭐ — Captación: WhatsApp + Chatbot AI

*Canal de adquisición PRIMARIO del MVP. Estas tablas soportan las conversaciones WhatsApp y las sesiones del chatbot AI que capturan clientes.*

### whatsapp_contacts

| Propiedad | Valor |
|-----------|-------|
| **DAD ref** | DAD-36 |
| **Modelo completo** | `data-models.md` → 36 — Notification & Communication Platform |
| **Estado** | 🔲 Pendiente |
| **Descripción** | Contactos de WhatsApp identificados |

Campos MVP: `id`, `phone`, `customer_id`, `status`, `created_at`.

### whatsapp_conversations

| Propiedad | Valor |
|-----------|-------|
| **DAD ref** | DAD-36 |
| **Modelo completo** | `data-models.md` → 36 — Notification & Communication Platform |
| **Estado** | 🔲 Pendiente |
| **Descripción** | Conversaciones por WhatsApp |

Campos MVP: `id`, `customer_id`, `started_at`, `ended_at`, `status`.

### whatsapp_messages

| Propiedad | Valor |
|-----------|-------|
| **DAD ref** | DAD-36 |
| **Modelo completo** | `data-models.md` → 36 — Notification & Communication Platform |
| **Estado** | 🔲 Pendiente |
| **Descripción** | Mensajes individuales de WhatsApp |

Campos MVP: `id`, `conversation_id`, `direction` (IN/OUT), `message`, `sender`, `created_at`.

### chatbot_sessions

| Propiedad | Valor |
|-----------|-------|
| **DAD ref** | DAD-36 |
| **Modelo completo** | `data-models.md` → 36 — Notification & Communication Platform |
| **Estado** | 🔲 Pendiente |
| **Descripción** | Sesiones del chatbot AI. Mantiene estado y datos capturados del cliente |

Campos MVP: `id`, `conversation_id`, `intent`, `state`, `data_collected` (JSONB).

---

## Fase 3 ⭐ — Portal: Core + Clientes

*El portal autenticado donde el cliente gestiona su perfil, documentos y visualiza su estado financiero.*

### customers

| Propiedad | Valor |
|-----------|-------|
| **DAD ref** | DAD-37, DAD-44 |
| **Modelo completo** | `data-models.md` → 04 — Customer Management & KYC, 37 — Identity & KYC |
| **Estado** | 🔲 Pendiente |
| **Descripción** | Datos principales del cliente financiero |

Campos MVP: `id`, `organization_id`, `lead_id`, `customer_number`, `first_name`, `last_name`, `document_type`, `document_number`, `birth_date`, `gender`, `phone`, `email`, `occupation`, `monthly_income`, `status` (LEAD / REGISTERED / VERIFIED), `kyc_status`, `created_at`.

Índices: `ix_customer_number`, `ix_document`, `ix_customer_status`, `ix_customer_kyc`.

### customer_documents

| Propiedad | Valor |
|-----------|-------|
| **DAD ref** | DAD-37, DAD-44 |
| **Modelo completo** | `data-models.md` → 04 — Customer Management & KYC, 06 — Document Management |
| **Estado** | 🔲 Pendiente |
| **Descripción** | Documentos subidos por el cliente (CI, selfie, comprobantes) |

Campos MVP: `id`, `customer_id`, `type` (CI, SELFIE, PAYSLIP, BANK_STATEMENT, etc.), `file_url`, `status`, `verified_at`, `uploaded_at`.

### customer_addresses

| Propiedad | Valor |
|-----------|-------|
| **DAD ref** | DAD-04 |
| **Modelo completo** | `data-models.md` → 04 — Customer Management & KYC |
| **Estado** | 🔲 Pendiente |
| **Descripción** | Direcciones del cliente |

Campos: `id`, `customer_id`, `type`, `country`, `department`, `city`, `zone`, `street`, `number`, `primary_address`.

### customer_phones

| Propiedad | Valor |
|-----------|-------|
| **DAD ref** | DAD-04 |
| **Modelo completo** | `data-models.md` → 04 — Customer Management & KYC |
| **Estado** | 🔲 Pendiente |
| **Descripción** | Teléfonos del cliente |

Campos: `id`, `customer_id`, `phone`, `whatsapp`, `verified`, `primary_phone`.

### customer_emails

| Propiedad | Valor |
|-----------|-------|
| **DAD ref** | DAD-04 |
| **Modelo completo** | `data-models.md` → 04 — Customer Management & KYC |
| **Estado** | 🔲 Pendiente |
| **Descripción** | Correos electrónicos del cliente |

Campos: `id`, `customer_id`, `email`, `verified`, `primary_email`.

### customer_employment

| Propiedad | Valor |
|-----------|-------|
| **DAD ref** | DAD-04 |
| **Modelo completo** | `data-models.md` → 04 — Customer Management & KYC |
| **Estado** | 🔲 Pendiente |
| **Descripción** | Información laboral del cliente |

Campos: `id`, `customer_id`, `employer`, `employment_status`, `position`, `salary`, `years_working`.

### customer_income

| Propiedad | Valor |
|-----------|-------|
| **DAD ref** | DAD-04 |
| **Modelo completo** | `data-models.md` → 04 — Customer Management & KYC |
| **Estado** | 🔲 Pendiente |
| **Descripción** | Fuentes de ingreso (soporta múltiples) |

Campos: `id`, `customer_id`, `source`, `amount`, `frequency`, `verified`.

### customer_bank_accounts

| Propiedad | Valor |
|-----------|-------|
| **DAD ref** | DAD-04 |
| **Modelo completo** | `data-models.md` → 04 — Customer Management & KYC |
| **Estado** | 🔲 Pendiente |
| **Descripción** | Cuentas bancarias del cliente para desembolsos |

Campos: `id`, `customer_id`, `bank`, `account_type`, `account_number`, `holder_name`, `verified`.

### loan_simulations *(Portal)*

| Propiedad | Valor |
|-----------|-------|
| **DAD ref** | DAD-44 §6 Simulador Crédito |
| **Modelo completo** | `data-models.md` → 44 — Customer Portal Platform |
| **Estado** | 🔲 Pendiente |
| **Descripción** | Simulaciones de crédito realizadas por clientes desde el portal |

Campos MVP: `id`, `customer_id`, `amount`, `term_days`, `estimated_rate`, `estimated_payment`, `created_at`.

> Esta tabla permite trackear qué están simulando los clientes, incluso si no llegan a aplicar.

### portal_actions *(Portal)*

| Propiedad | Valor |
|-----------|-------|
| **DAD ref** | DAD-44 |
| **Modelo completo** | `data-models.md` → 44 — Customer Portal Platform |
| **Estado** | 🔲 Pendiente |
| **Descripción** | Registro de acciones del cliente en el portal (clicks, navegación) |

Campos MVP: `id`, `customer_id`, `action` (VIEW_LOANS, APPLY_CLICK, DOCUMENT_UPLOAD, etc.), `metadata`, `created_at`.

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
| **Estado** | 🔲 Pendiente |
| **Descripción** | Solicitudes de préstamo creadas por el cliente desde el portal |

Campos MVP: `id`, `customer_id`, `product_id`, `amount_requested`, `term_requested`, `purpose`, `monthly_income`, `monthly_expenses`, `status` (PENDING / REVIEW / APPROVED / REJECTED), `assigned_to`, `created_at`.

Índices: `ix_application_customer`, `ix_application_status`, `ix_application_assigned`.

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
| 3 | audit_logs | Fase 1 | DAD-40 | — | 🔲 |
| 4 | system_configurations | Fase 1 | DAD-45 | Admin | 🔲 |
| 5 | whatsapp_contacts | **Fase 2** ⭐ | DAD-36 | 📱 WhatsApp | 🔲 |
| 6 | whatsapp_conversations | **Fase 2** ⭐ | DAD-36 | 📱 WhatsApp | 🔲 |
| 7 | whatsapp_messages | **Fase 2** ⭐ | DAD-36 | 📱 WhatsApp | 🔲 |
| 8 | chatbot_sessions | **Fase 2** ⭐ | DAD-36 | 📱 WhatsApp | 🔲 |
| 9 | customers | Fase 3 | DAD-37, DAD-44 | 🟦 Portal | 🔲 |
| 10 | customer_documents | Fase 3 | DAD-37, DAD-44 | 🟦 Portal | 🔲 |
| 11 | customer_addresses | Fase 3 | DAD-04 | 🟦 Portal | 🔲 |
| 12 | customer_phones | Fase 3 | DAD-04 | 🟦 Portal | 🔲 |
| 13 | customer_emails | Fase 3 | DAD-04 | 🟦 Portal | 🔲 |
| 14 | customer_employment | Fase 3 | DAD-04 | 🟦 Portal | 🔲 |
| 15 | customer_income | Fase 3 | DAD-04 | 🟦 Portal | 🔲 |
| 16 | customer_bank_accounts | Fase 3 | DAD-04 | 🟦 Portal | 🔲 |
| 17 | loan_simulations | Fase 3 | DAD-44 | 🟦 Portal | 🔲 |
| 18 | portal_actions | Fase 3 | DAD-44 | 🟦 Portal | 🔲 |
| 19 | loan_products | Fase 4 | DAD-32 | 🟦 Portal | 🔲 |
| 20 | loan_applications | Fase 4 | DAD-32 | 🟦 Portal | 🔲 |
| 21 | loan_reviews | Fase 4 | DAD-32 | Admin | 🔲 |
| 22 | approval_tasks | Fase 4 | DAD-45 | Admin | 🔲 |
| 23 | loans | Fase 5 | DAD-32 | 🟦 Portal | 🔲 |
| 24 | loan_accounts | Fase 5 | DAD-08 | 🟦 Portal | 🔲 |
| 25 | installments | Fase 5 | DAD-08 | 🟦 Portal | 🔲 |
| 26 | loan_transactions | Fase 5 | DAD-08 | 🟦 Portal | 🔲 |
| 27 | payments | Fase 5 | DAD-35 | 🟦 Portal | 🔲 |
| 28 | document_templates | Fase 6 | DAD-49 | Admin | 🔲 |
| 29 | generated_documents | Fase 6 | DAD-49 | 🟦 Portal | 🔲 |
| 30 | admin_notes | Fase 7 | DAD-45 | Admin | 🔲 |

**Legend:** ✅ = Implementada, 🔲 = Pendiente, 📱 = WhatsApp/Landing, 🟦 = Customer Portal

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
