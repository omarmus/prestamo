# Data Architecture Document (DAD)

# Parte XXXIII

# Collection & Recovery Platform

Versión 1.0

---

# Tabla de Contenido

1. Objetivo
2. Arquitectura
3. Estrategia cobranza
4. Collection Workflow
5. AI Collection Agent
6. Comunicación
7. Gestión agentes
8. Promesas pago
9. Modelo de Datos
10. Eventos
11. KPIs

---

# 1. Objetivo

Gestionar recuperación de cartera mediante automatización, IA y agentes humanos.

---

# 2. Arquitectura

```

Loan

  │

  ▼

Delinquency Detection

  │

  ▼

Collection Engine

  │

 ┌──────────────┐

 ▼              ▼

AI Agent     Human Agent


  │              │

  └──────┬───────┘

         ▼

      Payment


```

---

# 3. Estrategia Cobranza

---

# Preventiva

Antes del vencimiento.

Ejemplo:

7 días antes:

"Recuerda tu próxima cuota."

---

# Temprana

1-30 días atraso.

Objetivo:

Recuperar rápido.

---

# Tardía

31-90 días.

Negociación.

---

# Castigo

90+ días.

Proceso especial.

---

# 4. Collection Workflow

Estados:

```

CURRENT

UPCOMING_DUE

LATE

CONTACTED

PROMISE_TO_PAY

NEGOTIATION

RECOVERED

DEFAULT


```

---

# 5. AI Collection Agent

Agente especializado.

---

Funciones:

- recordar pagos;
- explicar deuda;
- negociar fechas;
- generar QR;
- responder preguntas.

---

Ejemplo:

Cliente:

"No puedo pagar esta semana"


IA:

"Podemos mover tu fecha al viernes.
Tu nueva cuota sería..."

---

# Herramientas IA

```

get_balance()

get_payment_schedule()

generate_qr()

create_payment_plan()

register_promise()


```

---

# 6. Communication Engine

Canales:

---

## WhatsApp

Principal.

---

## SMS

Fallback.

---

## Email

Documentación.

---

## Llamadas

Futuro.

---

# Plantillas

---

Recordatorio:

```

Hola Juan.

Tu cuota vence mañana.

Monto:

Bs350


Puedes pagar aquí:

QR


```

---

# Mora:

```

Detectamos atraso.

Podemos ayudarte con opciones.

```

---

# 7. Gestión Agentes

Para cobranza humana.

---

Funciones:

- asignar cartera;
- registrar contacto;
- seguimiento;
- productividad.

---

# Collection Agent App

Incluye:

- clientes asignados;
- mapa;
- llamadas;
- notas;
- evidencia.

---

# 8. Promise To Pay

Muy importante.

Cliente promete:

"Pagaré viernes."

Sistema registra:

- fecha;
- monto;
- canal;
- resultado.

---

# 9. Modelo de Datos

---

# collection_cases

Casos cobranza.

---

# collection_strategies

Estrategias.

---

# collection_actions

Acciones realizadas.

---

# collection_contacts

Contactos.

---

# promise_to_pay

Promesas pago.

---

# payment_plans

Planes negociación.

---

# collection_agents

Agentes.

---

# agent_assignments

Asignación cartera.

---

# collection_notes

Notas.

---

# recovery_events

Eventos recuperación.

---

# delinquency_snapshots

Fotografías mora.

---

# Modelo Total

1 collection_cases

2 collection_strategies

3 collection_actions

4 collection_contacts

5 promise_to_pay

6 payment_plans

7 collection_agents

8 agent_assignments

9 collection_notes

10 recovery_events

11 delinquency_snapshots


Total:

11 tablas

---

# 10. Eventos

LoanBecamePastDue

CollectionStarted

MessageSent

CustomerContacted

PromiseCreated

PaymentRecovered

CaseClosed

---

# 11. KPIs

Mora %

Recovery rate

Promesas cumplidas

Costo cobranza

Tiempo recuperación

Contact rate

---

# Tecnologías

## MVP

WhatsApp API

NestJS

BullMQ

PostgreSQL

AI Agent


## Escala

Voice AI

Predictive Collections

Optimization Engine

```

---

# Próximo Documento

DAD-34

Accounting & Financial Ledger Platform

Incluye:

- contabilidad financiera;
- doble partida;
- movimientos dinero;
- conciliación;
- estados financieros;
- auditoría monetaria.