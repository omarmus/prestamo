# Data Architecture Document (DAD)

# Parte XI

# Accounting & Financial Ledger

Versión 1.0

---

# Tabla de Contenido

1. Objetivo
2. Arquitectura
3. Aggregate Roots
4. Flujo Contable
5. Estados
6. Entidades
7. Eventos
8. Modelo de Datos
9. Reglas de Negocio

---

# 1. Objetivo

Registrar todos los movimientos financieros del sistema bajo principios de contabilidad de doble partida.

Este módulo será la fuente de verdad financiera.

Nunca modificará registros existentes.

Todas las correcciones se realizarán mediante asientos reversos o ajustes.

---

# 2. Arquitectura

```
Evento de Negocio

↓

Accounting Engine

↓

Journal

↓

Journal Entries

↓

Ledger

↓

Balances

↓

Reportes
```

---

# 3. Aggregate Roots

ChartOfAccount

Journal

JournalEntry

LedgerAccount

---

# 4. Flujo

```
Desembolso

↓

Generar Asiento

↓

Débito

↓

Crédito

↓

Actualizar Saldos

↓

Libro Mayor
```

---

# 5. Estados

JournalStatus

```
DRAFT

POSTED

REVERSED

VOID
```

---

LedgerStatus

```
ACTIVE

INACTIVE

CLOSED
```

---

# 6. Entidades

ChartOfAccount

AccountCategory

Journal

JournalEntry

JournalEntryLine

LedgerBalance

AccountingPeriod

CostCenter

AccountingRule

ExchangeRate

FinancialStatement

AuditTrail

---

# 7. Eventos

JournalCreated

JournalPosted

JournalReversed

BalanceUpdated

PeriodOpened

PeriodClosed

FinancialStatementGenerated

---

# 8. Modelo de Datos

---

## chart_of_accounts

Plan de cuentas.

| Campo | Tipo |
|--------|------|
| id | UUID |
| code | varchar(20) |
| name | varchar(200) |
| category | varchar(50) |
| parent_id | UUID |
| normal_balance | varchar(10) |
| active | boolean |

Ejemplos

1101 Caja

1102 Bancos

1201 Cartera de Créditos

2101 Intereses por Cobrar

4101 Ingresos Financieros

5101 Gastos Operativos

---

## accounting_periods

Períodos.

| Campo |
|--------|
| id |
| year |
| month |
| status |
| opened_at |
| closed_at |

---

## journals

Cabecera del asiento.

| Campo |
|--------|
| id |
| journal_number |
| journal_type |
| status |
| reference_type |
| reference_id |
| description |
| posted_at |

---

## journal_entries

Detalle del asiento.

| Campo |
|--------|
| id |
| journal_id |
| account_id |
| debit |
| credit |
| currency |
| exchange_rate |
| description |

Regla:

**La suma de débitos debe ser igual a la suma de créditos.**

---

## ledger_balances

Saldo por cuenta.

| Campo |
|--------|
| id |
| account_id |
| period_id |
| opening_balance |
| debit_total |
| credit_total |
| closing_balance |

---

## accounting_rules

Motor de contabilización.

| Campo |
|--------|
| id |
| event_name |
| debit_account |
| credit_account |
| active |

Ejemplo

```
LoanDisbursed

Débito:
1201 Cartera de Créditos

Crédito:
1102 Bancos
```

---

## cost_centers

Centros de costo.

Ejemplos

Santa Cruz

La Paz

Cochabamba

Marketing

Operaciones

Cobranza

---

## exchange_rates

Preparado para múltiples monedas.

| Campo |
|--------|
| id |
| currency |
| rate |
| effective_date |

---

## financial_statements

Estados financieros generados.

| Campo |
|--------|
| id |
| statement_type |
| period_id |
| generated_at |
| document_id |

---

## accounting_audit

Auditoría.

| Campo |
|--------|
| id |
| journal_id |
| action |
| user_id |
| created_at |

---

# 9. Reglas

Todo evento financiero genera un asiento.

Nunca modificar un asiento publicado.

Toda reversión genera un nuevo asiento.

No se puede cerrar un período con diferencias.

Cada movimiento debe estar asociado a un evento de negocio.

Las reglas contables deben ser parametrizables.

---

# Ejemplos de Asientos

## Desembolso de préstamo

```
Débito

1201 Cartera de Créditos      Bs 10.000

Crédito

1102 Bancos                   Bs 10.000
```

---

## Pago de una cuota

```
Débito

1102 Bancos                   Bs 500

Crédito

1201 Capital                  Bs 420

Crédito

2101 Intereses                Bs 60

Crédito

2201 Mora                     Bs 20
```

---

## Castigo de préstamo

```
Débito

5105 Pérdida por Incobrables

Crédito

1201 Cartera de Créditos
```

---

# Reportes

Libro Diario

Libro Mayor

Balance General

Estado de Resultados

Flujo de Caja

Balance de Comprobación

Auxiliares

---

# KPIs

Cartera vigente

Cartera vencida

Ingresos financieros

Intereses devengados

Intereses cobrados

Pérdidas

Rentabilidad

Liquidez

---

# Tablas Totales

1. chart_of_accounts
2. accounting_periods
3. journals
4. journal_entries
5. ledger_balances
6. accounting_rules
7. cost_centers
8. exchange_rates
9. financial_statements
10. accounting_audit

Total: 10 tablas

---

# Próximo Documento

DAD-12

Notification & Communication Hub

Se diseñará el centro de comunicaciones:

- WhatsApp Business
- Bot IA
- SMS
- Email
- Push Notifications
- Plantillas
- Campañas
- Recordatorios automáticos
- Colas de envío
- Webhooks
- Historial de comunicaciones