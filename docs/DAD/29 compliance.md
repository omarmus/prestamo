# Data Architecture Document (DAD)

# Parte XXIX

# Compliance & Regulatory Platform Bolivia

Versión 1.0

---

# Tabla de Contenido

1. Objetivo
2. Principios regulatorios
3. Arquitectura
4. Compliance Management
5. AML / Prevención fraude
6. Audit Platform
7. Data Governance
8. Reportes regulatorios
9. Modelo de Datos
10. Eventos
11. KPIs

---

# 1. Objetivo

Gestionar controles regulatorios, evidencia legal y cumplimiento operativo.

---

# 2. Principios

---

# Traceability First

Toda acción debe poder reconstruirse.

Ejemplo:

¿Por qué se aprobó este préstamo?

Respuesta:

- usuario;
- modelo utilizado;
- reglas aplicadas;
- documentos;
- aprobador.

---

# Data Protection

Los datos personales deben:

- estar protegidos;
- tener acceso controlado;
- registrar uso.

---

# Separation of Duties

Una persona no debe controlar todo.

Ejemplo:

El analista aprueba.

Otra persona desembolsa.

---

# 3. Arquitectura

```

Business Services

       │

       ▼

Compliance Layer

       │

 ┌─────┼─────┐

 ▼     ▼     ▼

Audit AML Reports


```

---

# 4. Compliance Management

Gestiona:

- políticas;
- controles;
- revisiones;
- evidencias.

---

# Compliance Policies

Ejemplos:

Monto máximo préstamo.

Edad mínima.

Documentos obligatorios.

Límites diarios.

---

# Compliance Rules Engine

Ejemplo:

```

SI

cliente solicita > Bs50000


ENTONCES

requiere revisión manual


```

---

# 5. AML / Prevención Fraude

Aunque la fintech no sea banco tradicional, debe prevenir:

- fraude;
- identidad falsa;
- uso indebido;
- operaciones sospechosas.

---

# Fraud Indicators

Ejemplos:

## Identidad

Mismo carnet en múltiples cuentas.

---

## Dispositivo

Muchas cuentas desde mismo teléfono.

---

## Pago

Comportamiento extraño.

---

## Solicitud

Muchas solicitudes rechazadas.

---

# Fraud Score

Ejemplo:

```

Cliente:

Juan


Identidad:

95


Dispositivo:

70


Comportamiento:

80


Fraud Score:

82


```

---

# 6. Audit Platform

Debe registrar:

Quién

Qué

Cuándo

Dónde

Resultado

---

# Eventos auditables

Usuario creado.

KYC aprobado.

Préstamo aprobado.

Tasa modificada.

Pago reversado.

Documento descargado.

---

# Audit Log Inmutable

Recomendación:

Los logs críticos no deben poder modificarse.

---

Opciones:

- WORM Storage.
- Append Only Database.
- Blockchain privado opcional.

---

# 7. Data Governance

Gestiona:

---

## Clasificación datos

Público.

Interno.

Confidencial.

Crítico.

---

## Retención

Ejemplo:

Contratos:

X años.

Logs:

X años.

---

## Eliminación

Procesos controlados.

---

# 8. Reportes Regulatorios

La plataforma debe poder generar:

---

# Reportes cartera

- préstamos activos;
- mora;
- recuperación.

---

# Reportes clientes

- altas;
- bajas;
- validaciones.

---

# Reportes financieros

- desembolsos;
- pagos;
- ingresos.

---

# 9. Modelo de Datos

---

# compliance_policies

Políticas.

---

# compliance_rules

Reglas.

---

# compliance_checks

Evaluaciones.

---

# audit_logs

Auditoría general.

---

# audit_events

Eventos detallados.

---

# regulatory_reports

Reportes.

---

# report_generations

Historial generación.

---

# fraud_cases

Casos fraude.

---

# fraud_indicators

Indicadores.

---

# risk_flags

Alertas riesgo.

---

# data_classifications

Clasificación datos.

---

# retention_policies

Políticas retención.

---

# consent_records

Consentimientos usuario.

---

# Modelo Total

1 compliance_policies

2 compliance_rules

3 compliance_checks

4 audit_logs

5 audit_events

6 regulatory_reports

7 report_generations

8 fraud_cases

9 fraud_indicators

10 risk_flags

11 data_classifications

12 retention_policies

13 consent_records


Total:

13 tablas

---

# 10. Eventos

ComplianceCheckStarted

ComplianceApproved

FraudDetected

AuditCreated

ReportGenerated

PolicyChanged

ConsentGranted

---

# 11. KPIs

Casos fraude detectados.

Tiempo auditoría.

Cumplimiento políticas.

Préstamos revisados manualmente.

Incidentes regulatorios.

---

# Tecnologías

## MVP

- PostgreSQL audit tables
- Event sourcing parcial
- OpenTelemetry
- Object Storage privado


## Escala

- SIEM
- Data Lake
- Regulatory Reporting Engine

---

# Próximo Documento

DAD-30

AI Platform & Intelligent Automation

Incluye:

- arquitectura IA
- agentes
- RAG
- modelos LLM
- costos
- seguridad IA
- entrenamiento
- gobierno IA