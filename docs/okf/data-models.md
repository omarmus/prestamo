# Modelos de Datos — DAD (01-49)

Extraído de los Documentos de Arquitectura de Datos.

---

## 02 — Identity & Access Management

```text
users
│
├──< user_roles >──── roles
│                       │
│                       └──< role_permissions >── permissions
│
├── sessions
├── refresh_tokens
├── devices
├── login_history
├── api_keys
├── mfa_devices
└── security_events
```

# 10. Modelo de Datos

---

## users

Descripción

Usuarios internos.

Campos

| Campo | Tipo | Restricciones |
|---------|----------------|----------------|
| id | UUID | PK |
| organization_id | UUID | FK |
| first_name | varchar(100) | NOT NULL |
| last_name | varchar(100) | NOT NULL |
| email | varchar(255) | UNIQUE |
| phone | varchar(30) | UNIQUE |
| password_hash | text | NOT NULL |
| status | UserStatus | INDEX |
| last_login_at | timestamptz | NULL |
| password_changed_at | timestamptz | |
| failed_attempts | integer | DEFAULT 0 |
| locked_until | timestamptz | |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| deleted_at | timestamptz | |

Índices

```
ix_users_email

ix_users_phone

ix_users_status

ix_users_organization
```

---

## roles

| Campo | Tipo |
|---------|------|
| id | UUID |
| code | varchar(50) UNIQUE |
| name | varchar(100) |
| description | text |

---

## permissions

| Campo | Tipo |
|---------|------|
| id | UUID |
| code | varchar(100) UNIQUE |
| module | varchar(50) |
| action | varchar(50) |
| description | text |

Ejemplos

customer.read

customer.write

customer.export

loan.approve

loan.reject

loan.disburse

payment.create

payment.refund

---

## user_roles

| Campo |
|--------|
| id |
| user_id |
| role_id |
| assigned_by |
| assigned_at |

---

## role_permissions

| Campo |
|--------|
| id |
| role_id |
| permission_id |

---

## sessions

| Campo |
|--------|
| id |
| user_id |
| refresh_token |
| ip_address |
| user_agent |
| device_id |
| expires_at |
| revoked_at |
| created_at |

---

## refresh_tokens

| Campo |
|--------|
| id |
| session_id |
| token_hash |
| expires_at |
| revoked |

---

## login_history

| Campo |
|--------|
| id |
| user_id |
| email |
| success |
| ip |
| device |
| browser |
| os |
| country |
| city |
| created_at |

---

## devices

| Campo |
|--------|
| id |
| user_id |
| fingerprint |
| device_name |
| platform |
| browser |
| trusted |
| last_seen |

---

## mfa_devices

| Campo |
|--------|
| id |
| user_id |
| type |
| secret |
| enabled |
| verified_at |

---

## api_keys

| Campo |
|--------|
| id |
| organization_id |
| name |
| key_hash |
| scopes |
| expires_at |
| last_used_at |
| active |

Las claves nunca se almacenan en texto plano.

---

## oauth_clients

Preparado para futuras integraciones.

---

## security_events

| Campo |
|--------|
| id |
| user_id |
| event |
| metadata JSONB |
| ip |
| created_at |

---

# Relaciones Totales

users

↓

roles

↓

permissions

↓

sessions

↓

devices

↓

tokens

↓

login history

↓

security

---

# Resumen

Tablas

1. users
2. roles
3. permissions
4. user_roles
5. role_permissions
6. sessions
7. refresh_tokens
8. devices
9. login_history
10. mfa_devices
11. api_keys
12. oauth_clients
13. security_events

Total

13 tablas

---

## 03 — CRM

# 9. Modelo de Datos

---

## leads

Descripción

Prospectos registrados.

| Campo | Tipo |
|---------|----------|
| id | UUID |
| organization_id | UUID |
| source_id | UUID |
| campaign_id | UUID |
| first_name | varchar(100) |
| last_name | varchar(100) |
| phone | varchar(30) |
| email | varchar(255) |
| document_number | varchar(30) |
| requested_amount | numeric(18,2) |
| monthly_income | numeric(18,2) |
| city | varchar(100) |
| status | LeadStatus |
| score | numeric(5,2) |
| assigned_to | UUID |
| created_at | timestamptz |

Índices

```
ix_leads_phone

ix_leads_document

ix_leads_status

ix_leads_assigned

ix_leads_created_at
```

---

## lead_sources

| Campo |
|--------|
| id |
| code |
| name |
| active |

Ejemplos

FACEBOOK

GOOGLE

WHATSAPP

REFERRAL

ORGANIC

---

## campaigns

| Campo |
|--------|
| id |
| name |
| channel |
| budget |
| start_date |
| end_date |
| active |

---

## lead_tags

Relaciona Leads con Tags.

---

## tags

Ejemplos

VIP

URGENT

REFERRED

HIGH_VALUE

RETURNING

---

## lead_notes

| Campo |
|--------|
| id |
| lead_id |
| user_id |
| note |
| created_at |

---

## lead_activities

| Campo |
|--------|
| id |
| lead_id |
| activity_type |
| description |
| user_id |
| created_at |

---

## follow_ups

| Campo |
|--------|
| id |
| lead_id |
| assigned_to |
| due_date |
| completed |
| completed_at |

---

## lead_assignments

Permite reasignar Leads entre analistas.

| Campo |
|--------|
| id |
| lead_id |
| from_user |
| to_user |
| reason |
| assigned_at |

---

## conversations

Representa una conversación.

No depende únicamente de WhatsApp.

En el futuro podrá soportar:

WhatsApp

Web Chat

Telegram

Facebook Messenger

Instagram

---

| Campo |
|--------|
| id |
| lead_id |
| channel |
| status |
| started_at |
| closed_at |

