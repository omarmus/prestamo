# Data Architecture Document (DAD)

# Parte XXVII

# Mobile Application Platform

Versión 1.0

---

# Tabla de Contenido

1. Objetivo
2. Aplicaciones móviles
3. Arquitectura
4. Cliente App
5. Agent App
6. Seguridad móvil
7. Offline Mode
8. Push Notifications
9. Modelo de Datos
10. Eventos
11. KPIs

---

# 1. Objetivo

Crear aplicaciones móviles seguras para clientes, agentes y administración.

---

# 2. Aplicaciones

La plataforma tendrá tres aplicaciones.

---

# Customer Mobile App

Aplicación del cliente.

---

# Collection Agent App

Aplicación para cobradores.

---

# Internal Operations App

Para supervisores.

---

# 3. Arquitectura

```

Mobile App

↓

API Gateway

↓

Backend

↓

Domain Services


```

---

# 4. Customer App

Funciones:

---

## Registro

- teléfono
- OTP
- biometría

---

## Dashboard

Mostrar:

- préstamo activo
- saldo
- próxima cuota
- estado

---

## Solicitud préstamo

Flujo:

```

Monto

↓

Plazo

↓

Simulación

↓

Solicitud

```

---

## Pagos

Funciones:

- generar QR
- historial
- comprobantes

---

## Documentos

Acceso:

- contrato
- recibos
- certificados

---

## Comunicación

Canales:

- WhatsApp
- Chat IA
- Notificaciones

---

# 5. Agent App

Para cobranza.

---

Funciones:

## Cartera asignada

Lista clientes.

---

## Visitas

Registrar:

- ubicación
- evidencia
- comentarios

---

## Gestión cobranza

Acciones:

- llamar
- enviar mensaje
- registrar promesa

---

## Offline

Debe funcionar sin conexión.

---

# 6. Seguridad móvil

---

# Device Binding

Asociar cuenta a dispositivo.

---

# Biometric Login

Soporte:

Face ID

Fingerprint

---

# Secure Storage

Guardar:

Tokens

Refresh tokens

Secretos locales

---

Tecnologías:

iOS Keychain

Android Keystore

---

# Certificate Pinning

Evitar ataques MITM.

---

# Root/Jailbreak Detection

Detectar dispositivos comprometidos.

---

# Screenshot Protection

Para pantallas sensibles.

---

# 7. Offline Mode

Importante para agentes.

Ejemplo:

Cobrador visita zona sin internet.

Puede registrar:

- visita;
- ubicación;
- comentario;
- evidencia.

Luego sincroniza.

---

Arquitectura:

```

Local Database

        │

        ▼

Sync Engine

        │

        ▼

Backend

```

---

Tecnología:

SQLite

WatermelonDB

Realm

---

# 8. Push Notifications

Eventos:

---

## Préstamo

Aprobado

Rechazado

Desembolsado

---

## Pagos

Recordatorio

Confirmación

---

## Seguridad

Nuevo dispositivo

Login sospechoso

---

## Marketing

Ofertas

---

Tecnologías:

Firebase Cloud Messaging

Apple Push Notification Service

---

# 9. Modelo de Datos

---

# mobile_devices

Dispositivos registrados.

---

# app_sessions

Sesiones móviles.

---

# push_tokens

Tokens notificaciones.

---

# mobile_permissions

Permisos.

---

# sync_operations

Operaciones sincronización.

---

# offline_records

Datos pendientes.

---

# app_versions

Control versiones.

---

# crash_reports

Errores aplicación.

---

# Modelo Total

1 mobile_devices

2 app_sessions

3 push_tokens

4 mobile_permissions

5 sync_operations

6 offline_records

7 app_versions

8 crash_reports


Total:

8 tablas

---

# 10. Eventos

MobileInstalled

DeviceRegistered

LoginMobile

PushSent

SyncCompleted

CrashDetected

---

# 11. KPIs

Usuarios activos diarios

Usuarios activos mensuales

Retención

Crash rate

Tiempo sesión

Conversión app

---

# Próximo Documento

DAD-28

Infrastructure & DevOps Platform

Incluye:

- Cloud architecture
- CI/CD
- Docker
- Kubernetes
- backups
- disaster recovery
- ambientes
- despliegue producción