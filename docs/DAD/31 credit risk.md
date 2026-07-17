# Data Architecture Document (DAD)

# Parte XXXI

# Credit Risk & Scoring Platform

Versión 1.0

---

# Tabla de Contenido

1. Objetivo
2. Arquitectura
3. Credit Decision Engine
4. Rules Engine
5. Risk Scoring
6. Machine Learning
7. AI Explainability
8. Loan Limits
9. Modelo de Datos
10. Eventos
11. KPIs

---

# 1. Objetivo

Crear un sistema inteligente para evaluar riesgo crediticio y tomar decisiones automatizadas.

---

# 2. Arquitectura

```

Loan Application

        │

        ▼

Credit Engine

        │

 ┌──────┼──────┐

 ▼      ▼      ▼

Rules  ML    AI


        │

        ▼

Decision


```

---

# 3. Credit Decision Engine

Responsable de decidir.

Resultado:

```

APPROVED

MANUAL_REVIEW

REJECTED


```

---

# Entrada

Datos:

Cliente

KYC

Ingresos

Historial

Comportamiento

Solicitud

---

# Salida

Decision:

Monto aprobado

Plazo

Tasa

Nivel riesgo

---

# 4. Rules Engine

Motor de reglas empresariales.

---

Ejemplos:

---

## Regla edad

```
edad >= 18

```

---

## Regla documento

```
KYC aprobado

```

---

## Regla mora

```
Mora actual = 0

```

---

## Regla capacidad pago

```
Cuota <= 40% ingreso

```

---

# Reglas versionadas

Importante:

Nunca modificar una regla usada.

Crear versión nueva.

Ejemplo:

```

Rule v1

Ingreso mínimo Bs2000


Rule v2

Ingreso mínimo Bs2500

```

---

# 5. Risk Scoring

Genera puntuación.

Ejemplo:

```

Score:

850


Riesgo:

Bajo


```

---

# Factores:

---

## Identidad

KYC.

---

## Financiero

Ingresos.

Gastos.

---

## Comportamiento

Pagos anteriores.

---

## Digital

Dispositivo.

Ubicación.

---

## Social

Referencias.

---

# Score ejemplo

```

Identidad       20%

Ingresos        30%

Historial       30%

Comportamiento 20%


```

---

# 6. Machine Learning

Futuro.

Modelos:

---

# Default Prediction

Predice probabilidad impago.

---

# Fraud Prediction

Detecta fraude.

---

# Limit Optimization

Calcula monto ideal.

---

# Model Pipeline

```

Datos históricos

↓

Feature Engineering

↓

Training

↓

Validation

↓

Deployment

↓

Monitoring


```

---

# Modelos posibles

Inicial:

Reglas.

---

Después:

Logistic Regression

Random Forest

XGBoost

Neural Networks

---

# 7. AI Explainability

Importante.

No solo decir:

"Rechazado".

Explicar:

```

Motivos:

- poca antigüedad laboral
- alto nivel deuda
- historial insuficiente


```

---

Tecnologías:

SHAP

LIME

Feature Importance

---

# 8. Loan Limits

No todos reciben igual monto.

---

Ejemplo:

Cliente nuevo:

```
Máximo:

Bs3000

```

---

Cliente recurrente:

```
Máximo:

Bs20000

```

---

Incremento automático:

Después de buen comportamiento.

---

# 9. Modelo de Datos

---

# credit_applications

Solicitudes evaluación.

---

# credit_decisions

Decisiones finales.

---

# credit_rules

Reglas.

---

# rule_versions

Versiones.

---

# risk_scores

Scores generados.

---

# scoring_factors

Factores utilizados.

---

# credit_models

Modelos ML.

---

# model_versions

Versiones modelos.

---

# model_predictions

Predicciones.

---

# loan_limits

Límites clientes.

---

# limit_history

Cambios límites.

---

# manual_reviews

Revisiones humanas.

---

# decision_explanations

Explicaciones.

---

# Modelo Total

1 credit_applications

2 credit_decisions

3 credit_rules

4 rule_versions

5 risk_scores

6 scoring_factors

7 credit_models

8 model_versions

9 model_predictions

10 loan_limits

11 limit_history

12 manual_reviews

13 decision_explanations


Total:

13 tablas

---

# 10. Eventos

CreditApplicationCreated

ScoreCalculated

RiskEvaluated

CreditApproved

CreditRejected

ManualReviewCreated

LimitChanged

---

# 11. KPIs

Aprobaciones.

Rechazos.

Mora.

Default rate.

Tiempo decisión.

Precisión modelo.

---

# Tecnologías

## MVP

NestJS

PostgreSQL

Rules Engine propio

Python ML separado


## Escala

Python

FastAPI

MLflow

Feature Store

Airflow


---

# Próximo Documento

DAD-32

Loan Management Platform

Incluye:

- ciclo completo préstamo;
- desembolso;
- cuotas;
- intereses;
- mora;
- refinanciamiento;
- cierre.