---

## conversation_messages

| Campo |
|--------|
| id |
| conversation_id |
| sender |
| message_type |
| body |
| media_url |
| ai_generated |
| delivered |
| read_at |
| created_at |

---

## attachments

Archivos enviados.

| Campo |
|--------|
| id |
| lead_id |
| conversation_id |
| file_name |
| mime_type |
| storage_key |
| uploaded_by |
| uploaded_at |

---

## 04 — Customer Management & KYC

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

## 05 — Loan Application & Digital Onboarding

# 9. Modelo de Datos

---

## loan_applications

Representa la solicitud principal.

| Campo | Tipo |
|---------|------|
| id | UUID |
| organization_id | UUID |
| customer_id | UUID |
| loan_product_id | UUID |
| requested_amount | numeric(18,2) |
| requested_term | integer |
| requested_installments | integer |
| purpose | text |
| monthly_income | numeric(18,2) |
| monthly_expenses | numeric(18,2) |
| status | LoanApplicationStatus |
| priority | ApplicationPriority |
| score | numeric(6,2) |
| assigned_to | UUID |
| created_at | timestamptz |

Índices

```

ix_application_customer

ix_application_status

ix_application_assigned

ix_application_created

```

---

## application_answers

Respuestas del formulario dinámico.

| Campo |
|--------|
| id |
| application_id |
| question_code |
| answer |
| data_type |

Ejemplo

```

monthly_income

8500

numeric

```

---

## application_documents

Documentos asociados.

| Campo |
|--------|
| id |
| application_id |
| customer_document_id |
| document_type |
| uploaded |
| validated |
| required |

---

## application_checklists

Checklist configurable.

Ejemplos

☑ CI

☑ Selfie

☑ Boleta

☑ Extracto bancario

☑ Croquis

---

| Campo |
|--------|
| id |
| application_id |
| item |
| completed |
| completed_at |

---

## application_assignments

Asignación de analistas.

| Campo |
|--------|
| id |
| application_id |
| assigned_to |
| assigned_by |
| reason |
| assigned_at |

---

## application_comments

Comentarios internos.

| Campo |
|--------|
| id |
| application_id |
| user_id |
| visibility |
| comment |
| created_at |

visibility

```

PRIVATE

CUSTOMER

AUDIT

```

---

## application_scoring

Resultado de la evaluación.

| Campo |
|--------|
| id |
| application_id |
| ai_score |
| financial_score |
| fraud_score |
| final_score |
| recommendation |

recommendation

```

APPROVE

REJECT

MANUAL_REVIEW

```

---

## application_rules

Motor de reglas.

| Campo |
|--------|
| id |
| application_id |
| rule_name |
| result |
| score |
| message |

Ejemplos

```

Edad mínima

PASSED

Edad máxima

PASSED

Documento válido

PASSED

Ingresos suficientes

FAILED

```

---

## application_decisions

Resultado final.

| Campo |
|--------|
| id |
| application_id |
| decision |
| approved_amount |
| approved_term |
| approved_rate |
| observations |
| decided_by |
| decided_at |

---

## application_history

Toda modificación.

Nunca eliminar.

| Campo |
|--------|
| id |
| application_id |
| event |
| previous_status |
| new_status |
| performed_by |
| performed_at |

---

## application_timeline

Timeline visual.

| Campo |
|--------|
| id |
| application_id |
| event |
| description |
| icon |
| created_at |

Ejemplo

```

Solicitud creada

↓

Documentos recibidos

↓

IA completó evaluación

↓

Analista asignado

↓

Préstamo aprobado

```

---

## 06 — Document Management & KYC Verification

# 8. Modelo de Datos

---

## documents

Documento principal.

| Campo | Tipo |
|--------|------|
| id | UUID |
| organization_id | UUID |
| customer_id | UUID |
| application_id | UUID |
| category_id | UUID |
| type_id | UUID |
| status | DocumentStatus |
| current_version | integer |
| storage_provider | varchar(30) |
| created_at | timestamptz |

Índices

```

ix_documents_customer

ix_documents_application

ix_documents_status

```

---

## document_categories

Ejemplos

IDENTITY

INCOME

BANK

CONTRACT

LEGAL

PAYMENT

PHOTO

OTHER

---

## document_types

Ejemplos

CI_FRONT

CI_BACK

SELFIE

LIVENESS

PAYSLIP

BANK_STATEMENT

SERVICE_BILL

CONTRACT

PROMISSORY_NOTE

QR_RECEIPT

---

## document_versions

Cada modificación crea una nueva versión.

Nunca sobrescribir archivos.

| Campo |
|--------|
| id |
| document_id |
| version |
| storage_key |
| file_name |
| mime_type |
| size |
| checksum |
| uploaded_by |
| uploaded_at |

---

## document_storage

Información física.

| Campo |
|--------|
| id |
| document_version_id |
| provider |
| bucket |
| region |
| storage_key |
| url |
| encrypted |

Proveedor

```

AWS_S3

MINIO

AZURE

GCS

```

---

## document_hashes

Integridad.

| Campo |
|--------|
| id |
| document_version_id |
| algorithm |
| hash |

Algoritmos

```

SHA256

SHA512

```

---

## ocr_results

Resultado OCR.

| Campo |
|--------|
| id |
| document_id |
| provider |
| confidence |
| extracted_data JSONB |
| processed_at |

Ejemplo JSON

```

{

"name":"Juan",

"document":"1234567",

"birth_date":"1994-02-10"

}

```

---

## document_validations

Resultado de validaciones.

| Campo |
|--------|
| id |
| document_id |
| validation_type |
| status |
| observations |
| validated_by |
| validated_at |

Tipos

```

OCR

MANUAL

AI

EXTERNAL

```

