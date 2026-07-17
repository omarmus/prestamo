# Data Architecture Document (DAD)

# Parte XXVI

# Customer Experience Platform

Versión 1.0

---

# Tabla de Contenido

1. Objetivo
2. Canales digitales
3. Customer Portal
4. WhatsApp Experience
5. Mobile Application
6. Self Service
7. Customer Profile
8. Modelo de Datos
9. Eventos
10. KPIs

---

# 1. Objetivo

Crear una experiencia digital completa para clientes antes, durante y después del préstamo.

---

# 2. Canales Digitales

## WhatsApp

Canal principal MVP.

Funciones:

- Solicitar préstamo.
- Consultar estado.
- Enviar documentos.
- Recordatorios.
- Pagos.
- Soporte.

---

## Web Portal

Funciones:

- Registro.
- Dashboard.
- Documentos.
- Contratos.
- Pagos.

---

## Mobile App

Fase futura.

Funciones:

- Notificaciones.
- Biometría.
- Pagos.
- Historial.

---

# 3. Customer Portal

Panel del cliente.

---

## Dashboard Principal

Mostrar:

Préstamo actual

Saldo pendiente

Próxima cuota

Fecha vencimiento

Estado solicitud

---

## Préstamos

Historial:

- activos;
- cerrados;
- rechazados.

---

## Pagos

Mostrar:

- cuotas;
- comprobantes;
- fechas;
- estados.

---

## Documentos

Acceso:

- contrato;
- recibos;
- certificados.

---

# 4. WhatsApp Experience

## AI Financial Assistant

No es un chatbot tradicional.

Es un agente con herramientas.

---

Puede:

Consultar:

```
get_customer()

get_loan_status()

calculate_payment()

generate_qr()

create_ticket()

```

---

## Conversaciones

Estados:

```

NEW

IDENTIFICATION

KYC

APPLICATION

PAYMENT

SUPPORT

CLOSED

```

---

# 5. Mobile Application

Futuro.

Tecnología recomendada:

React Native + Expo.

---

Funciones:

Login

Biometría

Préstamos

Pagos QR

Documentos

Notificaciones

---

# 6. Self Service

El cliente puede resolver:

## Preguntas

IA.

---

## Pagos

Generar QR.

---

## Cambios

Actualizar datos.

---

## Documentos

Descargar contratos.

---

## Soporte

Crear tickets.

---

# 7. Customer Profile

Vista 360 del cliente.

Incluye:

Identidad

KYC

Préstamos

Pagos

Conversaciones

Riesgo

Historial

---

# 8. Modelo de Datos

---

# customer_profiles

Perfil principal.

---

# customer_preferences

Preferencias.

Ejemplo:

Idioma

Canal favorito

Horario contacto

---

# customer_devices

Dispositivos.

---

# customer_channels

Canales.

Ejemplo:

WhatsApp

Email

App

---

# conversations

Conversaciones.

Campos:

channel

status

started_at

---

# messages

Mensajes.

---

# conversation_context

Memoria conversación IA.

---

# customer_notifications

Notificaciones.

---

# notification_preferences

Preferencias.

---

# support_tickets

Soporte.

---

# ticket_messages

Conversación soporte.

---

# customer_feedback

Opiniones.

---

# Modelo Total

1 customer_profiles

2 customer_preferences

3 customer_devices

4 customer_channels

5 conversations

6 messages

7 conversation_context

8 customer_notifications

9 notification_preferences

10 support_tickets

11 ticket_messages

12 customer_feedback


Total:

12 tablas

---

# 9. Eventos

CustomerRegistered

ConversationStarted

MessageReceived

MessageSent

NotificationCreated

TicketCreated

FeedbackReceived

---

# 10. KPIs

## Experiencia

Tiempo primera respuesta

Satisfacción

Conversaciones resueltas IA

---

## Conversión

Inicio solicitud

Solicitud completada

Abandono

---

## WhatsApp

Mensajes enviados

Respuesta automática

Costo conversación

---

# Tecnologías

## MVP

Frontend:

Next.js

Backend:

NestJS

WhatsApp:

Meta WhatsApp Business API

IA:

AI Gateway


---

# Escala

- React Native
- Customer Data Platform
- Voice AI
- Omnichannel


---

# Próximo Documento

DAD-27

Mobile Application Platform

Incluye:

- App cliente
- App agentes cobranza
- biometría
- offline mode
- notificaciones push
- seguridad móvil