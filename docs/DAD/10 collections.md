# Data Architecture Document (DAD)

# Parte X

# Collections & Recovery

Versión 1.0

---

# Tabla de Contenido

1. Objetivo
2. Arquitectura
3. Aggregate Roots
4. Flujo
5. Estrategias de Cobranza
6. Estados
7. Entidades
8. Eventos
9. Modelo de Datos
10. Reglas de Negocio

---

# 1. Objetivo

Administrar todo el proceso de recuperación de cartera.

No administra préstamos.

No administra pagos.

Administra la cobranza.

---

# 2. Arquitectura

```
Loan

↓

Cuota Vencida

↓

Motor de Cobranza

↓

Campaña

↓

WhatsApp

↓

Promesa de Pago

↓

Pago

↓

Recuperación
```

---

# 3. Aggregate Roots

CollectionCase

PromiseToPay

CollectionCampaign

---

# 4. Flujo

```
Cuota vencida

↓

Crear caso

↓

Asignar estrategia

↓

WhatsApp

↓

Llamada

↓

Promesa

↓

Pago

↓

Cerrar caso
```

---

# 5. Estrategias

Preventiva

Recordatorios antes del vencimiento.

---

Temprana

1–30 días de mora.

---

Intermedia

31–60 días.

---

Avanzada

61–90 días.

---

Prejudicial

Más de 90 días.

---

Judicial

Cuando aplique.

---

# 6. Estados

CollectionStatus

```
OPEN

CONTACTED

PROMISE_TO_PAY

PARTIAL_PAYMENT

PAID

BROKEN_PROMISE

ESCALATED

LEGAL

CLOSED
```

---

PromiseStatus

```
PENDING

FULFILLED

BROKEN

EXPIRED
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

CollectionCase

CollectionCampaign

CollectionStrategy

CollectionAssignment

CollectionAction

CollectionConversation

PromiseToPay

RecoveryScore

RecoveryHistory

RecoveryRecommendation

---

# 8. Eventos

CollectionStarted

ReminderSent

CustomerContacted

PromiseCreated

PromiseBroken

PaymentReceived

CollectionClosed

CollectionEscalated

---

# 9. Modelo de Datos

---

## collection_cases

Caso principal.

| Campo | Tipo |
|--------|------|
| id | UUID |
| loan_id | UUID |
| installment_id | UUID |
| customer_id | UUID |
| assigned_to | UUID |
| strategy |
| status |
| overdue_days |
| outstanding_balance |
| created_at |

---

## collection_campaigns

Campañas.

Ejemplos

Recordatorio 3 días

Mora 15 días

Mora 30 días

Recuperación VIP

---

| Campo |
|--------|
| id |
| name |
| strategy |
| status |
| created_at |

---

## collection_assignments

Asignaciones.

| Campo |
|--------|
| id |
| case_id |
| assigned_to |
| assigned_by |
| assigned_at |

---

## collection_actions

Acciones realizadas.

| Campo |
|--------|
| id |
| case_id |
| action |
| channel |
| result |
| created_by |
| created_at |

Ejemplos

WhatsApp

SMS

Email

Llamada

Visita

Carta

---

## collection_conversations

Conversaciones.

| Campo |
|--------|
| id |
| case_id |
| conversation_id |
| last_message |
| status |

---

## promises_to_pay

Promesas.

| Campo |
|--------|
| id |
| case_id |
| promised_amount |
| promised_date |
| status |
| fulfilled_at |

---

## recovery_scores

Probabilidad de recuperación.

| Campo |
|--------|
| id |
| case_id |
| score |
| risk |
| recommendation |
| generated_at |

---

## recovery_recommendations

Sugerencias IA.

| Campo |
|--------|
| id |
| case_id |
| model |
| recommendation |
| confidence |
| explanation |

Ejemplos

```
Enviar WhatsApp

Llamar mañana

Ofrecer refinanciación

Escalar

Visita

```

---

## recovery_history

Historial.

Nunca eliminar.

| Campo |
|--------|
| id |
| case_id |
| event |
| created_at |

---

# 10. Reglas

Una cuota vencida genera automáticamente un CollectionCase.

Un préstamo puede tener varios casos históricos.

Solo un caso abierto por cuota.

Toda conversación queda registrada.

Toda promesa debe tener fecha y monto.

Una promesa incumplida aumenta el Recovery Score de riesgo.

Nunca eliminar casos.

---

# Motor Automático

Todos los días el Scheduler ejecutará:

```
Buscar cuotas próximas a vencer

↓

Enviar recordatorio

↓

Buscar cuotas vencidas

↓

Crear caso

↓

Enviar WhatsApp

↓

Esperar respuesta

↓

Actualizar estrategia

```

---

# WhatsApp

El bot podrá:

Recordar pagos.

Enviar QR.

Negociar fecha.

Registrar promesa.

Transferir a un asesor.

Enviar comprobantes.

---

# IA

La IA recomendará:

Horario ideal.

Canal ideal.

Probabilidad de pago.

Oferta de refinanciación.

Nivel de insistencia.

Riesgo de incumplimiento.

---

# KPIs

Cartera vencida

Cartera recuperada

Promesas cumplidas

Promesas incumplidas

Tiempo promedio de recuperación

Recuperación por analista

Recuperación por campaña

Costo por recuperación

---

# Tablas Totales

1 collection_cases

2 collection_campaigns

3 collection_assignments

4 collection_actions

5 collection_conversations

6 promises_to_pay

7 recovery_scores

8 recovery_recommendations

9 recovery_history

Total

9 tablas

---

# Próximo Documento

DAD-11

Accounting & Financial Ledger

Se construirá el núcleo contable:

- Libro mayor
- Doble partida
- Diario
- Asientos
- Cuentas contables
- Centros de costo
- Impuestos
- Devengos
- Conciliaciones
- Integración ERPNext
- Estados financieros