---

## biometric_validations

Reconocimiento facial.

| Campo |
|--------|
| id |
| customer_id |
| selfie_document_id |
| confidence |
| provider |
| result |
| validated_at |

---

## liveness_validations

Prueba de vida.

| Campo |
|--------|
| id |
| customer_id |
| video_document_id |
| result |
| confidence |
| provider |

---

## electronic_signatures

Firmas electrónicas.

| Campo |
|--------|
| id |
| customer_id |
| document_id |
| signed_at |
| provider |
| certificate |
| signature_hash |

---

## document_shares

Compartición segura.

| Campo |
|--------|
| id |
| document_id |
| token |
| expires_at |
| downloaded |

---

## document_audit

Auditoría.

| Campo |
|--------|
| id |
| document_id |
| action |
| user_id |
| ip |
| created_at |

---

## 07 — Credit Decision Engine

# 9. Modelo de Datos

---

## evaluations

Evaluación principal.

| Campo | Tipo |
|--------|------|
| id | UUID |
| application_id | UUID |
| status | EvaluationStatus |
| final_score | numeric(8,4) |
| recommendation | Recommendation |
| evaluated_by |
| started_at |
| completed_at |

---

## evaluation_rules

Catálogo de reglas.

| Campo |
|--------|
| id |
| code |
| name |
| category |
| enabled |
| weight |
| expression |

Ejemplo

```

AGE_MIN

monthly_income > 2500

document_valid

```

---

## rule_executions

Resultado de cada regla.

| Campo |
|--------|
| id |
| evaluation_id |
| rule_id |
| result |
| score |
| message |

---

## evaluation_variables

Variables utilizadas.

| Campo |
|--------|
| id |
| evaluation_id |
| variable |
| value |

Ejemplo

```

income

8500

```

```

expenses

2400

```

```

age

31

```

---

## risk_evaluations

Resultado financiero.

| Campo |
|--------|
| id |
| evaluation_id |
| debt_ratio |
| disposable_income |
| payment_capacity |
| risk_level |
| score |

---

## fraud_evaluations

Resultado antifraude.

| Campo |
|--------|
| id |
| evaluation_id |
| duplicate_document |
| duplicate_phone |
| duplicate_device |
| suspicious_location |
| score |

---

## ai_models

Catálogo.

Ejemplo

Claude

GPT

Gemini

DeepSeek

Qwen

OpenAI OSS

Llama

---

## ai_evaluations

Resultado IA.

| Campo |
|--------|
| id |
| evaluation_id |
| provider |
| model |
| prompt_version |
| tokens_input |
| tokens_output |
| cost |
| confidence |
| recommendation |
| explanation |
| created_at |

---

## evaluation_results

Resultado consolidado.

| Campo |
|--------|
| id |
| evaluation_id |
| rule_score |
| risk_score |
| fraud_score |
| ai_score |
| final_score |
| recommendation |

---

## decision_reasons

Explicabilidad.

| Campo |
|--------|
| id |
| evaluation_result_id |
| priority |
| reason |

Ejemplo

```

Ingresos insuficientes

```

```

Documento inconsistente

```

```

Cliente con buen historial

```

---

## evaluation_history

Historial.

Nunca eliminar.

| Campo |
|--------|
| id |
| evaluation_id |
| event |
| created_at |

---

## 08 — Loan Core Banking

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

## 09 — Payment Hub & QR Banking

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

## 10 — Collections & Recovery

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

## 11 — Accounting & Financial Ledger

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

## 12 — Conversational Banking Platform

# 9. Modelo de Datos

---

## conversations

| Campo |
|--------|
| id |
| customer_id |
| lead_id |
| channel |
| status |
| current_agent |
| started_at |
| closed_at |

---

## conversation_sessions

Cada conversación puede tener varias sesiones.

| Campo |
|--------|
| id |
| conversation_id |
| started_at |
| finished_at |

---

## messages

| Campo |
|--------|
| id |
| conversation_id |
| sender |
| direction |
| type |
| body |
| media_document_id |
| delivered |
| read_at |
| created_at |

---

## message_templates

Plantillas oficiales.

| Campo |
|--------|
| id |
| provider |
| template_name |
| language |
| category |
| active |

---

## campaigns

Campañas.

Ejemplos

Bienvenida

Cobranza

Promoción

Recordatorio

Reactivación

---

## broadcasts

Envíos masivos.

---

## reminders

Recordatorios automáticos.

Ejemplos

Pago mañana

Documento pendiente

Contrato pendiente

Promesa de pago

---

## notifications

Registro universal.

Todo mensaje enviado.

---

## webhooks

Eventos recibidos desde proveedores.

---

## conversation_context

Contexto utilizado por IA.

| Campo |
|--------|
| id |
| conversation_id |
| summary |
| last_intent |
| customer_state |
| updated_at |

---

## ai_interactions

Registro de IA.

| Campo |
|--------|
| id |
| conversation_id |
| provider |
| model |
| prompt_version |
| tokens_input |
| tokens_output |
| latency |
| cost |
| recommendation |
| response |
| created_at |

---

## conversation_intents

Clasificación.

Ejemplos

Solicitar préstamo

Consultar saldo

Pagar

Refinanciar

Cancelar

Hablar con asesor

Enviar documento

---

## human_transfers

Transferencias.

| Campo |
|--------|
| id |
| conversation_id |
| transferred_to |
| reason |
| accepted_at |

---

## conversation_memory

Memoria resumida.

Nunca guardar todo el historial como contexto.

Guardar resúmenes.

| Campo |
|--------|
| id |
| conversation_id |
| summary |
| created_at |

---

## 13 — Workflow & Business Process Engine

# Modelo de Datos

## workflows

