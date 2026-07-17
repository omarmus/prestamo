# Data Architecture Document (DAD)

# Parte XXXII

# Loan Management Platform

Versión 1.0

---

# Tabla de Contenido

1. Objetivo
2. Arquitectura
3. Loan Lifecycle
4. Productos financieros
5. Amortización
6. Intereses
7. Mora
8. Refinanciamiento
9. Modelo de Datos
10. Eventos
11. KPIs

---

# 1. Objetivo

Gestionar todo el ciclo de vida de los préstamos otorgados por la fintech.

---

# 2. Arquitectura

```

Credit Decision

       │

       ▼

Loan Creation

       │

       ▼

Loan Management

       │

 ┌─────┼─────┐

 ▼     ▼     ▼

Schedule Interest Payments


       │

       ▼

Accounting Ledger


```

---

# 3. Loan Lifecycle

Estados:

```

APPLICATION

APPROVED

CONTRACTED

DISBURSED

ACTIVE

PAST_DUE

RESTRUCTURED

PAID_OFF

DEFAULTED

CANCELLED


```

---

# 4. Loan Products

No todos los préstamos son iguales.

---

Ejemplos:

## Microcrédito

Monto pequeño.

Plazo corto.

---

## Consumo

Mayor plazo.

---

## Emergencia

Desembolso rápido.

---

## Crédito recurrente

Para clientes buenos.

---

# loan_products

Define:

- monto mínimo;
- monto máximo;
- tasa;
- plazo;
- reglas.

---

# 5. Loan Creation

Cuando se aprueba:

Crear:

- préstamo;
- contrato;
- calendario;
- obligación pago.

---

Ejemplo:

```

Monto:

Bs5000


Plazo:

12 meses


Cuota:

Bs520


```

---

# 6. Amortization Engine

Calcula cuotas.

---

Métodos:

---

# Francés

Cuotas iguales.

Más común.

---

# Alemán

Capital decreciente.

---

# Simple Interest

Microcrédito.

---

# Debe soportar:

- fechas especiales;
- feriados;
- pagos anticipados.

---

# 7. Interest Engine

Gestiona:

---

## Tasa fija

Ejemplo:

15%

---

## Tasa variable

Futuro.

---

## Mora

Interés adicional.

---

Debe guardar:

```

rate

effective_date

expiration_date

```

---

# 8. Payment Schedule

Genera cuotas.

Ejemplo:

```

Cuota 1

Fecha:

01/08/2026

Capital:

400

Interés:

120

Total:

520


```

---

# 9. Delinquency Management

Gestión mora.

---

Estados:

```

CURRENT

LATE

DELINQUENT

DEFAULT

```

---

Calcula:

Días atraso.

Monto pendiente.

Riesgo.

---

# Aging Buckets

Ejemplo:

```

0-30 días

31-60 días

61-90 días

90+

```

---

# 10. Refinancing

Debe soportar:

---

Reestructuración:

Cambiar plazo.

---

Renegociación:

Cambiar condiciones.

---

Consolidación:

Unir préstamos.

---

# 11. Modelo de Datos

---

# loan_products

Productos crédito.

---

# loans

Préstamos.

Campos:

customer_id

amount

term

rate

status

---

# loan_applications

Solicitudes.

---

# loan_terms

Condiciones.

---

# loan_disbursements

Desembolsos.

---

# repayment_schedules

Calendario cuotas.

---

# repayment_installments

Cuotas individuales.

---

# interest_calculations

Cálculos intereses.

---

# late_fees

Cargos mora.

---

# loan_events

Historial eventos.

---

# loan_adjustments

Ajustes.

---

# restructurings

Refinanciaciones.

---

# payoff_records

Liquidaciones.

---

# Modelo Total

1 loan_products

2 loan_applications

3 loans

4 loan_terms

5 loan_disbursements

6 repayment_schedules

7 repayment_installments

8 interest_calculations

9 late_fees

10 loan_events

11 loan_adjustments

12 restructurings

13 payoff_records


Total:

13 tablas

---

# 12. Eventos

LoanCreated

LoanApproved

LoanDisbursed

InstallmentCreated

PaymentApplied

LoanPastDue

LoanRestructured

LoanPaidOff

---

# 13. KPIs

Cartera activa.

Monto desembolsado.

Número préstamos.

Mora.

Default rate.

Tiempo aprobación.

Recuperación.

---

# Tecnologías

## Backend

NestJS

---

## Database

PostgreSQL

---

## Jobs

BullMQ

RabbitMQ

---

## Cálculo financiero

Servicio independiente.

---

# Próximo Documento

DAD-33

Collection & Recovery Platform

Incluye:

- cobranza automática;
- WhatsApp;
- IA negociadora;
- estrategias recuperación;
- cartera vencida;
- agentes humanos;
- scoring de mora.