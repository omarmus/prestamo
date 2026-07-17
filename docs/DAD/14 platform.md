# Data Architecture Document (DAD)

# Parte XIV

# Platform Foundation & Administration

Versión 1.0

---

# Objetivo

Construir la plataforma base sobre la que funcionará toda la fintech.

No pertenece al negocio financiero.

Provee servicios comunes.

---

# Dominios

Identity

Authorization

Organization

Users

Roles

Permissions

Settings

Configuration

Feature Flags

Localization

Audit

Jobs

Scheduler

Secrets

API Keys

---

# Aggregate Roots

Organization

User

Role

Permission

Configuration

FeatureFlag

---

# Arquitectura

```
Organization

↓

Users

↓

Roles

↓

Permissions

↓

Applications

↓

Modules

↓

Features
```

---

# Multi Tenant

Desde el inicio.

Una sola plataforma.

Múltiples financieras.

Ejemplo

```
Financiera A

Financiera B

Financiera C

```

Comparten infraestructura.

No comparten datos.

---

# Modelo de Datos

## organizations

| Campo |
|--------|
| id |
| code |
| legal_name |
| commercial_name |
| tax_identifier |
| country |
| currency |
| timezone |
| active |

---

## organization_settings

Configuración.

Ejemplos

Moneda

IVA

Interés

Horario

WhatsApp

IA

---

## users

Usuarios.

---

## user_profiles

Información personal.

---

## roles

Administrador

Analista

Supervisor

Cobranza

Operaciones

Auditor

Soporte

---

## permissions

Modelo RBAC.

Ejemplo

loan.read

loan.create

loan.approve

payment.reverse

customer.edit

---

## role_permissions

Relación.

---

## user_roles

Asignaciones.

---

## feature_flags

Permite activar funcionalidades.

Ejemplos

Nuevo Score IA

Nuevo Motor QR

Nuevo Workflow

Nuevo OCR

---

## api_clients

Clientes externos.

Landing

Mobile

WhatsApp

Backoffice

Marketplace

---

## api_keys

Llaves.

Nunca guardar texto plano.

Guardar hash.

---

## configuration

Configuraciones dinámicas.

Ejemplos

Interés máximo

Monto mínimo

Horario laboral

Tiempo OTP

Timeout IA

---

## scheduler_jobs

Trabajos programados.

Ejemplos

Actualizar mora

Enviar recordatorios

Generar reportes

Backups

---

## scheduler_history

Historial.

---

## audit_logs

Auditoría completa.

Nunca eliminar.

---

## login_sessions

Sesiones.

---

## refresh_tokens

Tokens.

---

## devices

Dispositivos.

---

## ip_whitelist

Accesos permitidos.

---

## secrets

Nunca guardar secretos en variables.

Centralizar.

---

# Eventos

OrganizationCreated

UserCreated

PermissionGranted

FeatureEnabled

LoginSucceeded

LoginFailed

SchedulerExecuted

---

# Reglas

Toda acción queda auditada.

No existen usuarios sin organización.

Toda configuración es dinámica.

Todo cambio genera versión.

Nunca eliminar auditorías.

---

# KPIs

Usuarios activos

Sesiones

Errores

Tiempo login

Uso API

Uso IA

---

# Tablas Totales

1 organizations

2 organization_settings

3 users

4 user_profiles

5 roles

6 permissions

7 role_permissions

8 user_roles

9 feature_flags

10 api_clients

11 api_keys

12 configuration

13 scheduler_jobs

14 scheduler_history

15 audit_logs

16 login_sessions

17 refresh_tokens

18 devices

19 ip_whitelist

20 secrets

Total

20 tablas

---

# Próximo Documento

DAD-15

AI Platform

El núcleo inteligente de toda la fintech.