| Campo |
|--------|
| id |
| code |
| name |
| module |
| current_version |
| active |

---

## workflow_versions

Versionado.

Nunca modificar un workflow activo.

---

## workflow_steps

Ejemplos

Inicio

Captura

Validación

IA

Supervisor

Fin

---

## workflow_transitions

Define conexiones.

```

Paso A

↓

Paso B

```

---

## workflow_conditions

Condiciones.

Ejemplos

Edad mayor a 18

Monto mayor a Bs 20.000

Cliente VIP

Documento válido

---

## workflow_actions

Acciones.

Ejemplos

Enviar WhatsApp

Generar QR

Solicitar Documento

Asignar Analista

Aprobar

Rechazar

Enviar Email

Generar Contrato

---

## workflow_executions

Cada proceso ejecutado.

---

## workflow_execution_steps

Historial.

---

## workflow_variables

Variables.

Ejemplo

```

loan_amount

2500

```

---

## workflow_history

Auditoría.

---

## Eventos

WorkflowStarted

StepCompleted

TransitionExecuted

WorkflowCompleted

WorkflowCancelled

---

## Reglas

Nunca modificar un workflow activo.

Siempre crear nueva versión.

Toda ejecución conserva la versión utilizada.

Todo cambio queda auditado.

---

## Ejemplo

```

Solicitud

↓

IA

↓

¿Score > 90?

↓

SI

↓

Aprobación

↓

NO

↓

Analista

```

---

## KPIs

Tiempo por workflow

Cuellos de botella

Paso más lento

Cantidad ejecutada

Errores

---

## 14 — Platform Foundation & Administration

# Modelo de Datos

## organizations

| Campo |
|--------|
| id |
| code |
| legal_name |
| commercial_name |
| tax_identifier |
| country |
| currency |
| timezone |
| active |

---

## organization_settings

Configuración.

Ejemplos

Moneda

IVA

Interés

Horario

WhatsApp

IA

---

## users

Usuarios.

---

## user_profiles

Información personal.

---

## roles

Administrador

Analista

Supervisor

Cobranza

Operaciones

Auditor

Soporte

---

## permissions

Modelo RBAC.

Ejemplo

loan.read

loan.create

loan.approve

payment.reverse

customer.edit

---

## role_permissions

Relación.

---

## user_roles

Asignaciones.

---

## feature_flags

Permite activar funcionalidades.

Ejemplos

Nuevo Score IA

Nuevo Motor QR

Nuevo Workflow

Nuevo OCR

---

## api_clients

Clientes externos.

Landing

Mobile

WhatsApp

Backoffice

Marketplace

---

## api_keys

Llaves.

Nunca guardar texto plano.

Guardar hash.

---

## configuration

Configuraciones dinámicas.

Ejemplos

Interés máximo

Monto mínimo

Horario laboral

Tiempo OTP

Timeout IA

---

## scheduler_jobs

Trabajos programados.

Ejemplos

Actualizar mora

Enviar recordatorios

Generar reportes

Backups

---

## scheduler_history

Historial.

---

## audit_logs

Auditoría completa.

Nunca eliminar.

---

## login_sessions

Sesiones.

---

## refresh_tokens

Tokens.

---

## devices

Dispositivos.

---

## ip_whitelist

Accesos permitidos.

---

## secrets

Nunca guardar secretos en variables.

Centralizar.

---

## Eventos

OrganizationCreated

UserCreated

PermissionGranted

FeatureEnabled

LoginSucceeded

LoginFailed

SchedulerExecuted

---

## Reglas

Toda acción queda auditada.

No existen usuarios sin organización.

Toda configuración es dinámica.

Todo cambio genera versión.

Nunca eliminar auditorías.

---

## KPIs

Usuarios activos

Sesiones

Errores

Tiempo login

Uso API

Uso IA

---

## Tablas Totales

1 organizations

2 organization_settings

3 users

4 user_profiles

5 roles

6 permissions

7 role_permissions

8 user_roles

9 feature_flags

10 api_clients

11 api_keys

12 configuration

13 scheduler_jobs

14 scheduler_history

15 audit_logs

16 login_sessions

17 refresh_tokens

18 devices

19 ip_whitelist

20 secrets

Total

20 tablas

---

## 15 — AI Platform

# 11. Modelo de Datos

---

## ai_providers

Ejemplos

OpenAI

Anthropic

Google

OpenRouter

DeepSeek

Together

Groq

NVIDIA

Ollama

---

## ai_models

| Campo |
|--------|
| id |
| provider |
| model_name |
| version |
| input_cost |
| output_cost |
| max_context |
| active |

---

## prompt_collections

Agrupa prompts.

Ejemplo

Cobranza

Evaluación

WhatsApp

OCR

---

## prompts

Prompt lógico.

---

## prompt_versions

Cada modificación genera versión.

Campos

Prompt

Variables

Temperatura

Top P

Herramientas

Modelo preferido

---

## ai_requests

Registro.

| Campo |
|--------|
| id |
| provider |
| model |
| prompt_version |
| module |
| input_tokens |
| output_tokens |
| latency |
| cost |
| cache |
| created_at |

---

## ai_responses

Respuesta.

---

## ai_feedback

Evaluación humana.

Útil para mejorar prompts.

---

## knowledge_documents

Documentos RAG.

Ejemplos

Políticas

Contratos

Reglamentos

FAQ

Productos

---

## knowledge_chunks

Fragmentos.

---

## embeddings

Vectores.

---

## vector_collections

Colecciones.

---

## ai_cache

Respuestas reutilizadas.

---

## ai_router_rules

Reglas.

Ejemplo

```
OCR

↓

Modelo barato
```

```
Cobranza

↓

Modelo económico
```

```
Evaluación

↓

Claude
```

---

