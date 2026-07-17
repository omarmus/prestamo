# Data Architecture Document (DAD)

# Parte XL

# Security Architecture Platform

Versión 1.0

---

# Tabla de Contenido

1. Objetivo
2. Security Principles
3. Identity Access Management
4. Authentication
5. Authorization
6. Data Protection
7. Encryption
8. Secrets Management
9. API Security
10. Infrastructure Security
11. Audit System
12. Modelo de Datos
13. Eventos
14. KPIs

---

# 1. Objetivo

Diseñar una arquitectura de seguridad para proteger clientes, datos financieros y operaciones críticas.

---

# 2. Security Principles

---

# Zero Trust

Validar todo acceso.

---

# Least Privilege

Cada usuario tiene solamente permisos necesarios.

---

# Defense in Depth

Múltiples capas protección.

---

# Auditability

Todo debe quedar registrado.

---

# 3. Identity Access Management (IAM)

Gestiona:

- usuarios;
- empleados;
- administradores;
- agentes;
- partners.

---

# Roles principales

---

## Customer

Cliente final.

---

## Collection Agent

Cobranza.

---

## Credit Analyst

Analista crédito.

---

## Finance User

Área financiera.

---

## Administrator

Administrador sistema.

---

## Super Admin

Acceso total.

---

# 4. Authentication

Métodos:

---

# Cliente

OTP WhatsApp/SMS.

---

# Empleados

Email + contraseña.

+

MFA obligatorio.

---

# Administradores

Hardware key recomendado.

---

# Tokens

Usar:

JWT

Refresh Token

Short expiration.

---

# 5. Authorization

Modelo recomendado:

RBAC + ABAC.

---

# RBAC

Control por roles.

Ejemplo:

```

Analista crédito

puede revisar solicitudes.


```

---

# ABAC

Control por atributos.

Ejemplo:

```

Analista región Santa Cruz

solo ve clientes asignados.


```

---

# 6. Data Protection

Clasificación:

---

# Pública

Información general.

---

# Interna

Datos operación.

---

# Confidencial

Datos clientes.

---

# Crítica

Documentos identidad.

Datos financieros.

---

# 7. Encryption

---

# En tránsito

TLS 1.3.

---

# En reposo

AES-256.

---

# Datos sensibles

Cifrado adicional:

- CI;
- documentos;
- cuentas bancarias.

---

# 8. Secrets Management

Nunca guardar:

```

API_KEY=password

```

en código.

---

Usar:

- AWS Secrets Manager;
- Hashicorp Vault;
- Doppler.

---

# 9. API Security

Protección:

---

## Rate Limiting

Evitar abuso.

---

## API Keys

Partners.

---

## OAuth2

Aplicaciones externas.

---

## JWT Validation

Usuarios.

---

## Request Validation

Evitar payloads maliciosos.

---

# 10. Infrastructure Security

---

# Network

Separar:

Public subnet

Private subnet

Database subnet


---

# Firewall

Solo puertos necesarios.

---

# WAF

Protección ataques web.

---

# DDoS Protection

Cloudflare.

AWS Shield.

---

# 11. Audit System

Registrar:

- login;
- cambios permisos;
- aprobación créditos;
- pagos;
- modificaciones datos.

---

Ejemplo:

```

Usuario:

admin


Acción:

Cambió límite crédito


Fecha:

2026-08-01


IP:

xxx


```

---

# 12. Modelo de Datos

---

# users

Usuarios sistema.

---

# roles

Roles.

---

# permissions

Permisos.

---

# user_roles

Asignaciones.

---

# sessions

Sesiones activas.

---

# mfa_devices

Dispositivos MFA.

---

# api_keys

Claves API.

---

# audit_logs

Auditoría.

---

# security_events

Eventos seguridad.

---

# encryption_keys

Metadatos claves.

---

# access_policies

Políticas acceso.

---

# Modelo Total

1 users

2 roles

3 permissions

4 user_roles

5 sessions

6 mfa_devices

7 api_keys

8 audit_logs

9 security_events

10 encryption_keys

11 access_policies


Total:

11 tablas

---

# 13. Eventos

UserLogin

LoginFailed

PermissionChanged

SensitiveDataAccessed

APIKeyCreated

SecurityAlert

---

# 14. KPIs

Intentos acceso fallidos.

Incidentes seguridad.

Tiempo detección.

Tiempo respuesta.

Usuarios con MFA.

---

# Tecnologías

## Application Security

NestJS Guards

OWASP

Helmet

Validation Pipes


---

## Infrastructure

Cloudflare

AWS WAF

Security Groups


---

## Monitoring

Prometheus

Grafana

SIEM


---

# Próximo Documento

DAD-41

Compliance & Regulatory Platform Bolivia

Incluye:

- ASFI;
- protección datos;
- prevención fraude;
- AML;
- reportes regulatorios;
- auditoría legal;
- políticas internas.