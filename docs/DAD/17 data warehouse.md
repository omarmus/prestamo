# Data Architecture Document (DAD)

# Parte XVII

# Data Warehouse & Business Intelligence Platform

Versión 1.0

---

# Objetivo

Centralizar toda la información analítica de la fintech.

No participa en la operación diaria.

Su función es responder preguntas de negocio.

---

# Arquitectura

```
Microservicios

↓

Event Bus

↓

ETL / ELT

↓

Data Lake

↓

Data Warehouse

↓

Data Marts

↓

Dashboards

↓

Machine Learning

```

---

# Aggregate Roots

Dataset

Metric

Dashboard

Report

KPI

---

# Capas

Raw Data

↓

Clean Data

↓

Business Data

↓

Analytics

↓

ML Features

---

# Data Sources

CRM

Loans

Payments

Collections

Accounting

AI

WhatsApp

Website

Marketing

Google Analytics

Meta Ads

Banco

---

# Entidades

Dataset

DatasetVersion

DataSource

ETLJob

Metric

Dimension

Fact

Dashboard

Report

KPI

MLFeature

Prediction

---

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

# Dashboards

CEO

Operaciones

Cobranza

Ventas

Marketing

Riesgo

Finanzas

Soporte

---

# KPIs CEO

Préstamos del día

Monto colocado

Mora

Ingresos

ROI

CAC

LTV

Costo IA

Fraudes

NPS

---

# Dashboard Riesgo

Score promedio

Fraudes

Incobrables

Probabilidad default

Reestructurados

---

# Dashboard Cobranza

Mora

Promesas

Recuperación

Tiempo

Ranking cobradores

---

# Dashboard IA

Costo

Latencia

Tokens

Proveedor

Modelo

Errores

Fallback

---

# Dashboard Marketing

Campañas

CTR

Conversión

WhatsApp

Costo adquisición

---

# Eventos

DatasetCreated

ETLExecuted

DashboardGenerated

PredictionCalculated

---

# Reglas

Nunca consultar producción.

Todo llega mediante eventos.

Los datasets tienen versión.

Los reportes son reproducibles.

---

# Próximo Documento

DAD-18

API Gateway & Integration Platform