## ai_budget

Presupuesto.

Mensual.

Diario.

Por módulo.

---

## ai_usage

Consumo.

Por organización.

Por usuario.

Por módulo.

---

## ai_fallbacks

Proveedor alternativo.

Ejemplo

Claude falla

↓

GPT

↓

DeepSeek

---

## 16 — Fraud Detection Platform

# Modelo de Datos

## fraud_cases

Caso principal.

---

## fraud_evaluations

Resultado completo.

Campos

Fraud Score

Risk Level

Recommendation

Confidence

---

## fraud_rules

Reglas.

Ejemplos

Documento duplicado

Más de 3 préstamos

Mismo teléfono

Mismo dispositivo

Mismo IP

VPN

Proxy

Tor

Root

Emulador

---

## fraud_alerts

Alertas.

---

## devices

Dispositivo.

Campos

OS

Versión

Marca

Modelo

Navegador

Idioma

Zona horaria

Resolución

---

## device_fingerprints

Fingerprint.

Hash único.

---

## ip_addresses

Historial.

ASN

Proveedor

VPN

Proxy

Tor

País

Ciudad

---

## locations

Ubicación.

GPS

Ciudad

Departamento

---

## behavior_profiles

Patrones.

Velocidad de escritura

Tiempo entre clics

Tiempo formulario

Copiar/Pegar

Mouse

Touch

---

## identity_profiles

Perfil.

Documentos

Emails

Teléfonos

Selfies

Cuentas bancarias

---

## velocity_checks

Ejemplos

5 solicitudes en 10 minutos

3 teléfonos

2 dispositivos

10 OTP

---

## blacklists

Lista negra.

---

## watchlists

Observación.

---

## fraud_history

Historial.

Nunca eliminar.

---

## Eventos

FraudDetected

FraudBlocked

AlertGenerated

DeviceRegistered

VelocityExceeded

IdentityMatched

BlacklistMatched

---

## IA

La IA podrá detectar

Patrones

Redes

Anomalías

Comportamientos

Fraudes similares

---

## KPIs

Fraudes

Falsos positivos

Tiempo detección

Fraudes evitados

Pérdidas evitadas

Score promedio

---

## Reglas

Nunca eliminar evidencia.

Nunca borrar fingerprint.

Toda evaluación queda registrada.

Toda alerta tiene prioridad.

Todo fraude genera auditoría.

---

## 17 — Data Warehouse & Business Intelligence Platform

# Modelo de Datos

## data_sources

Origen.

---

## datasets

Conjuntos.

---

## dataset_versions

Versiones.

---

## etl_jobs

Procesos.

---

## etl_history

Historial.

---

## dimensions

Ejemplos

Tiempo

Cliente

Ciudad

Producto

Canal

Analista

Campaña

---

## facts

Ejemplos

Préstamos

Pagos

Cobranza

IA

Fraude

---

## metrics

Ejemplos

Monto Prestado

Capital Pendiente

Ingresos

Intereses

Costo IA

Conversión

---

## dashboards

Tableros.

---

## reports

Reportes.

---

## kpis

Indicadores.

---

## ml_features

Variables utilizadas por IA.

---

## predictions

Predicciones.

---

## Eventos

DatasetCreated

ETLExecuted

DashboardGenerated

PredictionCalculated

---

## Reglas

Nunca consultar producción.

Todo llega mediante eventos.

Los datasets tienen versión.

Los reportes son reproducibles.

---

## 18 — API Gateway & Integration Platform

# Modelo de Datos

---

## api_clients

Clientes externos.

Ejemplos:

Mobile App

Partner A

ERP

---

Campos:

id

name

type

organization_id

active

---

## api_keys

Llaves.

Nunca guardar texto plano.

Guardar hash.

---

## oauth_applications

Aplicaciones OAuth.

---

## api_endpoints

Catálogo.

Ejemplo:

```

POST /loans

GET /customers

POST /payments

```

---

## api_requests

Auditoría.

Campos:

client

endpoint

ip

latency

status

created_at

---

## api_responses

Respuesta.

---

## integrations

Integraciones.

Ejemplos:

Banco Unión

WhatsApp

Firma electrónica

OCR

---

## connectors

Conectores técnicos.

Ejemplo:

```

BancoConnector

WhatsappConnector

ERPConnector

```

---

## external_systems

Sistemas externos.

---

## webhooks

Eventos enviados.

Ejemplo:

```

loan.approved

payment.completed

customer.created

```

---

## webhook_deliveries

Historial.

---

## transformation_rules

Conversión de datos.

Ejemplo:

Banco:

```
transactionId

↓

external_reference
```

---

## 19 — Event Bus & Distributed Architecture

*(Archivo vacío — no contiene sección Modelo de Datos)*

---

## 20 — Observability Platform

# 12. Modelo de Datos

---

## observability_events

Eventos técnicos.

Campos:

id

service

event

severity

timestamp

---

## logs

Registro completo.

---

## metrics

Valores numéricos.

---

## traces

Trazas distribuidas.

---

## alerts

Alertas generadas.

---

## alert_rules

Reglas.

Ejemplo:

```
Si errores > 5%

generar alerta
```

---

## incidents

Incidentes.

Ejemplo:

```
Caída banco QR
```

---

## incident_history

Historial.

---

## uptime_checks

Disponibilidad.

---

## performance_samples

Rendimiento.

---

## ai_observability

Métricas IA.

Campos:

model

tokens

cost

latency

quality_score

---

## business_metrics

KPIs negocio.

---

## 21 — Security Platform

# 11. Modelo de Datos

---

## users

Usuarios del sistema.

---

## identities

Identidades.

Campos:

type

provider

external_id

---

## credentials

Credenciales.

Nunca guardar contraseña.

---

