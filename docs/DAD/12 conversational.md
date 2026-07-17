# Data Architecture Document (DAD)

# Parte XII

# Conversational Banking Platform

Versión 1.0

---

# Tabla de Contenido

1. Objetivo
2. Arquitectura
3. Aggregate Roots
4. Canales
5. Flujo Conversacional
6. Estados
7. Entidades
8. Eventos
9. Modelo de Datos
10. Reglas

---

# 1. Objetivo

Administrar toda la comunicación entre la fintech y el cliente.

No solamente enviar mensajes.

Administrar conversaciones.

Automatizaciones.

IA.

Campañas.

Recordatorios.

Seguimientos.

Escalamiento humano.

---

# 2. Arquitectura

```

Landing

↓

WhatsApp

↓

Conversation Engine

↓

AI Agent

↓

Business Rules

↓

Human Agent

↓

Loan Platform

```

---

# 3. Aggregate Roots

Conversation

ConversationSession

Message

Campaign

Template

---

# 4. Canales

WhatsApp

Email

SMS

Push

Telegram

Facebook

Instagram

Web Chat

Voice

---

# 5. Flujo

```

Cliente

↓

WhatsApp

↓

Bot

↓

Identificación

↓

Consulta Contexto

↓

IA

↓

Responder

↓

Registrar Acción

↓

Actualizar CRM

↓

Continuar

```

---

# 6. Estados

ConversationStatus

```

OPEN

WAITING_CUSTOMER

WAITING_AI

WAITING_AGENT

CLOSED

ARCHIVED

```

---

MessageStatus

```

QUEUED

SENDING

SENT

DELIVERED

READ

FAILED

```

---

CampaignStatus

```

DRAFT

RUNNING

PAUSED

FINISHED

```

---

# 7. Entidades

Conversation

ConversationSession

ConversationContext

Message

Attachment

Template

Campaign

Broadcast

Notification

Reminder

Webhook

AIInteraction

HumanTransfer

ConversationIntent

ConversationMemory

---

# 8. Eventos

ConversationStarted

MessageReceived

MessageSent

AIResponded

AgentAssigned

ConversationClosed

ReminderTriggered

CampaignExecuted

WebhookReceived

---

# 9. Modelo de Datos

---

## conversations

| Campo |
|--------|
| id |
| customer_id |
| lead_id |
| channel |
| status |
| current_agent |
| started_at |
| closed_at |

---

## conversation_sessions

Cada conversación puede tener varias sesiones.

| Campo |
|--------|
| id |
| conversation_id |
| started_at |
| finished_at |

---

## messages

| Campo |
|--------|
| id |
| conversation_id |
| sender |
| direction |
| type |
| body |
| media_document_id |
| delivered |
| read_at |
| created_at |

---

## message_templates

Plantillas oficiales.

| Campo |
|--------|
| id |
| provider |
| template_name |
| language |
| category |
| active |

---

## campaigns

Campañas.

Ejemplos

Bienvenida

Cobranza

Promoción

Recordatorio

Reactivación

---

## broadcasts

Envíos masivos.

---

## reminders

Recordatorios automáticos.

Ejemplos

Pago mañana

Documento pendiente

Contrato pendiente

Promesa de pago

---

## notifications

Registro universal.

Todo mensaje enviado.

---

## webhooks

Eventos recibidos desde proveedores.

---

## conversation_context

Contexto utilizado por IA.

| Campo |
|--------|
| id |
| conversation_id |
| summary |
| last_intent |
| customer_state |
| updated_at |

---

## ai_interactions

Registro de IA.

| Campo |
|--------|
| id |
| conversation_id |
| provider |
| model |
| prompt_version |
| tokens_input |
| tokens_output |
| latency |
| cost |
| recommendation |
| response |
| created_at |

---

## conversation_intents

Clasificación.

Ejemplos

Solicitar préstamo

Consultar saldo

Pagar

Refinanciar

Cancelar

Hablar con asesor

Enviar documento

---

## human_transfers

Transferencias.

| Campo |
|--------|
| id |
| conversation_id |
| transferred_to |
| reason |
| accepted_at |

---

## conversation_memory

Memoria resumida.

Nunca guardar todo el historial como contexto.

Guardar resúmenes.

| Campo |
|--------|
| id |
| conversation_id |
| summary |
| created_at |

---

# 10. Reglas

Nunca perder conversaciones.

Toda conversación genera historial.

La IA nunca inventa información financiera.

La IA consulta primero el Core.

Las respuestas críticas requieren validación.

El cliente puede solicitar un asesor humano en cualquier momento.

Toda interacción IA guarda costo.

---

# AI Agent

El agente tendrá herramientas (Tools).

Podrá consultar:

CRM

Customer

Loan

Payments

Collections

QR

Documentos

Productos

Campañas

---

# Ejemplo

Cliente

"¿Cuánto debo?"

↓

Tool

LoanService

↓

Saldo

↓

IA

↓

"Su saldo pendiente es Bs 2.450"

---

# KPIs

Tiempo de respuesta

Tiempo IA

Transferencias a humano

Costo IA

Conversaciones cerradas

Conversaciones abiertas

Tasa de automatización

Satisfacción

---

# Tablas Totales

1 conversations

2 conversation_sessions

3 messages

4 message_templates

5 campaigns

6 broadcasts

7 reminders

8 notifications

9 webhooks

10 conversation_context

11 ai_interactions

12 conversation_intents

13 human_transfers

14 conversation_memory

Total

14 tablas

---

# Próximo Documento

DAD-13

Workflow & BPM Engine

Aquí construiremos un motor de procesos configurable para que cualquier flujo de negocio (solicitudes, KYC, aprobación, cobranza, reclamos, etc.) pueda modificarse desde el panel de administración sin necesidad de desplegar una nueva versión del sistema.