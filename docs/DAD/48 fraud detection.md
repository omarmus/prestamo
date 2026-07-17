# Data Architecture Document (DAD)

# Parte XLVIII

# Fraud Detection Platform

Versión 1.0

---

# Tabla de Contenido

1. Objetivo
2. Arquitectura
3. Tipos de Fraude
4. Fraud Detection Engine
5. Device Intelligence
6. Behavioral Analysis
7. Fraud Scoring
8. Rules Engine
9. Machine Learning Futuro
10. Modelo de Datos
11. Eventos
12. KPIs

---

# 1. Objetivo

Crear una plataforma capaz de identificar, prevenir y gestionar actividades fraudulentas dentro del ecosistema fintech.

---

# 2. Arquitectura

```

Customer Actions


        │


        ▼


Fraud Detection Platform


        │


 ┌──────┼────────┐


 ▼      ▼        ▼


Rules  Signals  ML Models


        │


        ▼


Risk Decision


        │


 ┌──────┼──────┐


 ▼      ▼      ▼


Approve Review Reject


```

---

# 3. Tipos de Fraude

---

# Identity Fraud

Uso de identidad falsa.

Ejemplos:

- documentos falsos;
- suplantación.

---

# Account Fraud

Creación múltiples cuentas.

Ejemplo:

Un usuario crea 10 perfiles.

---

# Loan Fraud

Solicitud con información falsa.

---

# Payment Fraud

Pagos fraudulentos.

---

# Internal Fraud

Abuso por empleados.

---

# 4. Fraud Detection Engine

Motor central de evaluación.

Entrada:

```

Cliente

+

Solicitud

+

Dispositivo

+

Historial

+

Comportamiento


```

Salida:

```

Fraud Score

0 - 100


```

---

# Ejemplo:

```

Fraud Score:

15


Resultado:

Aprobación automática


```

---

```

Fraud Score:

85


Resultado:

Revisión manual


```

---

# 5. Device Intelligence

Analizar dispositivo.

Datos:

- modelo;
- sistema operativo;
- IP;
- navegador;
- ubicación aproximada;
- comportamiento.

---

Detectar:

```

Mismo dispositivo

↓

Muchas identidades


```

---

# 6. Behavioral Analysis

Analiza comportamiento.

Ejemplos:

---

Usuario normal:

```

Lee información

Completa formulario

Envía solicitud


```

---

Bot:

```

Completa campos en segundos

Múltiples intentos

Patrón repetitivo


```

---

# 7. Fraud Scoring

Variables:

---

Identidad:

- KYC aprobado;
- coincidencia facial.

---

Comportamiento:

- velocidad;
- intentos.

---

Historial:

- pagos;
- mora.

---

Dispositivo:

- riesgo.

---

# 8. Rules Engine

Reglas iniciales:

---

Regla:

Misma CI en múltiples cuentas.

Acción:

Bloquear.

---

Regla:

Muchos intentos desde IP.

Acción:

Revisión.

---

Regla:

Cambio teléfono frecuente.

Acción:

Alerta.

---

# 9. Machine Learning Futuro

Cuando exista suficiente información:

Modelos:

---

Fraud Classification.

---

Anomaly Detection.

---

Graph Fraud Detection.

---

Variables:

- comportamiento;
- relaciones;
- dispositivos;
- pagos.

---

# 10. Modelo de Datos

---

# fraud_cases

Casos fraude.

---

# fraud_scores

Puntuaciones.

---

# fraud_rules

Reglas.

---

# fraud_signals

Señales detectadas.

---

# device_fingerprints

Huella dispositivo.

---

# suspicious_devices

Dispositivos riesgosos.

---

# fraud_reviews

Revisiones manuales.

---

# fraud_actions

Acciones tomadas.

---

# blacklist_entries

Lista negra.

---

# fraud_models

Modelos ML.

---

# Modelo Total

1. fraud_cases

2. fraud_scores

3. fraud_rules

4. fraud_signals

5. device_fingerprints

6. suspicious_devices

7. fraud_reviews

8. fraud_actions

9. blacklist_entries

10. fraud_models


Total:

10 tablas

---

# 11. Eventos

FraudCheckStarted

RiskSignalDetected

FraudScoreCalculated

FraudCaseCreated

FraudReviewCompleted

DeviceBlocked

---

# 12. KPIs

Fraudes detectados.

Pérdida evitada.

Falsos positivos.

Tiempo detección.

Casos revisados.

---

# Tecnologías recomendadas

## MVP

Rules Engine.

Device fingerprint.

KYC validation.

Audit logs.


---

## Escala

Machine Learning.

Graph Database.

Real-time scoring.


---

# Stack sugerido

Backend:

NestJS


Procesamiento:

Python ML Service


Datos:

PostgreSQL

Redis


Eventos:

RabbitMQ / Kafka


---

# Próximo Documento

DAD-49

Legal Documents & Contract Management Platform

Incluye:

- contratos digitales;
- pagarés;
- firma electrónica;
- generación documentos;
- versiones legales;
- evidencias;
- aceptación digital.