## sessions

Sesiones activas.

---

## refresh_tokens

Tokens renovables.

---

## mfa_methods

Métodos MFA.

---

## roles

Roles.

---

## permissions

Permisos.

---

## role_permissions

Relación.

---

## user_roles

Asignaciones.

---

## policies

Reglas ABAC.

Ejemplo:

```
loan_amount < 10000
```

---

## access_logs

Registro accesos.

---

## security_events

Eventos seguridad.

---

## api_credentials

Credenciales externas.

---

## encryption_keys

Metadatos de claves.

Nunca guardar claves privadas aquí.

---

## device_trust

Dispositivos confiables.

---

## threat_events

Amenazas detectadas.

---

## 22 — KYC & Identity Verification Platform

# 8. Modelo de Datos

---

## kyc_profiles

Perfil KYC.

Campos:

id

customer_id

status

score

verified_at

---

## verification_cases

Cada proceso de validación.

---

## identity_documents

Documentos.

Campos:

type

number_hash

country

front_image

back_image

status

---

## document_extractions

Datos extraídos OCR.

Ejemplo:

```
Nombre

Fecha nacimiento

Número documento
```

---

## document_checks

Validaciones.

Ejemplo:

```
Documento borroso

Documento alterado
```

---

## selfie_captures

Selfies.

Campos:

storage_path

quality

created_at

---

## liveness_checks

Prueba vida.

Campos:

method

score

result

---

## biometric_checks

Comparación facial.

Campos:

similarity_score

threshold

result

---

## identity_matches

Comparaciones.

---

## kyc_scores

Resultado.

Ejemplo:

```
Score:

95/100
```

---

## verification_attempts

Intentos.

Importante para fraude.

---

## verification_providers

Proveedores externos.

Ejemplo:

OCR

Biometría

---

## 23 — Digital Contracts Platform

# 6. Modelo de Datos

---

## contracts

Contrato principal.

Campos:

id

loan_id

customer_id

status

version

created_at

signed_at

---

Estados:

```

DRAFT

GENERATED

SENT

VIEWED

SIGNED

ACTIVE

EXPIRED

CANCELLED

```

---

## contract_templates

Plantillas.

Campos:

name

country

product_type

version

active

---

## contract_versions

Versionamiento.

Ejemplo:

Contrato v1.0

Contrato v1.1

---

## contract_variables

Variables dinámicas.

Ejemplo:

```
{{customer_name}}

{{loan_amount}}

{{interest_rate}}
```

---

## documents

Archivos generados.

Campos:

storage_path

hash

mime_type

size

---

## signatures

Firmas.

Campos:

type

provider

status

timestamp

---

## signature_attempts

Intentos.

---

## evidence_records

Evidencias.

Campos:

ip

device

location

timestamp

hash

---

## acceptance_events

Aceptaciones.

Ejemplo:

Cliente aceptó términos.

---

## legal_notifications

Comunicaciones legales.

Ejemplo:

Envío contrato WhatsApp.

---

## contract_audit

Historial.

---

## 24 — Payment & QR Platform

# 8. Modelo de Datos

---

## payment_accounts

Cuentas receptoras.

---

## payment_methods

Métodos.

Ejemplo:

QR

Transferencia

Tarjeta

Efectivo

---

## payment_orders

Orden de cobro.

Ejemplo:

Cuota número 5.

---

## payment_transactions

Transacciones reales.

Campos:

id

amount

currency

status

provider

reference

---

## qr_codes

QR generados.

Campos:

payload

expiration

transaction_id

---

## payment_providers

Proveedores.

Ejemplo:

Banco

Pasarela

---

## payment_webhooks

Eventos externos.

---

## settlements

Liquidaciones.

---

## reconciliation_cases

Casos de diferencia.

---

## refunds

Devoluciones.

---

## payment_attempts

Intentos.

---

## payment_events

Historial.

---

## 25 — Marketing & Growth Platform

# 9. Modelo de Datos

---

## leads

Prospectos.

Campos:

id

name

phone

source

status

---

## lead_sources

Origen.

Ejemplo:

Facebook

Google

Referido

---

## campaigns

Campañas.

---

## campaign_messages

Mensajes.

---

## customer_segments

Segmentos.

---

## segment_members

Usuarios pertenecientes.

---

## marketing_events

Eventos.

Ejemplo:

click

conversion

---

## attribution_records

Atribución.

---

## referral_programs

Programas.

---

## referrals

Referidos.

---

## rewards

Beneficios.

---

## automations

Automatizaciones.

---

## automation_steps

Pasos.

---

## 26 — Customer Experience Platform

# 8. Modelo de Datos

---

## customer_profiles

Perfil principal.

---

## customer_preferences

Preferencias.

Ejemplo:

Idioma

Canal favorito

Horario contacto

---

## customer_devices

Dispositivos.

---

## customer_channels

Canales.

Ejemplo:

WhatsApp

Email

App

---

## conversations

Conversaciones.

Campos:

channel

status

started_at

---

## messages

Mensajes.

---

## conversation_context

Memoria conversación IA.

---

## customer_notifications

Notificaciones.

---

## notification_preferences

Preferencias.

---

## support_tickets

Soporte.

---

## ticket_messages

Conversación soporte.

---

## customer_feedback

Opiniones.

---

## 27 — Mobile Application Platform

# 9. Modelo de Datos

---

## mobile_devices

Dispositivos registrados.

---

## app_sessions

Sesiones móviles.

---

## push_tokens

Tokens notificaciones.

---

## mobile_permissions

Permisos.

---

## sync_operations

Operaciones sincronización.

---

## offline_records

Datos pendientes.

---

## app_versions

Control versiones.

---

## crash_reports

Errores aplicación.

---

