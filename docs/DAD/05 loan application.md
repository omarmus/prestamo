# Data Architecture Document (DAD)

# Parte V

# Loan Application & Digital Onboarding

Versión 1.0

---

# Tabla de Contenido

1. Objetivo
2. Responsabilidades
3. Aggregate Root
4. Flujo de Negocio
5. Estados
6. Entidades
7. Relaciones
8. Eventos
9. Modelo de Datos
10. Reglas de Negocio

---

# 1. Objetivo

Este dominio administra el proceso completo de solicitud de un préstamo.

No administra el préstamo.

Administra el proceso previo.

Su objetivo es transformar un Customer en un Loan aprobado.

---

# 2. Responsabilidades

• Inicio de solicitud

• Formularios

• Captura de información

• Carga documental

• Validaciones

• Checklist

• Evaluación automática

• Asignación de analistas

• Aprobación

• Rechazo

• Historial

• Timeline

---

# 3. Aggregate Root

LoanApplication

---

# 4. Flujo General

```

Lead

↓

Customer

↓

Loan Application

↓

Información

↓

Documentos

↓

Precalificación IA

↓

Analista

↓

Comité (opcional)

↓

Aprobación

↓

Loan

```

---

# 5. Estados

## LoanApplicationStatus

```

DRAFT

STARTED

IN_PROGRESS

WAITING_DOCUMENTS

UNDER_AUTOMATIC_REVIEW

UNDER_MANUAL_REVIEW

WAITING_APPROVAL

APPROVED

REJECTED

CANCELLED

EXPIRED

CONVERTED

```

---

## ApplicationPriority

```

LOW

NORMAL

HIGH

URGENT

```

---

## ApplicationDecision

```

APPROVED

REJECTED

MORE_INFORMATION

ESCALATED

```

---

# 6. Entidades

LoanApplication

ApplicationAnswers

ApplicationDocuments

ApplicationChecklist

ApplicationAssignments

ApplicationTimeline

ApplicationComments

ApplicationDecision

ApplicationHistory

ApplicationRules

ApplicationScoring

---

# 7. Relaciones

```

LoanApplication

│

├── Answers

├── Documents

├── Checklist

├── Timeline

├── Comments

├── Rules

├── Score

├── Assignments

├── Decision

└── History

```

---

# 8. Eventos

```

ApplicationCreated

ApplicationStarted

ApplicationUpdated

DocumentsRequested

DocumentsReceived

AutomaticReviewCompleted

AssignedToAnalyst

ManualReviewCompleted

ApplicationApproved

ApplicationRejected

ApplicationCancelled

LoanGenerated

```

---

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

# 10. Reglas

Una solicitud pertenece únicamente a un Customer.

Un Customer puede tener varias solicitudes históricas.

Solo una solicitud puede estar activa para un mismo producto (esta regla puede parametrizarse).

Toda solicitud debe registrar el producto solicitado.

No es posible aprobar una solicitud con documentos obligatorios pendientes.

Toda decisión debe quedar registrada.

Toda transición de estado debe registrarse en el historial.

Una solicitud aprobada genera exactamente un Loan.

---

# Métricas

• Solicitudes iniciadas

• Solicitudes abandonadas

• Tiempo promedio de llenado

• Tiempo promedio de evaluación

• Tiempo promedio de aprobación

• % de aprobación

• % de rechazo

• Motivos de rechazo

• Monto promedio solicitado

• Monto promedio aprobado

---

# Tablas Totales

1. loan_applications
2. application_answers
3. application_documents
4. application_checklists
5. application_assignments
6. application_comments
7. application_scoring
8. application_rules
9. application_decisions
10. application_history
11. application_timeline

Total: 11 tablas

---

# Próximo Documento

**DAD-06 — Document Management & KYC Verification**

Este dominio administrará todos los documentos del sistema, incluyendo:

- Documento de identidad
- Selfie
- Prueba de vida (Liveness)
- OCR
- Verificación biométrica
- Comprobantes de ingresos
- Extractos bancarios
- Croquis de domicilio
- Contratos
- Versionado documental
- Firmas electrónicas
- Validaciones automáticas
- Integración con proveedores KYC

Será uno de los módulos más críticos para la seguridad y el cumplimiento regulatorio.