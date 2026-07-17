# Data Architecture Document (DAD)

# Parte XXXVI

# Notification & Communication Platform

Versión 1.0

---

# Tabla de Contenido

1. Objetivo
2. Arquitectura
3. Communication Engine
4. WhatsApp Platform
5. SMS Platform
6. Email Platform
7. Push Notifications
8. Templates
9. Automation Rules
10. Modelo de Datos
11. Eventos
12. KPIs

---

# 1. Objetivo

Crear una plataforma centralizada para gestionar toda comunicación con clientes.

---

# 2. Arquitectura

```

Business Services

        │

        ▼

Event Bus

        │

        ▼

Notification Engine


        │


 ┌──────┼──────┐


 ▼      ▼      ▼


WhatsApp SMS Email


        │


        ▼


Customer


```

---

# 3. Communication Engine

Responsabilidades:

- decidir canal;
- seleccionar plantilla;
- controlar frecuencia;
- registrar historial.

---

Ejemplo:

Evento:

```

LoanApproved


```

Acción:

```

Enviar WhatsApp bienvenida

Enviar email contrato


```

---

# 4. WhatsApp Platform

Será el canal principal.

---

Funciones:

## Conversación

Cliente pregunta.

IA responde.

---

## Mensajes transaccionales

Ejemplo:

"Tu cuota vence mañana."

---

## Botones

Ejemplo:

```

[Consultar saldo]

[Pagar cuota]

[Hablar asesor]


```

---

## Documentos

Enviar:

- contratos;
- comprobantes;
- estados.

---

# WhatsApp API

Arquitectura:

```

Backend

↓

WhatsApp Adapter

↓

Meta WhatsApp Business API


```

---

# 5. SMS Platform

Usado como respaldo.

Casos:

- OTP;
- alertas importantes;
- clientes sin WhatsApp.

---

# 6. Email Platform

Usos:

- contratos;
- reportes;
- comprobantes;
- comunicaciones legales.

---

# 7. Push Notifications

Para futura app móvil.

Ejemplos:

- pago recibido;
- nueva oferta;
- recordatorio.

---

# 8. Template Management

Las comunicaciones deben estar versionadas.

---

Ejemplo:

Template:

payment_reminder


Versión:

v1


Contenido:

"Tu cuota vence mañana"


---

Debe guardar:

- idioma;
- canal;
- versión;
- aprobación.

---

# 9. Automation Rules

Motor de automatización.

---

Ejemplos:

---

## Recordatorio cuota

Regla:

3 días antes vencimiento.

Acción:

WhatsApp.

---

## Cliente mora

Regla:

5 días atraso.

Acción:

Mensaje negociación.

---

## Cliente premium

Regla:

3 préstamos pagados.

Acción:

Oferta aumento.

---

# 10. Modelo de Datos

---

# communication_channels

Canales disponibles.

---

# notification_templates

Plantillas.

---

# template_versions

Versiones.

---

# notifications

Notificaciones creadas.

---

# notification_deliveries

Entregas.

---

# communication_preferences

Preferencias cliente.

---

# conversations

Conversaciones.

---

# conversation_messages

Mensajes.

---

# automation_rules

Reglas automáticas.

---

# automation_executions

Ejecuciones.

---

# provider_logs

Logs proveedores.

---

# Modelo Total

1 communication_channels

2 notification_templates

3 template_versions

4 notifications

5 notification_deliveries

6 communication_preferences

7 conversations

8 conversation_messages

9 automation_rules

10 automation_executions

11 provider_logs


Total:

11 tablas

---

# 11. Eventos

NotificationCreated

NotificationSent

NotificationFailed

MessageReceived

ConversationStarted

TemplateUpdated


---

# 12. KPIs

Delivery rate.

Open rate.

Response rate.

Costo comunicación.

Conversión.

---

# Tecnologías

## Backend

NestJS

---

## Queue

BullMQ

RabbitMQ

---

## WhatsApp

Meta WhatsApp Business API

---

## Email

Amazon SES

SendGrid

Mailgun

---

## Push

Firebase Cloud Messaging

---

# Próximo Documento

DAD-37

Identity & KYC Platform

Incluye:

- registro usuarios;
- validación identidad;
- OCR carnet Bolivia;
- biometría;
- verificación facial;
- seguridad;
- antifraude.