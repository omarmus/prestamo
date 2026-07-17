# Data Architecture Document (DAD)

# Parte VII

# Credit Decision Engine

Versión 1.0

---

# Tabla de Contenido

1. Objetivo
2. Arquitectura
3. Motores de Evaluación
4. Flujo de Evaluación
5. Aggregate Root
6. Entidades
7. Estados
8. Eventos
9. Modelo de Datos
10. Reglas de Negocio

---

# 1. Objetivo

Este dominio determina si una solicitud puede convertirse en un préstamo.

No desembolsa dinero.

No genera contratos.

Su responsabilidad es analizar el riesgo.

El sistema debe ser completamente parametrizable.

---

# 2. Arquitectura

El Decision Engine está compuesto por cuatro motores independientes.

```

Loan Application

↓

Rule Engine

↓

Risk Engine

↓

Fraud Engine

↓

AI Recommendation Engine

↓

Final Decision

```

Cada motor produce un resultado independiente.

La decisión final puede utilizar todos ellos.

---

# 3. Motores

## Rule Engine

Reglas parametrizables.

Ejemplos

Edad

Ingresos mínimos

Documento válido

Ciudad permitida

Monto máximo

Cantidad de préstamos

---

## Risk Engine

Calcula riesgo financiero.

Variables

Endeudamiento

Ingresos

Antigüedad laboral

Historial

Capacidad de pago

---

## Fraud Engine

Detecta fraude.

Documento duplicado

Selfie sospechosa

Múltiples dispositivos

Múltiples teléfonos

Múltiples cuentas

Patrones anómalos

---

## AI Recommendation Engine

No toma la decisión.

Solo recomienda.

Ejemplo

```

Score IA

91.4

Recomendación

APPROVE

Confianza

97%

Explicación

Ingresos estables.

Buen historial.

Documentos válidos.

```

---

# 4. Flujo

```

Solicitud

↓

Validación documental

↓

Rule Engine

↓

Risk Engine

↓

Fraud Engine

↓

IA

↓

Resultado Final

↓

Loan

```

---

# 5. Aggregate Root

Evaluation

---

# 6. Entidades

Evaluation

EvaluationRules

RuleExecutions

RiskEvaluations

FraudEvaluations

AIScores

EvaluationResults

DecisionReasons

EvaluationHistory

EvaluationVariables

---

# 7. Estados

EvaluationStatus

```

PENDING

RUNNING

WAITING_ANALYST

APPROVED

REJECTED

ERROR

```

---

RuleResult

```

PASSED

FAILED

WARNING

SKIPPED

```

---

Recommendation

```

APPROVE

REJECT

MANUAL_REVIEW

ESCALATE

```

---

# 8. Eventos

```

EvaluationStarted

RulesExecuted

RiskCalculated

FraudDetected

AICompleted

EvaluationApproved

EvaluationRejected

EvaluationEscalated

```

---

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

# 10. Reglas

La IA nunca aprueba préstamos por sí sola.

Siempre entrega una recomendación.

La decisión final puede ser:

Automática

o

Manual.

Todas las reglas ejecutadas deben almacenarse.

Toda evaluación debe poder reproducirse meses después.

Nunca sobrescribir resultados.

Siempre crear nuevas evaluaciones.

---

# Explainable AI

Toda recomendación de IA deberá guardar:

Modelo

Versión

Prompt

Tokens

Costo

Respuesta

Explicación

Tiempo

Esto permitirá auditorías futuras.

---

# KPIs

Tiempo promedio de evaluación

% Aprobación

% Rechazo

Score promedio

Fraudes detectados

Costo IA

Costo por evaluación

Evaluaciones manuales

Precisión IA

---

# Tablas Totales

1 evaluations

2 evaluation_rules

3 rule_executions

4 evaluation_variables

5 risk_evaluations

6 fraud_evaluations

7 ai_models

8 ai_evaluations

9 evaluation_results

10 decision_reasons

11 evaluation_history

Total

11 tablas

---

# Próximo Documento

DAD-08

Loan Core

En este documento construiremos el núcleo financiero del sistema:

• Productos

• Préstamos

• Desembolsos

• Contratos

• Calendario de pagos

• Intereses

• Mora

• Refinanciaciones

• Reestructuraciones

• Cancelaciones

• Estado de cuenta

Este será el dominio más grande y crítico de toda la plataforma.