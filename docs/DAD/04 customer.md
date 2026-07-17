# Data Architecture Document (DAD)

# Parte IV

# Customer Management & KYC

Versión 1.0

---

# Tabla de Contenido

1. Objetivo
2. Responsabilidades
3. Aggregate Root
4. Modelo del Dominio
5. Estados del Cliente
6. Entidades
7. Relaciones
8. Eventos
9. Modelo de Datos
10. Reglas de Negocio

---

# 1. Objetivo

Este dominio administra toda la información del cliente.

Una vez que un Lead completa el proceso de identificación (KYC), se convierte en Customer.

A partir de ese momento podrá:

- Solicitar préstamos.
- Firmar contratos.
- Recibir desembolsos.
- Realizar pagos.
- Ser evaluado.
- Tener historial financiero.

Este dominio NO administra préstamos.

Solo administra personas.

---

# 2. Responsabilidades

• Información personal

• KYC

• Direcciones

• Empleo

• Ingresos

• Referencias

• Beneficiarios

• Dependientes

• Cuentas bancarias

• Perfil financiero

• Score

• Riesgo

• Blacklist

• Historial

---

# 3. Aggregate Root

Customer

---

# 4. Modelo del Dominio

```

Customer
│
├── PersonalInformation
├── Addresses
├── Phones
├── Emails
├── Employment
├── Income
├── References
├── BankAccounts
├── Documents
├── Beneficiaries
├── Dependents
├── Assets
├── Liabilities
├── RiskProfile
├── CreditProfile
├── Preferences
└── Audit

```

---

# 5. Estados

## CustomerStatus

```

PENDING_KYC

ACTIVE

INACTIVE

BLOCKED

BLACKLISTED

DECEASED

```

---

## KYCStatus

```

NOT_STARTED

IN_PROGRESS

PENDING_REVIEW

APPROVED

REJECTED

EXPIRED

```

---

## EmploymentStatus

```

EMPLOYEE

SELF_EMPLOYED

BUSINESS_OWNER

RETIRED

UNEMPLOYED

STUDENT

```

---

# 6. Entidades

## Customer

Persona registrada.

---

## Addresses

Direcciones.

Un cliente puede tener varias.

Ejemplo

Casa

Trabajo

Correspondencia

---

## Phones

Múltiples teléfonos.

---

## Emails

Múltiples correos.

---

## Employment

Información laboral.

---

## Income

Ingresos.

Puede tener varios.

---

## References

Referencias personales.

---

## Beneficiaries

Beneficiarios.

---

## Dependents

Dependientes económicos.

---

## Assets

Bienes.

---

## Liabilities

Deudas.

---

## Bank Accounts

Cuentas bancarias.

---

## Risk Profile

Perfil de riesgo.

---

## Credit Profile

Información crediticia.

---

## Preferences

Preferencias.

Idioma

Canal

Horario

---

## Blacklist

Lista negra.

---

# 7. Relaciones

```

Customer

│

├── Addresses

├── Phones

├── Emails

├── Employment

├── Income

├── References

├── Beneficiaries

├── Dependents

├── Assets

├── Liabilities

├── BankAccounts

├── Documents

├── RiskProfile

├── CreditProfile

└── Preferences

```

---

# 8. Eventos

```

CustomerCreated

CustomerUpdated

CustomerActivated

CustomerBlocked

CustomerBlacklisted

CustomerKycApproved

CustomerKycRejected

CustomerRiskUpdated

CustomerIncomeUpdated

CustomerDocumentAdded

CustomerAddressChanged

```

---

# 9. Modelo de Datos

---

## customers

| Campo | Tipo |
|--------|------|
| id | UUID |
| organization_id | UUID |
| lead_id | UUID |
| customer_number | varchar(30) |
| first_name | varchar(100) |
| middle_name | varchar(100) |
| last_name | varchar(100) |
| second_last_name | varchar(100) |
| document_type | varchar(30) |
| document_number | varchar(30) |
| birth_date | date |
| gender | varchar(20) |
| marital_status | varchar(30) |
| nationality | varchar(100) |
| occupation | varchar(100) |
| status | CustomerStatus |
| kyc_status | KYCStatus |
| risk_level | varchar(20) |
| created_at | timestamptz |

Índices

