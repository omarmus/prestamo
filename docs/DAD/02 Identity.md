# Data Architecture Document (DAD)

# Parte II

# Identity & Access Management

Versión 1.0

---

# Tabla de Contenido

1. Objetivo
2. Responsabilidades
3. Aggregate Root
4. Modelo del Dominio
5. Entidades
6. Relaciones
7. Enumeraciones
8. Reglas de Negocio
9. Eventos
10. Modelo de Datos

---

# 1. Objetivo

Este dominio administra toda la autenticación y autorización del sistema.

No administra clientes.

No administra préstamos.

Su única responsabilidad es controlar quién puede acceder al sistema y qué puede hacer.

---

# 2. Responsabilidades

• Usuarios internos

• Login

• Logout

• Roles

• Permisos

• MFA

• API Keys

• OAuth

• Sesiones

• Tokens

• Historial

• Dispositivos

• Auditoría de acceso

---

# 3. Aggregate Root

```
User
```

Todo gira alrededor del usuario.

---

# 4. Modelo del Dominio

```text
User
│
├── Credentials
├── Roles
├── Permissions
├── Sessions
├── Devices
├── MFA
├── ApiKeys
├── LoginHistory
└── RefreshTokens
```

---

# 5. Entidades

## Users

Representa un usuario del sistema.

Puede ser

Administrador

Analista

Supervisor

Cobranza

Soporte

Backoffice

NO representa clientes.

---

## Roles

Define funciones.

Ejemplos

ADMIN

MANAGER

ANALYST

COLLECTION

SUPPORT

AUDITOR

CUSTOMER

---

## Permissions

Cada acción tendrá un permiso.

Ejemplos

customer.read

customer.write

customer.delete

loan.approve

loan.reject

payment.create

payment.read

---

## User Roles

Relación N:M

Un usuario puede tener varios roles.

---

## Role Permissions

Relación N:M

Un rol posee muchos permisos.

---

## Sessions

Sesiones activas.

Cada login crea una sesión.

---

## Refresh Tokens

Control de JWT.

---

## Login History

Historial completo.

Nunca eliminar.

---

## Devices

Cada dispositivo registrado.

Mac

Windows

Android

iPhone

Tablet

---

## MFA Devices

Google Authenticator

Authenticator App

Passkeys

WebAuthn

SMS (opcional)

---

## API Keys

Para integraciones.

WhatsApp

ERP

CRM

Open Banking

---

## OAuth Clients

Clientes externos.

---

## Security Events

Eventos importantes.

---

# 6. Relaciones

```text
users

│

├──< user_roles >──── roles

│                       │

│                       └──< role_permissions >── permissions

│

├── sessions

├── refresh_tokens

├── devices

├── login_history

├── api_keys

├── mfa_devices

└── security_events
```

---

# 7. Enumeraciones

## UserStatus

```
ACTIVE

PENDING

BLOCKED

LOCKED

SUSPENDED

DELETED
```

---

## MFA Type

```
AUTHENTICATOR

PASSKEY

EMAIL

SMS
```

---

## Login Provider

```
LOCAL

GOOGLE

MICROSOFT

APPLE
```

---

## Device Type

```
WEB

IOS

ANDROID

TABLET
```

---

# 8. Reglas

Un usuario

Puede tener varios roles.

---

Un rol

Puede tener muchos permisos.

---

No existe usuario sin estado.

---

No existe sesión sin usuario.

---

No existe API Key sin propietario.

---

Cada Login genera historial.

---

Cinco intentos fallidos

↓

LOCKED

---

MFA obligatorio para

ADMIN

MANAGER

SUPERVISOR

---

# 9. Eventos

```
UserCreated

UserUpdated

UserActivated

UserBlocked

PasswordChanged

LoginSucceeded

LoginFailed

LogoutCompleted

RoleAssigned

RoleRemoved

ApiKeyCreated

SessionExpired
```

---

# 10. Modelo de Datos

---

## users

Descripción

Usuarios internos.

Campos

| Campo | Tipo | Restricciones |
|---------|----------------|----------------|
| id | UUID | PK |
| organization_id | UUID | FK |
| first_name | varchar(100) | NOT NULL |
| last_name | varchar(100) | NOT NULL |
| email | varchar(255) | UNIQUE |
| phone | varchar(30) | UNIQUE |
| password_hash | text | NOT NULL |
| status | UserStatus | INDEX |
| last_login_at | timestamptz | NULL |
| password_changed_at | timestamptz | |
| failed_attempts | integer | DEFAULT 0 |
| locked_until | timestamptz | |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| deleted_at | timestamptz | |

Índices

```
ix_users_email

ix_users_phone

ix_users_status

ix_users_organization
```

---

## roles

| Campo | Tipo |
|---------|------|
| id | UUID |
| code | varchar(50) UNIQUE |
| name | varchar(100) |
| description | text |

---

## permissions

| Campo | Tipo |
|---------|------|
| id | UUID |
| code | varchar(100) UNIQUE |
| module | varchar(50) |
| action | varchar(50) |
| description | text |

Ejemplos

customer.read

customer.write

customer.export

loan.approve

loan.reject

loan.disburse

payment.create

payment.refund

---

## user_roles

| Campo |
|--------|
| id |
| user_id |
| role_id |
| assigned_by |
| assigned_at |

---

## role_permissions

| Campo |
|--------|
| id |
| role_id |
| permission_id |

---

## sessions

| Campo |
|--------|
| id |
| user_id |
| refresh_token |
| ip_address |
| user_agent |
| device_id |
| expires_at |
| revoked_at |
| created_at |

---

## refresh_tokens

| Campo |
|--------|
| id |
| session_id |
| token_hash |
| expires_at |
| revoked |

---

## login_history

| Campo |
|--------|
| id |
| user_id |
| email |
| success |
| ip |
| device |
| browser |
| os |
| country |
| city |
| created_at |

---

## devices

| Campo |
|--------|
| id |
| user_id |
| fingerprint |
| device_name |
| platform |
| browser |
| trusted |
| last_seen |

---

## mfa_devices

| Campo |
|--------|
| id |
| user_id |
| type |
| secret |
| enabled |
| verified_at |

---

## api_keys

| Campo |
|--------|
| id |
| organization_id |
| name |
| key_hash |
| scopes |
| expires_at |
| last_used_at |
| active |

Las claves nunca se almacenan en texto plano.

---

## oauth_clients

Preparado para futuras integraciones.

---

## security_events

| Campo |
|--------|
| id |
| user_id |
| event |
| metadata JSONB |
| ip |
| created_at |

---

# Relaciones Totales

users

↓

roles

↓

permissions

↓

sessions

↓

devices

↓

tokens

↓

login history

↓

security

---

# Resumen

Tablas

1. users
2. roles
3. permissions
4. user_roles
5. role_permissions
6. sessions
7. refresh_tokens
8. devices
9. login_history
10. mfa_devices
11. api_keys
12. oauth_clients
13. security_events

Total

13 tablas

---

# Próximo Documento

**DAD-03 — CRM & Lead Management**

Se modelará el flujo completo desde que un visitante llega a la landing, conversa por WhatsApp, se convierte en lead y posteriormente en cliente potencial para una solicitud de préstamo.