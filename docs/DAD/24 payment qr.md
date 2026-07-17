# Data Architecture Document (DAD)

# Parte XXIV

# Payment & QR Platform

Versión 1.0

---

# Tabla de Contenido

1. Objetivo
2. Arquitectura
3. Payment Lifecycle
4. QR Platform
5. Reconciliation Engine
6. Payment Gateway
7. Refunds
8. Modelo de Datos
9. Eventos
10. Reglas
11. KPIs

---

# 1. Objetivo

Gestionar pagos digitales, generación QR, conciliación y movimientos financieros.

---

# 2. Arquitectura

```

Loan

↓

Payment Obligation

↓

Payment Service

↓

QR Generator

↓

Bank / Payment Provider

↓

Webhook

↓

Reconciliation

↓

Ledger

```

---

# 3. Payment Lifecycle

Estados:

```

PENDING

CREATED

QR_GENERATED

PROCESSING

PAID

FAILED

EXPIRED

REVERSED

REFUNDED

```

---

# 4. QR Platform

Genera códigos QR asociados a obligaciones.

---

# Tipos QR

## QR Estático

Un código reutilizable.

Ejemplo:

Cuenta empresa.

---

## QR Dinámico

Generado para cada deuda.

Ejemplo:

Cuota préstamo:

```

Cliente:

Juan Pérez


Cuota:

Bs 350


Vencimiento:

30/08/2026


QR:

Único


```

---

# Ventajas QR Dinámico

Permite:

- identificar cliente;
- identificar préstamo;
- identificar cuota;
- conciliar automáticamente;
- evitar errores humanos.

---

# QR Payload

Ejemplo conceptual:

```
merchant_id

transaction_id

amount

currency

expiration

reference

checksum

```

---

# 5. Payment Gateway

Capa abstracta.

No depender de un solo banco.

---

Ejemplo:

```

Payment Provider A

Payment Provider B

Banco C

Banco D

```

---

# Componentes

Payment Adapter

Webhook Receiver

Transaction Validator

Settlement Engine

---

# 6. Reconciliation Engine

Muy importante.

Compara:

Sistema fintech

vs

Banco


Ejemplo:

Fintech:

```
Pago esperado:

Bs350

```

Banco:

```
Pago recibido:

Bs350

```

Resultado:

MATCH


---

Casos:

## Pago faltante

Banco tiene pago.

Sistema no.

---

## Pago duplicado

Dos registros.

---

## Diferencia monto

---

# 7. Refunds

Gestiona devoluciones.

Estados:

```

REQUESTED

APPROVED

PROCESSING

COMPLETED

REJECTED

```

---

# 8. Modelo de Datos

---

# payment_accounts

Cuentas receptoras.

---

# payment_methods

Métodos.

Ejemplo:

QR

Transferencia

Tarjeta

Efectivo

---

# payment_orders

Orden de cobro.

Ejemplo:

Cuota número 5.

---

# payment_transactions

Transacciones reales.

Campos:

id

amount

currency

status

provider

reference

---

# qr_codes

QR generados.

Campos:

payload

expiration

transaction_id

---

# payment_providers

Proveedores.

Ejemplo:

Banco

Pasarela

---

# payment_webhooks

Eventos externos.

---

# settlements

Liquidaciones.

---

# reconciliation_cases

Casos de diferencia.

---

# refunds

Devoluciones.

---

# payment_attempts

Intentos.

---

# payment_events

Historial.

---

# Modelo completo

1 payment_accounts

2 payment_methods

3 payment_orders

4 payment_transactions

5 qr_codes

6 payment_providers

7 payment_webhooks

8 settlements

9 reconciliation_cases

10 refunds

11 payment_attempts

12 payment_events


Total:

12 tablas

---

# 9. Eventos

PaymentCreated

QRGenerated

PaymentReceived

PaymentConfirmed

PaymentFailed

PaymentReconciled

PaymentRefunded

---

# 10. Reglas

Nunca marcar pago como completado manualmente sin auditoría.

Toda transacción debe tener referencia única.

Los pagos deben ser idempotentes.

Toda conciliación debe quedar registrada.

Nunca borrar transacciones.

---

# 11. KPIs

Pagos diarios

Monto cobrado

Conversión QR

Pagos fallidos

Tiempo conciliación

Pagos pendientes

Refund rate

---

# Tecnologías

## Backend

NestJS

---

## Colas

RabbitMQ

BullMQ

---

## Storage

PostgreSQL

---

## QR

Librerías QR estándar

---

## Integraciones

APIs bancarias

APIs fintech

Open Banking futuro


---

# Próximo Documento

DAD-25

Marketing & Growth Platform

Incluye:

- adquisición clientes
- campañas
- referidos
- CRM marketing
- WhatsApp marketing
- analytics de conversión