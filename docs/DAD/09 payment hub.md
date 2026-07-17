# Data Architecture Document (DAD)

# Parte IX

# Payment Hub & QR Banking

Versión 1.0

---

# Tabla de Contenido

1. Objetivo
2. Arquitectura
3. Aggregate Roots
4. Flujo
5. Estados
6. Entidades
7. Eventos
8. Modelo de Datos
9. Motor de Aplicación de Pagos
10. Reglas de Negocio

---

# 1. Objetivo

Administrar todos los pagos recibidos por la fintech.

No importa el canal.

Todos los pagos pasan por este módulo.

---

# 2. Arquitectura

```
Loan

↓

Payment Order

↓

Payment Channel

↓

Payment

↓

Allocation Engine

↓

Ledger

↓

Loan Updated
```

---

# 3. Aggregate Roots

PaymentOrder

Payment

PaymentAllocation

PaymentReconciliation

---

# 4. Flujo

```
Cliente

↓

Generar QR

↓

Banco

↓

Pago

↓

Webhook

↓

Validación

↓

Conciliación

↓

Aplicar pago

↓

Actualizar préstamo

```

---

# 5. Estados

PaymentStatus

```
CREATED

PENDING

PROCESSING

CONFIRMED

FAILED

REVERSED

EXPIRED

CANCELLED
```

---

QRStatus

```
GENERATED

ACTIVE

PAID

EXPIRED

VOID
```

---

ReconciliationStatus

```
PENDING

MATCHED

PARTIAL

FAILED

MANUAL
```

---

# 6. Entidades

PaymentOrder

Payment

PaymentMethod

PaymentProvider

PaymentChannel

PaymentAllocation

PaymentReceipt

QRPayment

BankTransaction

Webhook

Reconciliation

Refund

PaymentAttempt

---

# 7. Eventos

PaymentCreated

QRGenerated

PaymentConfirmed

PaymentAllocated

InstallmentPaid

LoanUpdated

PaymentReversed

WebhookReceived

ReconciliationCompleted

---

# 8. Modelo de Datos

---

## payment_methods

Catálogo.

Ejemplos

QR

TRANSFER

CASH

CARD

ACH

DIRECT_DEBIT

---

## payment_providers

Ejemplos

Banco Unión

Banco Mercantil

Banco BISA

Banco Ganadero

Pasarela QR

Proveedor Open Banking

---

## payment_orders

Orden de cobro.

| Campo |
|--------|
| id |
| loan_id |
| installment_id |
| amount |
| expires_at |
| status |
| created_at |

---

## qr_payments

Información QR.

| Campo |
|--------|
| id |
| payment_order_id |
| qr_payload |
| qr_image_url |
| expiration |
| status |

---

## payments

Pago recibido.

| Campo |
|--------|
| id |
| payment_order_id |
| provider_id |
| payment_method_id |
| amount |
| currency |
| external_reference |
| status |
| paid_at |

---

## payment_attempts

Intentos.

| Campo |
|--------|
| id |
| payment_order_id |
| attempt |
| result |
| created_at |

---

## bank_transactions

Movimiento bancario.

| Campo |
|--------|
| id |
| provider_id |
| transaction_reference |
| amount |
| currency |
| transaction_date |
| raw_payload JSONB |

---

## webhooks

Eventos recibidos.

Nunca eliminar.

| Campo |
|--------|
| id |
| provider |
| event |
| payload JSONB |
| processed |
| received_at |

---

## payment_allocations

Aplicación del pago.

| Campo |
|--------|
| id |
| payment_id |
| loan_id |
| installment_id |
| principal |
| interest |
| fees |
| penalties |

---

## payment_receipts

Comprobantes.

| Campo |
|--------|
| id |
| payment_id |
| receipt_number |
| document_id |
| generated_at |

---

## reconciliations

Conciliación bancaria.

| Campo |
|--------|
| id |
| payment_id |
| bank_transaction_id |
| status |
| matched_at |

---

## refunds

Reversiones.

| Campo |
|--------|
| id |
| payment_id |
| amount |
| reason |
| refunded_at |

---

# 9. Allocation Engine

El dinero nunca se aplica manualmente.

El sistema distribuirá automáticamente.

Ejemplo

Pago

500 Bs

↓

Interés

50

↓

Mora

20

↓

Comisión

10

↓

Capital

420

Todo parametrizable.

---

# Prioridad configurable

Ejemplo

```
1 Mora

2 Comisión

3 Interés

4 Capital
```

o

```
1 Interés

2 Capital

3 Comisión

4 Mora
```

Cada producto financiero podrá definir su propia política.

---

# 10. Reglas

Nunca modificar pagos.

Los pagos generan ledger.

Los pagos pueden ser parciales.

Los pagos pueden cubrir varias cuotas.

Una cuota puede pagarse con varios pagos.

Todo pago debe conciliarse.

Nunca eliminar webhooks.

Los QR expiran.

Nunca reutilizar un QR vencido.

---

# QR Bolivia

Preparado para:

EMVCo

Transferencias inmediatas

QR interoperable

Pagos bancarios

Múltiples bancos

---

# KPIs

Pagos diarios

Monto cobrado

Monto pendiente

Mora

Tiempo de conciliación

QR generados

QR pagados

Pagos fallidos

Pagos revertidos

---

# Tablas Totales

1 payment_methods

2 payment_providers

3 payment_orders

4 qr_payments

5 payments

6 payment_attempts

7 bank_transactions

8 webhooks

9 payment_allocations

10 payment_receipts

11 reconciliations

12 refunds

Total

12 tablas

---

# Próximo Documento

DAD-10

Collections & Recovery

El módulo de cobranza incluirá:

- Cobranza preventiva
- Cobranza temprana
- Cobranza administrativa
- Cobranza judicial
- Promesas de pago
- Acuerdos
- Reestructuraciones
- Campañas automáticas
- WhatsApp
- IA para cobranza
- Score de recuperación