# Data Architecture Document (DAD)

# Parte VIII

# Loan Core Banking

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
9. Reglas

---

# 1. Objetivo

Este dominio administra toda la vida financiera del préstamo.

Desde la oferta hasta el cierre definitivo.

Es el núcleo financiero del sistema.

---

# 2. Arquitectura

```
Loan Product

↓

Loan Offer

↓

Loan Contract

↓

Loan Account

↓

Repayment Schedule

↓

Collections

↓

Closed
```

---

# 3. Aggregate Roots

LoanProduct

LoanOffer

Loan

LoanContract

LoanAccount

---

# 4. Flujo

```
Solicitud

↓

Evaluación

↓

Oferta

↓

Aceptación Cliente

↓

Contrato

↓

Firma

↓

Desembolso

↓

Préstamo Activo

↓

Pagos

↓

Finalizado
```

---

# 5. Estados

LoanStatus

```
CREATED

APPROVED

WAITING_SIGNATURE

SIGNED

DISBURSED

ACTIVE

OVERDUE

RESTRUCTURED

REFINANCED

WRITTEN_OFF

CLOSED

CANCELLED
```

---

OfferStatus

```
GENERATED

SENT

ACCEPTED

REJECTED

EXPIRED
```

---

InstallmentStatus

```
PENDING

PARTIALLY_PAID

PAID

OVERDUE

CANCELLED
```

---

# 6. Entidades

LoanProduct

LoanOffer

Loan

LoanContract

LoanAccount

LoanDisbursement

Installment

InstallmentInterest

InstallmentFees

LoanPenalty

LoanGuarantee

LoanCollateral

LoanRestructure

LoanRefinance

LoanSettlement

LoanTransaction

LoanStatement

LoanHistory

---

# 7. Eventos

LoanCreated

LoanApproved

OfferAccepted

ContractSigned

LoanDisbursed

InstallmentGenerated

PaymentApplied

LoanRestructured

LoanRefinanced

LoanClosed

LoanWrittenOff

---

# 8. Modelo de Datos

---

## loan_products

Catálogo de productos.

| Campo | Tipo |
|--------|------|
| id | UUID |
| code | varchar(50) |
| name | varchar(200) |
| minimum_amount | numeric(18,2) |
| maximum_amount | numeric(18,2) |
| minimum_term | integer |
| maximum_term | integer |
| interest_rate | numeric(8,4) |
| late_interest_rate | numeric(8,4) |
| currency |
| active |

Ejemplos

Microcrédito

Consumo

Pyme

Educación

---

## loan_offers

Oferta enviada al cliente.

| Campo |
|--------|
| id |
| application_id |
| loan_product_id |
| approved_amount |
| approved_term |
| monthly_payment |
| interest_rate |
| expires_at |
| status |

---

## loans

Representa el préstamo aprobado.

| Campo |
|--------|
| id |
| customer_id |
| offer_id |
| loan_number |
| status |
| opened_at |
| closed_at |

---

## loan_contracts

Contrato legal.

| Campo |
|--------|
| id |
| loan_id |
| contract_number |
| signed |
| signed_at |
| document_id |

---

## loan_accounts

Cuenta financiera.

| Campo |
|--------|
| id |
| loan_id |
| principal_balance |
| interest_balance |
| fee_balance |
| penalty_balance |
| total_balance |
| next_due_date |

---

## loan_disbursements

Desembolsos.

| Campo |
|--------|
| id |
| loan_id |
| amount |
| bank_account_id |
| qr_payment |
| transaction_reference |
| disbursed_at |

---

## installments

Cronograma.

| Campo |
|--------|
| id |
| loan_id |
| installment_number |
| due_date |
| principal |
| interest |
| fees |
| penalties |
| total |
| paid |
| status |

---

## installment_interest

Detalle de intereses.

| Campo |
|--------|
| id |
| installment_id |
| interest_type |
| amount |

---

## installment_fees

Comisiones.

| Campo |
|--------|
| id |
| installment_id |
| fee_type |
| amount |

---

## loan_penalties

Multas.

| Campo |
|--------|
| id |
| installment_id |
| reason |
| amount |
| calculated_at |

---

## loan_guarantees

Garantías.

| Campo |
|--------|
| id |
| loan_id |
| guarantee_type |
| description |
| value |

---

## loan_collateral

Bienes dados en garantía.

| Campo |
|--------|
| id |
| loan_id |
| asset |
| estimated_value |

---

## loan_restructures

Reestructuraciones.

| Campo |
|--------|
| id |
| loan_id |
| reason |
| previous_schedule |
| new_schedule |
| approved_by |

---

## loan_refinances

Refinanciaciones.

| Campo |
|--------|
| id |
| original_loan_id |
| new_loan_id |
| reason |

---

## loan_settlements

Liquidación.

| Campo |
|--------|
| id |
| loan_id |
| settlement_amount |
| settled_at |

---

## loan_transactions

Libro mayor del préstamo.

Nunca modificar.

| Campo |
|--------|
| id |
| loan_id |
| transaction_type |
| amount |
| balance_after |
| reference |
| created_at |

Ejemplos

DISBURSEMENT

PAYMENT

INTEREST

FEE

PENALTY

ADJUSTMENT

REVERSAL

---

## loan_statements

Estados de cuenta.

| Campo |
|--------|
| id |
| loan_id |
| period |
| opening_balance |
| closing_balance |
| generated_at |

---

## loan_history

Historial completo.

| Campo |
|--------|
| id |
| loan_id |
| event |
| previous_status |
| new_status |
| created_at |

---

# 9. Reglas

Nunca modificar un préstamo.

Toda modificación genera una transacción.

Nunca modificar cuotas.

Si cambia el cronograma se crea una reestructuración.

Nunca modificar desembolsos.

Los saldos siempre se calculan desde las transacciones.

Todo préstamo tiene exactamente una cuenta financiera.

Toda cuota pertenece únicamente a un préstamo.

Un préstamo puede tener múltiples desembolsos (preparado para futuras ampliaciones).

---

# Ledger

El préstamo utilizará un pequeño libro mayor.

Ejemplo

```
+10.000 Desembolso

-450 Pago

+20 Mora

-300 Pago

+15 Interés

-200 Pago
```

El saldo nunca se guarda manualmente.

Siempre se calcula a partir del ledger.

---

# KPIs

Monto colocado

Cartera activa

Capital pendiente

Interés generado

Interés cobrado

Mora

Préstamos refinanciados

Préstamos castigados

Duración promedio

Rentabilidad

---

# Tablas Totales

1 loan_products

2 loan_offers

3 loans

4 loan_contracts

5 loan_accounts

6 loan_disbursements

7 installments

8 installment_interest

9 installment_fees

10 loan_penalties

11 loan_guarantees

12 loan_collateral

13 loan_restructures

14 loan_refinances

15 loan_settlements

16 loan_transactions

17 loan_statements

18 loan_history

Total

18 tablas

---

# Próximo Documento

DAD-09

Payments & QR Banking

Se modelará el sistema completo de pagos:

- QR interoperable Bolivia
- Bancos
- Transferencias
- Reconciliación bancaria
- Pagos parciales
- Pagos adelantados
- Distribución automática del pago
- Reversiones
- Comprobantes
- Integración con pasarelas