## 28 — Infrastructure & DevOps Platform

# 12. Modelo de Datos

La infraestructura no necesita muchas tablas.

Pero requiere inventario:

---

## environments

Ambientes.

Ejemplo:

dev

staging

production

---

## deployments

Despliegues.

---

## services

Servicios registrados.

---

## infrastructure_resources

Recursos cloud.

---

## backups

Historial backups.

---

## incidents

Incidentes técnicos.

---

## 29 — Compliance & Regulatory Platform Bolivia

# 9. Modelo de Datos

---

## compliance_policies

Políticas.

---

## compliance_rules

Reglas.

---

## compliance_checks

Evaluaciones.

---

## audit_logs

Auditoría general.

---

## audit_events

Eventos detallados.

---

## regulatory_reports

Reportes.

---

## report_generations

Historial generación.

---

## fraud_cases

Casos fraude.

---

## fraud_indicators

Indicadores.

---

## risk_flags

Alertas riesgo.

---

## data_classifications

Clasificación datos.

---

## retention_policies

Políticas retención.

---

## consent_records

Consentimientos usuario.

---

## 30 — AI Platform & Intelligent Automation

# 10. Modelo de Datos

---

## ai_models

Modelos disponibles.

---

## ai_requests

Solicitudes IA.

Campos:

model

tokens

cost

latency

---

## ai_conversations

Conversaciones.

---

## ai_messages

Mensajes.

---

## ai_agents

Agentes.

---

## ai_tools

Herramientas disponibles.

---

## ai_memory

Memoria cliente.

---

## ai_embeddings

Información vectorial.

---

## ai_documents

Documentos procesados.

---

## ai_prompts

Versiones prompts.

---

## ai_evaluations

Evaluación calidad.

---

## 31 — Credit Risk & Scoring Platform

# 9. Modelo de Datos

---

## credit_applications

Solicitudes evaluación.

---

## credit_decisions

Decisiones finales.

---

## credit_rules

Reglas.

---

## rule_versions

Versiones.

---

## risk_scores

Scores generados.

---

## scoring_factors

Factores utilizados.

---

## credit_models

Modelos ML.

---

## model_versions

Versiones modelos.

---

## model_predictions

Predicciones.

---

## loan_limits

Límites clientes.

---

## limit_history

Cambios límites.

---

## manual_reviews

Revisiones humanas.

---

## decision_explanations

Explicaciones.

---

## 32 — Loan Management Platform

# 11. Modelo de Datos

---

## loan_products

Productos crédito.

---

## loans

Préstamos.

Campos:

customer_id

amount

term

rate

status

---

## loan_applications

Solicitudes.

---

## loan_terms

Condiciones.

---

## loan_disbursements

Desembolsos.

---

## repayment_schedules

Calendario cuotas.

---

## repayment_installments

Cuotas individuales.

---

## interest_calculations

Cálculos intereses.

---

## late_fees

Cargos mora.

---

## loan_events

Historial eventos.

---

## loan_adjustments

Ajustes.

---

## restructurings

Refinanciaciones.

---

## payoff_records

Liquidaciones.

---

## 33 — Collection & Recovery Platform

# 9. Modelo de Datos

---

## collection_cases

Casos cobranza.

---

## collection_strategies

Estrategias.

---

## collection_actions

Acciones realizadas.

---

## collection_contacts

Contactos.

---

## promise_to_pay

Promesas pago.

---

## payment_plans

Planes negociación.

---

## collection_agents

Agentes.

---

## agent_assignments

Asignación cartera.

---

## collection_notes

Notas.

---

## recovery_events

Eventos recuperación.

---

## delinquency_snapshots

Fotografías mora.

---

## 34 — Accounting & Financial Ledger Platform

# 9. Modelo de Datos

---

## accounts

Plan cuentas.

---

## accounting_periods

Periodos contables.

---

## journal_entries

Cabecera asientos.

---

## journal_lines

Detalle movimientos.

---

## financial_transactions

Transacciones financieras.

---

## transaction_types

Tipos.

---

## ledger_balances

Saldos calculados.

---

## bank_accounts

Cuentas bancarias.

---

## bank_transactions

Movimientos banco.

---

## reconciliations

Conciliaciones.

---

## reconciliation_items

Detalle diferencias.

---

## 35 — Payment Platform Bolivia

# 10. Modelo de Datos

---

## payment_orders

Órdenes pago.

---

## payment_transactions

Pagos realizados.

---

## payment_methods

Métodos.

Ejemplo:

QR

Transferencia

---

## payment_providers

Proveedores.

---

## provider_transactions

Respuesta proveedor.

---

## qr_codes

Códigos generados.

---

## qr_payments

Pagos QR.

---

## payment_webhooks

Eventos externos.

---

## refunds

Devoluciones.

---

## bank_accounts

Cuentas destino.

---

## bank_movements

Movimientos bancarios.

---

## reconciliation_runs

Procesos conciliación.

---

## reconciliation_results

Resultados.

---

## 36 — Notification & Communication Platform

# 10. Modelo de Datos

---

## communication_channels

Canales disponibles.

---

## notification_templates

Plantillas.

---

## template_versions

Versiones.

---

## notifications

Notificaciones creadas.

---

## notification_deliveries

Entregas.

---

## communication_preferences

Preferencias cliente.

---

## conversations

Conversaciones.

---

## conversation_messages

Mensajes.

---

## automation_rules

Reglas automáticas.

---

## automation_executions

Ejecuciones.

---

## provider_logs

Logs proveedores.

---

## 37 — Identity & KYC Platform

# 10. Modelo de Datos

---

## identities

Identidades principales.

---

## identity_documents

Documentos.

---

## document_verifications

Resultados validación.

---

## ocr_results

Resultados OCR.

---

