# Data Architecture Document (DAD)

# Parte XXXIX

# Data Analytics & Business Intelligence Platform

Versión 1.0

---

# Tabla de Contenido

1. Objetivo
2. Arquitectura Data
3. Data Warehouse
4. ETL Pipeline
5. Data Models
6. Dashboards
7. Business Metrics
8. Machine Learning Data
9. Modelo de Datos
10. Eventos
11. KPIs

---

# 1. Objetivo

Crear una plataforma analítica para medir, optimizar y predecir el comportamiento financiero.

---

# 2. Arquitectura Data

```

Applications

      │

      ▼

Operational Database


      │


      ▼


Data Pipeline


      │


      ▼


Data Warehouse


      │


      ▼


BI Platform


```

---

# 3. Data Warehouse

Almacena datos históricos.

---

Ejemplos:

5 años de préstamos.

Historial pagos.

Comportamiento clientes.

---

Tecnologías:

MVP:

PostgreSQL separado.

---

Escala:

BigQuery

Snowflake

Redshift

ClickHouse

---

# 4. ETL Pipeline

Procesos:

---

Extract

Extraer datos.

---

Transform

Limpiar.

---

Load

Guardar analítica.

---

Ejemplo:

Cada noche:

```

Loans

↓

Transform

↓

Warehouse


```

---

# 5. Data Models

Modelo estrella.

---

## Fact Tables

Eventos medibles.

---

fact_loans

Préstamos.

---

fact_payments

Pagos.

---

fact_collections

Cobranza.

---

fact_customers

Clientes.

---

## Dimension Tables

Contexto.

---

dim_customer

Cliente.

---

dim_date

Fecha.

---

dim_product

Producto.

---

dim_channel

Canal.

---

# 6. Dashboards

---

# Dirección

Métricas:

- cartera total;
- ingresos;
- mora;
- crecimiento.

---

# Riesgo

Métricas:

- default;
- score;
- aprobación.

---

# Marketing

Métricas:

- CAC;
- conversiones;
- campañas.

---

# Cobranza

Métricas:

- recuperación;
- aging;
- productividad.

---

# Operaciones

Métricas:

- tiempo aprobación;
- KYC;
- soporte.

---

# 7. Business Metrics

---

# Growth

Usuarios nuevos.

Conversión.

CAC.

---

# Credit

Loan Originations.

Approval Rate.

Average Loan Size.

---

# Risk

Default Rate.

PAR30.

PAR60.

---

# Finance

Revenue.

Interest Income.

Profit.

---

# Customer

Retention.

Repeat Borrowers.

LTV.

---

# 8. Machine Learning Data

Preparar datos para:

---

Credit Scoring.

---

Fraud Detection.

---

Collections Prediction.

---

Customer Segmentation.

---

# Feature Store

Guardar variables:

Ejemplo:

```

payment_delay_avg

loan_count

income_level

device_score


```

---

# 9. Modelo de Datos

---

# data_sources

Fuentes datos.

---

# pipelines

Procesos ETL.

---

# pipeline_runs

Ejecuciones.

---

# warehouse_tables

Tablas analíticas.

---

# metrics_definitions

Definición métricas.

---

# dashboards

Paneles.

---

# dashboard_widgets

Componentes.

---

# ml_features

Variables modelos.

---

# ml_datasets

Datasets entrenamiento.

---

# Modelo Total

1 data_sources

2 pipelines

3 pipeline_runs

4 warehouse_tables

5 metrics_definitions

6 dashboards

7 dashboard_widgets

8 ml_features

9 ml_datasets


Total:

9 tablas

---

# 10. Eventos

DataPipelineStarted

DataPipelineCompleted

MetricCalculated

DashboardUpdated

DatasetCreated

---

# 11. KPIs

Data freshness.

Pipeline success.

Dashboard usage.

Model accuracy.

---

# Tecnologías

## MVP

PostgreSQL

Metabase

Apache Superset

Airbyte


## Escala

dbt

Spark

Airflow

BigQuery

MLflow


---

# Próximo Documento

DAD-40

Security Architecture Platform

Incluye:

- ciberseguridad;
- IAM;
- cifrado;
- secretos;
- auditoría;
- protección datos;
- OWASP;
- monitoreo.