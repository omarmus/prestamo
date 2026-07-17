# Data Architecture Document (DAD)

# Parte XXI

# Security Platform

Versión 1.0

---

# Tabla de Contenido

1. Objetivo
2. Principios de Seguridad
3. Arquitectura
4. Identity Management
5. Authentication
6. Authorization
7. Data Protection
8. Secrets Management
9. Audit Security
10. Threat Detection
11. Modelo de Datos
12. Reglas
13. KPIs

---

# 1. Objetivo

Crear una plataforma centralizada de seguridad para proteger todos los dominios de la fintech.

---

# 2. Principios

## Zero Trust

Nunca confiar automáticamente.

Todo acceso debe ser validado.

---

## Least Privilege

Cada usuario solamente tiene los permisos necesarios.

---

## Defense in Depth

Múltiples capas de protección.

---

## Security by Design

La seguridad se diseña desde el inicio.

---

# 3. Arquitectura

```

Client

↓

API Gateway

↓

Identity Provider

↓

Access Token

↓

Policy Engine

↓

Services

↓

Audit

```

---

# 4. Identity Management

Gestiona identidades:

Clientes

Empleados

Administradores

Partners

Sistemas externos

IA Agents

---

# Tipos de identidad

## Customer Identity

Cliente solicitante de préstamo.

---

## Employee Identity

Usuarios internos.

Ejemplo:

Analista

Supervisor

Cobranza

---

## Machine Identity

Servicios internos.

Ejemplo:

Loan Service

Payment Service

AI Gateway

---

# 5. Authentication

Métodos soportados:

---

## Password

Usuarios administrativos.

---

## OTP

Clientes.

Ejemplo:

WhatsApp OTP

SMS OTP

Email OTP

---

## MFA

Usuarios críticos.

Ejemplo:

Administrador financiero.

---

## Biométrico

Futuro:

App móvil.

---

## Passkeys

Futuro.

---

# 6. Authorization

Modelo:

RBAC + ABAC

---

# RBAC

Roles:

Administrador

Analista crédito

Cobranza

Contabilidad

Auditor

Soporte

---

# ABAC

Reglas dinámicas.

Ejemplo:

Un analista puede aprobar:

```
Monto < Bs 10.000

```

Pero no:

```
Monto > Bs 100.000

```

---

# Permisos

Ejemplos:

```
loan.create

loan.approve

payment.reverse

ledger.view

customer.export

```

---

# 7. Data Protection

## Encryption At Rest

Bases de datos.

Archivos.

Backups.

---

## Encryption In Transit

TLS obligatorio.

---

## Datos sensibles

Proteger:

Cédula

Teléfono

Cuenta bancaria

Ingresos

Documentos

Selfies

---

# Tokenización

Ejemplo:

Cuenta bancaria:

```
4532-xxxx-xxxx-1234

```

---

# Masking

Usuarios no autorizados:

```
******1234

```

---

# 8. Secrets Management

Nunca guardar:

Passwords

API Keys

Tokens

Certificados

en:

- código;
- variables públicas;
- repositorios.

---

Usar:

Hashicorp Vault

AWS Secrets Manager

Doppler

Cloud Secret Manager

---

# 9. Audit Security

Registrar:

Quién

Qué

Cuándo

Dónde

Antes

Después

---

Ejemplos:

Administrador cambia tasa.

Usuario descarga documento.

Analista aprueba préstamo.

---

# 10. Threat Detection

Detectar:

## Brute Force

Muchos intentos login.

---

## Account Takeover

Cambio sospechoso.

---

## Token Abuse

Uso anormal.

---

## API Abuse

Demasiadas solicitudes.

---

## Insider Threat

Empleado accede a información indebida.

---

# Security Events

LoginSuccess

LoginFailed

PermissionDenied

TokenCreated

PasswordChanged

SensitiveDataAccessed

SuspiciousActivityDetected

---

# 11. Modelo de Datos

---

# users

Usuarios del sistema.

---

# identities

Identidades.

Campos:

type

provider

external_id

---

# credentials

Credenciales.

Nunca guardar contraseña.

---

# sessions

Sesiones activas.

---

# refresh_tokens

Tokens renovables.

---

# mfa_methods

Métodos MFA.

---

# roles

Roles.

---

# permissions

Permisos.

---

# role_permissions

Relación.

---

# user_roles

Asignaciones.

---

# policies

Reglas ABAC.

Ejemplo:

```
loan_amount < 10000

```

---

# access_logs

Registro accesos.

---

# security_events

Eventos seguridad.

---

# api_credentials

Credenciales externas.

---

# encryption_keys

Metadatos de claves.

Nunca guardar claves privadas aquí.

---

# device_trust

Dispositivos confiables.

---

# threat_events

Amenazas detectadas.

---

# Tabla Total

1 users

2 identities

3 credentials

4 sessions

5 refresh_tokens

6 mfa_methods

7 roles

8 permissions

9 role_permissions

10 user_roles

11 policies

12 access_logs

13 security_events

14 api_credentials

15 encryption_keys

16 device_trust

17 threat_events


Total:

17 tablas

---

# 12. Reglas

Nunca almacenar passwords en texto plano.

Todo acceso sensible genera auditoría.

Usuarios críticos requieren MFA.

Tokens tienen expiración.

Permisos mínimos necesarios.

Los datos financieros no pueden exponerse en logs.

---

# 13. KPIs

Intentos login

Fallos autenticación

Usuarios bloqueados

Eventos seguridad

Accesos sensibles

Ataques bloqueados

---

# Tecnologías recomendadas

## MVP

- Keycloak
- JWT
- OAuth2
- OpenID Connect
- Vault
- Cloudflare WAF


## Escala

- AWS Cognito
- AWS KMS
- SIEM
- Security Hub
- CrowdStrike

---

# Próximo Documento

DAD-22

KYC & Identity Verification Platform

Incluye:

- Cédula boliviana
- OCR
- Selfie
- Liveness
- Firma digital
- Validación identidad
- Score KYC