## biometric_checks

Pruebas biométricas.

---

## facial_matches

Comparaciones faciales.

---

## authentication_methods

Métodos login.

---

## otp_requests

Solicitudes OTP.

---

## user_devices

Dispositivos.

---

## kyc_cases

Casos KYC.

---

## kyc_decisions

Decisiones.

---

## identity_risk_flags

Alertas identidad.

---

## consent_records

Consentimientos.

---

## 38 — Partner & Ecosystem Platform

*(Archivo vacío — no contiene sección Modelo de Datos)*

---

## 39 — Data Analytics & Business Intelligence Platform

# 9. Modelo de Datos

---

## data_sources

Fuentes datos.

---

## pipelines

Procesos ETL.

---

## pipeline_runs

Ejecuciones.

---

## warehouse_tables

Tablas analíticas.

---

## metrics_definitions

Definición métricas.

---

## dashboards

Paneles.

---

## dashboard_widgets

Componentes.

---

## ml_features

Variables modelos.

---

## ml_datasets

Datasets entrenamiento.

---

## 40 — Security Architecture Platform

# 12. Modelo de Datos

---

## users

Usuarios sistema.

---

## roles

Roles.

---

## permissions

Permisos.

---

## user_roles

Asignaciones.

---

## sessions

Sesiones activas.

---

## mfa_devices

Dispositivos MFA.

---

## api_keys

Claves API.

---

## audit_logs

Auditoría.

---

## security_events

Eventos seguridad.

---

## encryption_keys

Metadatos claves.

---

## access_policies

Políticas acceso.

---

## 41 — Compliance & Regulatory Platform Bolivia

# 10. Modelo de Datos

---

## compliance_profiles

Perfil cumplimiento cliente.

---

## risk_categories

Categorías riesgo.

---

## compliance_alerts

Alertas.

---

## alert_rules

Reglas detección.

---

## transaction_monitoring

Monitoreo operaciones.

---

## suspicious_cases

Casos sospechosos.

---

## regulatory_reports

Reportes.

---

## report_executions

Ejecuciones.

---

## audit_cases

Auditorías.

---

## audit_findings

Hallazgos.

---

## evidence_files

Evidencias.

---

## data_policies

Políticas datos.

---

## 42 — DevOps & Cloud Infrastructure Platform

# 11. Modelo de Datos

Este módulo no requiere muchas tablas de negocio.

---

## deployments

Historial despliegues.

---

## services

Servicios registrados.

---

## environments

Ambientes.

---

## infrastructure_resources

Recursos cloud.

---

## backup_jobs

Backups.

---

## monitoring_alerts

Alertas.

---

## incident_records

Incidentes.

---

## 43 — Mobile Application Platform

# 12. Modelo de Datos

---

## mobile_devices

Dispositivos registrados.

---

## push_tokens

Tokens notificaciones.

---

## app_sessions

Sesiones móviles.

---

## device_security_checks

Validaciones seguridad.

---

## mobile_sync_queue

Cola sincronización offline.

---

## agent_locations

Ubicaciones agentes.

---

## field_visits

Visitas realizadas.

---

## visit_evidences

Evidencias.

---

## 44 — Customer Portal Platform

# 11. Modelo de Datos

---

## customer_portal_users

Usuarios portal.

---

## customer_sessions

Sesiones activas.

---

## customer_preferences

Preferencias cliente.

---

## customer_documents

Documentos visibles.

---

## document_access_logs

Accesos documentos.

---

## loan_simulations

Simulaciones realizadas.

---

## portal_actions

Acciones cliente.

---

## 45 — Admin Backoffice Platform

# 12. Modelo de Datos

---

## admin_users

Usuarios internos.

---

## admin_roles

Roles administrativos.

---

## admin_permissions

Permisos.

---

## admin_sessions

Sesiones.

---

## approval_workflows

Flujos aprobación.

---

## approval_tasks

Tareas revisión.

---

## admin_notes

Notas internas.

---

## customer_assignments

Asignaciones agentes.

---

## system_configurations

Configuraciones generales.

---

## 46 — Product Configuration Engine

# 10. Modelo de Datos

---

## loan_products

Productos crédito.

---

## product_versions

Versiones producto.

---

## product_rules

Reglas.

---

## rule_conditions

Condiciones.

---

## pricing_models

Modelos cálculo.

---

## interest_rates

Tasas.

---

## fee_definitions

Comisiones.

---

## loan_limits

Límites.

---

## eligibility_criteria

Criterios elegibilidad.

---

## product_channels

Canales disponibles.

---

## 47 — Customer Experience Platform

*(Archivo vacío — no contiene sección Modelo de Datos)*

---

## 48 — Fraud Detection Platform

# 10. Modelo de Datos

---

## fraud_cases

Casos fraude.

---

## fraud_scores

Puntuaciones.

---

## fraud_rules

Reglas.

---

## fraud_signals

Señales detectadas.

---

## device_fingerprints

Huella dispositivo.

---

## suspicious_devices

Dispositivos riesgosos.

---

## fraud_reviews

Revisiones manuales.

---

## fraud_actions

Acciones tomadas.

---

## blacklist_entries

Lista negra.

---

## fraud_models

Modelos ML.

---

## 49 — Legal Documents & Contract Management Platform

# 10. Modelo de Datos

---

## document_templates

Plantillas documentos.

---

## template_versions

Versiones plantilla.

---

## generated_documents

Documentos generados.

---

## document_instances

Documentos asociados operación.

---

## document_acceptances

Aceptaciones cliente.

---

## electronic_signatures

Firmas.

---

## signature_events

Eventos firma.

---

## document_access_logs

Accesos documentos.

---

## legal_clauses

Cláusulas legales.

---

## evidence_records

Evidencias.
