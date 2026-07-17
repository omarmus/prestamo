# Data Architecture Document (DAD)

# Parte XXV

# Marketing & Growth Platform

Versión 1.0

---

# Tabla de Contenido

1. Objetivo
2. Customer Acquisition
3. CRM Marketing
4. Campaign Engine
5. Attribution
6. Referral System
7. Automation
8. Modelo de Datos
9. Eventos
10. KPIs

---

# 1. Objetivo

Gestionar adquisición, conversión y retención de clientes.

---

# 2. Customer Acquisition

Canales:

## Digital

- Google Ads
- Meta Ads
- TikTok Ads
- SEO
- Landing pages


## Directos

- WhatsApp
- Referidos
- Partners comerciales


## Offline

- Comercios aliados
- Promotores
- Puntos físicos

---

# 3. Lead Management

Antes de ser cliente existe un Lead.

Estados:

```

NEW

CONTACTED

QUALIFIED

APPLICATION_STARTED

APPLICATION_COMPLETED

CONVERTED

LOST

```

---

# 4. CRM Marketing

Gestiona:

- Segmentos
- Campañas
- Comunicación
- Historial

---

# Segmentos

Ejemplos:

## Nuevos usuarios

Nunca solicitaron.

---

## Clientes activos

Tienen préstamo.

---

## Clientes buenos

Pagan puntual.

---

## Clientes riesgo

Presentan atraso.

---

## Reactivación

Clientes antiguos.

---

# 5. Campaign Engine

Permite crear:

- campañas;
- promociones;
- mensajes;
- automatizaciones.

---

Ejemplo:

Campaña:

"Primer préstamo"

Regla:

Usuario registrado hace 7 días

Sin solicitud

Enviar WhatsApp.

---

# 6. Attribution Engine

Responde:

¿De dónde vino el cliente?

Ejemplo:

Cliente:

Juan

Origen:

Facebook Ads


Costo:

Bs 12


Generó:

Bs 500 interés

---

# Métricas:

CAC

LTV

ROI

Conversión

---

# 7. Referral System

Programa:

"Invita amigos"

---

Flujo:

```

Cliente A

↓

Invita Cliente B

↓

B obtiene préstamo

↓

A recibe beneficio

```

---

# 8. Automation Engine

Automatizaciones:

---

## Bienvenida

Nuevo registro.

---

## Recordatorio solicitud

Usuario abandonó formulario.

---

## Aprobación

Préstamo aprobado.

---

## Cobranza

Antes del vencimiento.

---

## Fidelización

Cliente terminó préstamo.

---

# 9. Modelo de Datos

---

# leads

Prospectos.

Campos:

id

name

phone

source

status

---

# lead_sources

Origen.

Ejemplo:

Facebook

Google

Referido

---

# campaigns

Campañas.

---

# campaign_messages

Mensajes.

---

# customer_segments

Segmentos.

---

# segment_members

Usuarios pertenecientes.

---

# marketing_events

Eventos.

Ejemplo:

click

conversion

---

# attribution_records

Atribución.

---

# referral_programs

Programas.

---

# referrals

Referidos.

---

# rewards

Beneficios.

---

# automations

Automatizaciones.

---

# automation_steps

Pasos.

---

# Modelo Total

1 leads

2 lead_sources

3 campaigns

4 campaign_messages

5 customer_segments

6 segment_members

7 marketing_events

8 attribution_records

9 referral_programs

10 referrals

11 rewards

12 automations

13 automation_steps


Total:

13 tablas

---

# 10. Eventos

LeadCreated

LeadQualified

CampaignStarted

MessageSent

CustomerConverted

ReferralCreated

RewardGranted

---

# 11. KPIs

## Adquisición

Leads diarios

CAC

CTR

Conversion rate


---

## Ventas

Solicitudes

Aprobaciones

Conversión lead-préstamo


---

## Retención

Clientes recurrentes

Segundo préstamo

Referidos


---

# Tecnologías

## MVP

- Meta API
- Google Analytics
- CRM interno
- WhatsApp API
- Redis Queue


## Escala

- Customer Data Platform
- Segment
- Braze
- HubSpot
- Salesforce

---

# Próximo Documento

DAD-26

Customer Experience Platform

Incluye:

- Portal cliente
- App móvil
- WhatsApp Experience
- Estado préstamo
- Autoservicio
- Soporte