# Data Architecture Document (DAD)

# Parte XXXIV

# Accounting & Financial Ledger Platform

Versión 1.0

---

# Tabla de Contenido

1. Objetivo
2. Principios contables
3. Arquitectura
4. Chart of Accounts
5. Double Entry Ledger
6. Financial Transactions
7. Reconciliation
8. Financial Reports
9. Modelo de Datos
10. Eventos
11. KPIs

---

# 1. Objetivo

Crear un sistema contable financiero que registre todos los movimientos monetarios de la fintech.

---

# 2. Principios Contables

---

# Inmutabilidad

Los movimientos financieros no se eliminan.

Se corrigen con nuevos movimientos.

---

# Auditoría

Todo movimiento debe tener:

- usuario;
- fecha;
- origen;
- referencia.

---

# Separación

El préstamo genera eventos.

El ledger registra dinero.

---

# 3. Arquitectura

```

Loan System

Payment System

Collection System

        │

        ▼

Transaction Events


        │

        ▼

Accounting Engine


        │

        ▼

General Ledger


```

---

# 4. Chart of Accounts

Catálogo cuentas.

Ejemplo:

---

## Assets

Activos.

```
1100 Banco

1200 Cartera préstamos

1300 Intereses por cobrar

```

---

## Liabilities

Pasivos.

```
2100 Obligaciones

2200 Proveedores

```

---

## Revenue

Ingresos.

```
4100 Intereses

4200 Comisiones

```

---

## Expenses

Gastos.

```
5100 Operación

5200 Marketing

```

---

# 5. Double Entry Ledger

Cada asiento:

Debe tener:

```

Journal Entry

       │

       ├── Debit

       └── Credit


```

---

Ejemplo pago cuota:

Cliente paga Bs500.


Movimiento:

```

Banco

D +500


Cartera cliente

C -400


Interés ganado

C -100


```

---

# 6. Financial Transactions

Tipos:

---

Loan Disbursement

Desembolso.

---

Payment

Pago cliente.

---

Interest Accrual

Devengo interés.

---

Late Fee

Mora.

---

Refund

Devolución.

---

Adjustment

Corrección.

---

# 7. Reconciliation

Comparar:

Sistema interno

vs

Banco

---

Ejemplo:

Sistema:

100 pagos

Banco:

99 depósitos


Generar diferencia.

---

# 8. Financial Reports

---

## Balance General

Activos

Pasivos

Patrimonio

---

## Estado resultados

Ingresos

Costos

Utilidad

---

## Cartera

Saldo préstamos.

---

## Flujo caja

Entradas.

Salidas.

---

# 9. Modelo de Datos

---

# accounts

Plan cuentas.

---

# accounting_periods

Periodos contables.

---

# journal_entries

Cabecera asientos.

---

# journal_lines

Detalle movimientos.

---

# financial_transactions

Transacciones financieras.

---

# transaction_types

Tipos.

---

# ledger_balances

Saldos calculados.

---

# bank_accounts

Cuentas bancarias.

---

# bank_transactions

Movimientos banco.

---

# reconciliations

Conciliaciones.

---

# reconciliation_items

Detalle diferencias.

---

# Modelo Total

1 accounts

2 accounting_periods

3 journal_entries

4 journal_lines

5 financial_transactions

6 transaction_types

7 ledger_balances

8 bank_accounts

9 bank_transactions

10 reconciliations

11 reconciliation_items


Total:

11 tablas

---

# 10. Eventos

LoanDisbursed

PaymentReceived

InterestCalculated

FeeCharged

RefundCreated

TransactionReconciled

---

# 11. KPIs

Cartera total.

Ingresos.

Intereses cobrados.

Diferencias conciliación.

Utilidad.

---

# Tecnologías

## MVP

PostgreSQL

NestJS

Event driven architecture


## Escala

Accounting service independiente.

Data warehouse.

BI financiero.

---

# Próximo Documento

DAD-35

Payment Platform Bolivia

Incluye:

- QR Bolivia;
- pagos digitales;
- bancos;
- conciliación;
- proveedores;
- APIs financieras;
- desembolsos.