# Data Architecture Document (DAD)

# Parte XX

# Observability Platform

Versión 1.0

---

# Tabla de Contenido

1. Objetivo
2. Principios
3. Arquitectura
4. Capas de Observabilidad
5. Logs
6. Métricas
7. Tracing
8. Alertas
9. SLO / SLA
10. Monitoreo Financiero
11. Monitoreo IA
12. Modelo de Datos
13. Reglas
14. KPIs

---

# 1. Objetivo

Crear una plataforma centralizada para observar el estado técnico y operativo de la fintech.

Debe responder:

- ¿Qué está fallando?
- ¿Dónde ocurrió?
- ¿Cuándo ocurrió?
- ¿A quién afectó?
- ¿Cuánto dinero impactó?
- ¿Cuál fue la causa?

---

# 2. Principios

## Everything is observable

Todo servicio debe generar:

- Logs
- Métricas
- Eventos
- Trazas

---

## Correlation ID

Toda operación tendrá un identificador único.

Ejemplo:

```
Cliente solicita préstamo

request_id:

8f93ab22

```

Ese ID debe viajar por:

```
Landing

↓

API Gateway

↓

Loan Service

↓

AI

↓

Workflow

↓

Ledger

↓

WhatsApp

```

---

# 3. Arquitectura

```

Aplicaciones

↓

OpenTelemetry Collector

↓

Observability Platform

        |
        |
 ┌──────┼───────┐

 ▼      ▼       ▼

Logs Metrics Traces

 ▼      ▼       ▼

Loki  Prometheus Tempo

        |
        ▼

Grafana

        |
        ▼

Alert Manager

```

---

# 4. Capas

## Infraestructura

Monitorea:

- CPU
- RAM
- Disco
- Red
- Kubernetes
- Containers

---

## Aplicación

Monitorea:

- Errores
- Latencia
- Excepciones
- Requests

---

## Negocio

Monitorea:

- préstamos
- pagos
- desembolsos
- cobranza

---

## IA

Monitorea:

- tokens
- costo
- latencia
- errores
- calidad

---

## Seguridad

Monitorea:

- accesos
- intentos fallidos
- ataques
- anomalías

---

# 5. Logging Platform

Todos los servicios generan logs estructurados JSON.

Ejemplo:

```
{
 service:
 "loan-service",

 event:
 "loan.approved",

 customer_id:
 "12345",

 loan_id:
 "98765",

 timestamp:
 "2026-01-01"
}

```

---

# Tipos de Logs

## Application Logs

Errores del sistema.

---

## Audit Logs

Acciones humanas.

Ejemplo:

Administrador cambió tasa.

---

## Financial Logs

Movimientos monetarios.

Ejemplo:

Desembolso realizado.

---

## Security Logs

Accesos.

---

## AI Logs

Interacciones con modelos.

---

# 6. Métricas

## Técnicas

CPU

Memoria

Requests

Errores

Latencia

---

## Negocio

Préstamos creados

Préstamos aprobados

Monto desembolsado

Pagos realizados

Mora

---

## Financieras

Cartera activa

Capital pendiente

Ingresos

Pérdidas

---

## IA

Tokens

Costo

Tiempo respuesta

Modelo utilizado

---

# 7. Distributed Tracing

Permite seguir una operación completa.

Ejemplo:

Solicitud préstamo:

```

Frontend

200ms

↓

API Gateway

20ms

↓

Loan Service

100ms

↓

AI Score

900ms

↓

Workflow

300ms

↓

Notification

200ms

```

Total:

1.7 segundos

---

# 8. Alertas

## Críticas

Ejemplo:

```
Ledger detenido

↓

ALERTA CRÍTICA

```

---

## Financieras

Ejemplo:

```
100 pagos recibidos

pero

0 actualizados en ledger

```

---

## Seguridad

Ejemplo:

```
100 intentos login

desde misma IP

```

---

# 9. SLO / SLA

## Disponibilidad

Ejemplo:

99.9%

---

## API

Tiempo respuesta:

<500ms

---

## WhatsApp

Respuesta bot:

<3 segundos

---

## Pagos

Procesamiento:

<30 segundos

---

# 10. Monitoreo Financiero

Dashboards:

## Pagos

- pagos recibidos
- pagos pendientes
- pagos fallidos

---

## Préstamos

- solicitudes
- aprobaciones
- rechazos

---

## Cobranza

- contactos
- promesas
- recuperación

---

## Ledger

- diferencias contables
- asientos pendientes

---

# 11. Monitoreo IA

Dashboard:

Modelo utilizado

Tokens consumidos

Costo diario

Costo mensual

Errores

Fallback

Tiempo respuesta

---

Ejemplo:

```
Claude

5000 solicitudes

Costo:

$35

```

```
DeepSeek

50000 solicitudes

Costo:

$8

```

---

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

# 13. Reglas

Todo servicio debe tener métricas.

Toda operación financiera debe tener trazabilidad.

Toda alerta crítica debe generar incidente.

Los logs deben tener retención configurable.

Nunca almacenar información sensible sin protección.

---

# 14. KPIs

## Técnicos

Disponibilidad

Error rate

Latencia

Throughput

---

## Financieros

Pagos procesados

Errores financieros

Tiempo conciliación

---

## IA

Costo por cliente

Costo por préstamo

Costo por conversación

---

# Tecnologías recomendadas

## MVP

- OpenTelemetry
- Grafana
- Prometheus
- Loki
- Sentry


## Escala

- Kubernetes
- Tempo
- Elasticsearch
- Datadog / New Relic

---

# Tablas Totales

1 observability_events

2 logs

3 metrics

4 traces

5 alerts

6 alert_rules

7 incidents

8 incident_history

9 uptime_checks

10 performance_samples

11 ai_observability

12 business_metrics


Total:

12 tablas

---

# Próximo Documento

DAD-21

Security Platform

Incluye:

- IAM
- OAuth2/OIDC
- MFA
- cifrado
- gestión secretos
- protección datos
- auditoría
- cumplimiento fintech