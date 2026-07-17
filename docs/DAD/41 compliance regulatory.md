# Data Architecture Document (DAD)

# Parte XLI

# Compliance & Regulatory Platform Bolivia

Versión 1.0

---

# Tabla de Contenido

1. Objetivo
2. Arquitectura Compliance
3. KYC/AML
4. Risk Monitoring
5. Transaction Monitoring
6. Regulatory Reports
7. Data Governance
8. Audit Management
9. Modelo de Datos
10. Eventos
11. KPIs

---

# 1. Objetivo

Crear una plataforma para gestionar cumplimiento legal, riesgo operativo y trazabilidad financiera.

---

# 2. Arquitectura Compliance

```

Operational Systems

        │

        ▼

Compliance Engine

        │

 ┌──────┼──────┐

 ▼      ▼      ▼


KYC    AML   Audit


        │


        ▼


Compliance Dashboard


```

---

# 3. KYC / AML

KYC:

Know Your Customer.

Objetivo:

Conocer quién es el cliente.

---

Datos:

- identidad;
- documento;
- actividad económica;
- ingresos;
- residencia.

---

AML:

Anti Money Laundering.

Prevención lavado de dinero.

---

# 4. Customer Risk Profile

Cada cliente tendrá un nivel:

```

LOW

MEDIUM

HIGH


```

---

Factores:

- monto solicitado;
- frecuencia operaciones;
- comportamiento;
- inconsistencias;
- ubicación;
- señales fraude.

---

# 5. Transaction Monitoring

Analiza movimientos.

---

Ejemplos:

## Patrón sospechoso

Cliente solicita:

10 préstamos pequeños en una semana.

---

## Operaciones inusuales

Pago desde múltiples cuentas.

---

## Múltiples identidades

Mismo dispositivo.

---

# 6. Rules Engine Compliance

Ejemplos:

---

Regla:

```

Monto > límite establecido

↓

Revisión manual


```

---

Regla:

```

Muchas solicitudes mismo día

↓

Alerta fraude


```

---

Regla:

```

Datos inconsistentes

↓

Bloquear


```

---

# 7. Regulatory Reports

Debe permitir generar reportes.

---

Ejemplos:

- cartera;
- clientes;
- operaciones;
- auditoría.

---

Formato:

- PDF;
- Excel;
- API futura.

---

# 8. Data Governance

Control sobre datos.

---

Define:

## Data Owner

Responsable.

---

## Data Classification

Nivel sensibilidad.

---

## Retention Policy

Tiempo conservación.

---

## Data Access

Quién puede ver.

---

# 9. Audit Management

Gestiona auditorías.

---

Tipos:

Interna.

Externa.

Operativa.

Seguridad.

---

Debe almacenar:

- hallazgos;
- responsables;
- evidencias;
- fechas.

---

# 10. Modelo de Datos

---

# compliance_profiles

Perfil cumplimiento cliente.

---

# risk_categories

Categorías riesgo.

---

# compliance_alerts

Alertas.

---

# alert_rules

Reglas detección.

---

# transaction_monitoring

Monitoreo operaciones.

---

# suspicious_cases

Casos sospechosos.

---

# regulatory_reports

Reportes.

---

# report_executions

Ejecuciones.

---

# audit_cases

Auditorías.

---

# audit_findings

Hallazgos.

---

# evidence_files

Evidencias.

---

# data_policies

Políticas datos.

---

# Modelo Total

1 compliance_profiles

2 risk_categories

3 compliance_alerts

4 alert_rules

5 transaction_monitoring

6 suspicious_cases

7 regulatory_reports

8 report_executions

9 audit_cases

10 audit_findings

11 evidence_files

12 data_policies


Total:

12 tablas

---

# 11. Eventos

ComplianceCheckStarted

RiskProfileUpdated

AlertCreated

CaseOpened

ReportGenerated

AuditCompleted


---

# 12. KPIs

Alertas generadas.

Alertas resueltas.

Tiempo resolución.

Clientes alto riesgo.

Auditorías pendientes.

---

# Tecnologías

## Backend

NestJS

---

## Rules Engine

Motor propio.

---

## Document Storage

S3 privado.

---

## Reporting

Metabase

Superset

---

# Próximo Documento

DAD-42

DevOps & Cloud Infrastructure Platform

Incluye:

- arquitectura cloud;
- AWS;
- Kubernetes;
- CI/CD;
- ambientes;
- backups;
- disaster recovery;
- observabilidad.