# Data Architecture Document (DAD)

# Parte XXXV

# Payment Platform Bolivia

Versión 1.0

---

# Tabla de Contenido

1. Objetivo
2. Arquitectura
3. Payment Lifecycle
4. QR Payment Engine
5. Dynamic QR
6. Payment Providers
7. Payment Confirmation
8. Reconciliation
9. Modelo de Datos
10. Eventos
11. KPIs

---

# 1. Objetivo

Crear una plataforma de pagos para recibir cuotas, realizar desembolsos y conciliar movimientos financieros.

---

# 2. Arquitectura

```

Loan System

      │

      ▼

Payment Request

      │

      ▼

Payment Platform


      │

 ┌────┼─────┐

 ▼    ▼     ▼

QR  Banks  Ledger


```

---

# 3. Payment Lifecycle

Estados:

```

CREATED

QR_GENERATED

PENDING

PROCESSING

PAID

FAILED

EXPIRED

REFUNDED


```

---

# 4. QR Payment Engine

Responsable de:

- crear QR;
- controlar vencimiento;
- validar pagos;
- asociar cliente.

---

Ejemplo:

Cliente:

Juan Pérez


Cuota:

Bs350


Sistema genera:

QR único


---

# 5. Dynamic QR

Diferencia:

---

## QR estático

Ejemplo:

Un QR pegado en una tienda.

Problema:

No sabe quién pagó.

---

## QR dinámico

Contiene:

- monto;
- referencia;
- cliente;
- cuota;
- vencimiento.

---

Ejemplo:

```

Cliente:

12345


Préstamo:

9876


Cuota:

4


Monto:

350


Fecha:

2026-08-01


```

---

# 6. Payment Providers

La plataforma debe abstraer proveedores.

---

No hacer:

```

Loan Service

↓

Banco específico


```

---

Hacer:

```

Loan Service

↓

Payment Gateway

↓

Provider Adapter


```

---

Ventaja:

Cambiar proveedor sin modificar negocio.

---

# 7. Payment Confirmation

Métodos:

---

## Webhook

Proveedor avisa:

Pago realizado.

---

## Consulta periódica

Sistema consulta estado.

---

## Conciliación bancaria

Comparación diaria.

---

# 8. Reconciliation

Proceso:

```

Banco

   +

Sistema interno


        ↓


Comparación


        ↓


Diferencias


        ↓


Resolución


```

---

# 9. Desembolso

Proceso inverso.

---

Flujo:

```

Loan Approved

↓

Payment Instruction

↓

Transferencia

↓

Confirmación

↓

Ledger


```

---

# 10. Modelo de Datos

---

# payment_orders

Órdenes pago.

---

# payment_transactions

Pagos realizados.

---

# payment_methods

Métodos.

Ejemplo:

QR

Transferencia

---

# payment_providers

Proveedores.

---

# provider_transactions

Respuesta proveedor.

---

# qr_codes

Códigos generados.

---

# qr_payments

Pagos QR.

---

# payment_webhooks

Eventos externos.

---

# refunds

Devoluciones.

---

# bank_accounts

Cuentas destino.

---

# bank_movements

Movimientos bancarios.

---

# reconciliation_runs

Procesos conciliación.

---

# reconciliation_results

Resultados.

---

# Modelo Total

1 payment_orders

2 payment_transactions

3 payment_methods

4 payment_providers

5 provider_transactions

6 qr_codes

7 qr_payments

8 payment_webhooks

9 refunds

10 bank_accounts

11 bank_movements

12 reconciliation_runs

13 reconciliation_results


Total:

13 tablas

---

# 11. Eventos

PaymentCreated

QRGenerated

PaymentStarted

PaymentConfirmed

PaymentFailed

RefundCreated

PaymentReconciled


---

# 12. KPIs

Pagos exitosos.

Tiempo confirmación.

Costo transacción.

Pagos QR.

Pagos fallidos.

Conciliaciones pendientes.


---

# Tecnologías

## Backend

NestJS

---

## Integraciones

REST APIs

Webhooks

---

## Mensajería

RabbitMQ

BullMQ

---

## Seguridad

Firmas digitales

OAuth2

API Keys


---

# Próximo Documento

DAD-36

Notification & Communication Platform

Incluye:

- WhatsApp Business API;
- SMS;
- email;
- push notifications;
- plantillas;
- campañas;
- comunicación IA.