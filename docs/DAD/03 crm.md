# Data Architecture Document (DAD)

# Parte III

# CRM & Lead Management

Versión 1.0

---

# Tabla de Contenido

1. Objetivo
2. Responsabilidades
3. Aggregate Root
4. Flujo del Dominio
5. Entidades
6. Relaciones
7. Estados
8. Eventos
9. Modelo de Datos
10. Reglas de Negocio

---

# 1. Objetivo

Este dominio administra todo el ciclo comercial antes de que una persona se convierta en cliente.

El objetivo es capturar, clasificar, nutrir y convertir prospectos (Leads) en solicitudes de préstamo.

Este dominio NO administra préstamos.

NO administra clientes.

NO administra pagos.

---

# 2. Responsabilidades

• Landing

• Formularios

• WhatsApp

• Chatbot

• Leads

• Campañas

• Embudos

• Seguimiento

• Actividades

• Notas

• Conversaciones

• Conversión

---

# 3. Aggregate Root

Lead

Todo gira alrededor del Lead.

---

# 4. Flujo del Dominio

```
Landing

↓

Lead

↓

Conversación WhatsApp

↓

Precalificación

↓

Seguimiento

↓

Solicitud

↓

KYC

↓

Customer
```

---

# 5. Entidades

## Lead

Representa un posible cliente.

Todavía no ha solicitado un préstamo.

---

## Lead Source

Origen del Lead.

Ejemplos

Facebook

Instagram

TikTok

Google

WhatsApp

Referido

Landing

Campaña

---

## Campaign

Campañas publicitarias.

Ejemplo

Facebook Mayo

Google Ads

TikTok Julio

---

## Tags

Etiquetas.

Ejemplos

URGENTE

ALTO MONTO

REPETIDO

REFERIDO

VIP

ALTO RIESGO

---

## Activities

Historial de actividades.

Ejemplos

Llamada

WhatsApp

Correo

Visita

Observación

---

## Notes

Notas internas.

Nunca visibles para el cliente.

---

## Follow Ups

Seguimientos.

Ejemplo

Volver a llamar mañana.

---

## WhatsApp Conversation

Conversación completa.

---

## Attachments

Archivos enviados.

---

## Lead Assignments

Asignación a analistas.

---

# 6. Relaciones

```
Lead

│

├── Lead Source

├── Campaign

├── Tags

├── Notes

├── Activities

├── Conversations

├── Attachments

├── FollowUps

└── Assignments
```

---

# 7. Estados

## LeadStatus

```
NEW

CONTACTED

QUALIFIED

PREAPPROVED

APPLICATION_STARTED

APPLICATION_COMPLETED

CONVERTED

REJECTED

LOST
```

---

## ActivityType

```
CALL

EMAIL

WHATSAPP

VISIT

NOTE

SYSTEM
```

---

## ConversationStatus

```
OPEN

WAITING_CUSTOMER

WAITING_AGENT

CLOSED

ARCHIVED
```

---

# 8. Eventos

```
LeadCreated

LeadUpdated

LeadAssigned

LeadQualified

LeadRejected

LeadConverted

ConversationStarted

ConversationClosed

FollowUpCreated

ActivityRegistered
```

---

# 9. Modelo de Datos

---

## leads

Descripción

Prospectos registrados.

| Campo | Tipo |
|---------|----------|
| id | UUID |
| organization_id | UUID |
| source_id | UUID |
| campaign_id | UUID |
| first_name | varchar(100) |
| last_name | varchar(100) |
| phone | varchar(30) |
| email | varchar(255) |
| document_number | varchar(30) |
| requested_amount | numeric(18,2) |
| monthly_income | numeric(18,2) |
| city | varchar(100) |
| status | LeadStatus |
| score | numeric(5,2) |
| assigned_to | UUID |
| created_at | timestamptz |

Índices

```
ix_leads_phone

ix_leads_document

ix_leads_status

ix_leads_assigned

ix_leads_created_at
```

---

## lead_sources

| Campo |
|--------|
| id |
| code |
| name |
| active |

Ejemplos

FACEBOOK

GOOGLE

WHATSAPP

REFERRAL

ORGANIC

---

## campaigns

| Campo |
|--------|
| id |
| name |
| channel |
| budget |
| start_date |
| end_date |
| active |

---

## lead_tags

Relaciona Leads con Tags.

---

## tags

Ejemplos

VIP

URGENT

REFERRED

HIGH_VALUE

RETURNING

---

## lead_notes

| Campo |
|--------|
| id |
| lead_id |
| user_id |
| note |
| created_at |

---

## lead_activities

| Campo |
|--------|
| id |
| lead_id |
| activity_type |
| description |
| user_id |
| created_at |

---

## follow_ups

| Campo |
|--------|
| id |
| lead_id |
| assigned_to |
| due_date |
| completed |
| completed_at |

---

## lead_assignments

Permite reasignar Leads entre analistas.

| Campo |
|--------|
| id |
| lead_id |
| from_user |
| to_user |
| reason |
| assigned_at |

---

## conversations

Representa una conversación.

No depende únicamente de WhatsApp.

En el futuro podrá soportar:

WhatsApp

Web Chat

Telegram

Facebook Messenger

Instagram

---

| Campo |
|--------|
| id |
| lead_id |
| channel |
| status |
| started_at |
| closed_at |

---

## conversation_messages

| Campo |
|--------|
| id |
| conversation_id |
| sender |
| message_type |
| body |
| media_url |
| ai_generated |
| delivered |
| read_at |
| created_at |

---

## attachments

Archivos enviados.

| Campo |
|--------|
| id |
| lead_id |
| conversation_id |
| file_name |
| mime_type |
| storage_key |
| uploaded_by |
| uploaded_at |

---

# 10. Reglas

Un Lead puede tener varias conversaciones.

Un Lead puede pertenecer a una campaña.

Un Lead puede tener múltiples actividades.

Un Lead puede ser reasignado.

Un Lead solo puede convertirse una vez.

Nunca eliminar Leads.

Cuando un Lead se convierte en Customer:

```
Lead

↓

Status = CONVERTED

↓

Customer Created

↓

Lead permanece histórico.
```

---

# Métricas

El CRM deberá calcular automáticamente:

• Tasa de conversión

• Tiempo promedio de respuesta

• Tiempo hasta solicitud

• Tiempo hasta aprobación

• Costo por Lead

• Costo por Cliente

• ROI por campaña

• Leads por canal

• Leads perdidos

• Motivos de rechazo

---

# Tablas Totales

1. leads
2. lead_sources
3. campaigns
4. tags
5. lead_tags
6. lead_notes
7. lead_activities
8. follow_ups
9. lead_assignments
10. conversations
11. conversation_messages
12. attachments

Total

12 tablas

---

# Próximo Documento

**DAD-04 — Customer Management & KYC**

En este dominio construiremos el núcleo del cliente financiero:

- Customer
- Direcciones
- Empleo
- Ingresos
- Referencias
- Cuentas bancarias
- Documentos
- Perfil de riesgo
- Score
- Blacklist
- Beneficiarios
- Dependientes
- Información tributaria

Este será uno de los dominios más grandes de toda la plataforma.