```

ix_customer_number

ix_document

ix_customer_status

ix_customer_kyc

```

---

## customer_addresses

| Campo |
|--------|
| id |
| customer_id |
| type |
| country |
| department |
| province |
| city |
| zone |
| street |
| number |
| latitude |
| longitude |
| primary_address |

---

## customer_phones

| Campo |
|--------|
| id |
| customer_id |
| phone |
| whatsapp |
| verified |
| primary_phone |

---

## customer_emails

| Campo |
|--------|
| id |
| customer_id |
| email |
| verified |
| primary_email |

---

## customer_employment

| Campo |
|--------|
| id |
| customer_id |
| employer |
| employment_status |
| position |
| salary |
| years_working |
| start_date |

---

## customer_income

Permite múltiples ingresos.

| Campo |
|--------|
| id |
| customer_id |
| source |
| amount |
| frequency |
| verified |

Ejemplos

Salario

Negocio

Alquiler

Comisiones

Pensión

---

## customer_references

| Campo |
|--------|
| id |
| customer_id |
| full_name |
| relationship |
| phone |
| address |

---

## customer_bank_accounts

| Campo |
|--------|
| id |
| customer_id |
| bank |
| account_type |
| account_number |
| holder_name |
| verified |

---

## customer_assets

Ejemplos

Casa

Vehículo

Terreno

Negocio

Maquinaria

| Campo |
|--------|
| id |
| customer_id |
| asset_type |
| description |
| estimated_value |

---

## customer_liabilities

Otras deudas.

| Campo |
|--------|
| id |
| customer_id |
| creditor |
| monthly_payment |
| outstanding_balance |

---

## customer_dependents

| Campo |
|--------|
| id |
| customer_id |
| full_name |
| relationship |
| birth_date |

---

## customer_beneficiaries

| Campo |
|--------|
| id |
| customer_id |
| full_name |
| relationship |
| percentage |

---

## customer_risk_profiles

| Campo |
|--------|
| id |
| customer_id |
| risk_level |
| score |
| evaluated_at |
| evaluated_by |

---

## customer_credit_profiles

| Campo |
|--------|
| id |
| customer_id |
| internal_score |
| debt_ratio |
| payment_behavior |
| last_evaluation |

---

## customer_preferences

| Campo |
|--------|
| id |
| customer_id |
| language |
| timezone |
| preferred_channel |
| marketing_enabled |

---

## customer_blacklist

| Campo |
|--------|
| id |
| customer_id |
| reason |
| severity |
| blocked_at |
| blocked_by |

---

# 10. Reglas

Un documento de identidad solo puede pertenecer a un Customer activo.

Un Customer debe tener al menos un teléfono principal.

Un Customer debe tener un KYC válido antes de recibir un desembolso.

Un Customer puede tener múltiples cuentas bancarias, pero solo una marcada como principal.

Nunca se elimina un Customer; únicamente cambia su estado.

Toda modificación relevante (documento, dirección, cuenta bancaria o perfil de riesgo) debe generar un evento de dominio y un registro de auditoría.

---

# KPIs

• Clientes activos

• Clientes nuevos

• Tiempo promedio de aprobación KYC

• Clientes bloqueados

• Clientes en lista negra

• Ingreso promedio

• Riesgo promedio

• Distribución por ciudad

• Distribución por actividad económica

---

# Tablas Totales

1. customers
2. customer_addresses
3. customer_phones
4. customer_emails
5. customer_employment
6. customer_income
7. customer_references
8. customer_bank_accounts
9. customer_assets
10. customer_liabilities
11. customer_dependents
12. customer_beneficiaries
13. customer_risk_profiles
14. customer_credit_profiles
15. customer_preferences
16. customer_blacklist

**Total:** 16 tablas

---

# Próximo Documento

**DAD-05 — Loan Application & Digital Onboarding**

En esta parte se modelará el proceso completo desde que un Customer inicia una solicitud de préstamo hasta que queda lista para evaluación.

Incluye:

- Solicitudes
- Formularios dinámicos
- Respuestas
- Checklist documental
- Validaciones
- Motor de reglas
- Flujo de aprobación
- Estados de la solicitud
- Asignación a analistas
- Historial de cambios
- Línea de tiempo de la solicitud

Este dominio será el puente entre el CRM/Customer y el núcleo financiero (Loan Core).