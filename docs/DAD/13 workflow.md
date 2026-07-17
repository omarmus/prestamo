# Data Architecture Document (DAD)

# Parte XIII

# Workflow & Business Process Engine

Versión 1.0

---

# Objetivo

Administrar todos los procesos del sistema mediante workflows configurables.

No existirán flujos escritos en el código.

Todos los procesos vivirán en base de datos.

---

# Arquitectura

```

Proceso

↓

Workflow

↓

Steps

↓

Conditions

↓

Actions

↓

Events

↓

Next Step

```

---

# Aggregate Root

Workflow

---

# Casos de Uso

Solicitud de préstamo

KYC

Evaluación

Desembolso

Cobranza

Refinanciación

Soporte

Reclamos

Onboarding

Aprobación manual

---

# Entidades

Workflow

WorkflowVersion

WorkflowStep

WorkflowTransition

WorkflowCondition

WorkflowAction

WorkflowExecution

WorkflowExecutionStep

WorkflowVariable

WorkflowHistory

---

# Estados

WorkflowStatus

```

DRAFT

ACTIVE

INACTIVE

ARCHIVED

```

ExecutionStatus

```

CREATED

RUNNING

WAITING

COMPLETED

FAILED

CANCELLED

```

---

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

# Eventos

WorkflowStarted

StepCompleted

TransitionExecuted

WorkflowCompleted

WorkflowCancelled

---

# Reglas

Nunca modificar un workflow activo.

Siempre crear nueva versión.

Toda ejecución conserva la versión utilizada.

Todo cambio queda auditado.

---

# Ejemplo

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

# KPIs

Tiempo por workflow

Cuellos de botella

Paso más lento

Cantidad ejecutada

Errores

---

# Próximo Documento

DAD-14

Administration Platform