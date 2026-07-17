# Data Architecture Document (DAD)

# Parte XLIII

# Mobile Application Platform

Versión 1.0

---

# Tabla de Contenido

1. Objetivo
2. Estrategia Mobile
3. Tipos de Aplicaciones
4. Arquitectura Mobile
5. App Cliente
6. App Agentes
7. Autenticación móvil
8. Pagos QR
9. Notificaciones Push
10. Offline Mode
11. Seguridad Mobile
12. Modelo de Datos
13. Eventos
14. KPIs

---

# 1. Objetivo

Crear una plataforma móvil para clientes y colaboradores que permita gestionar préstamos, pagos y operaciones financieras.

---

# 2. Estrategia Mobile

La recomendación para el MVP:

NO crear aplicación móvil inicialmente.

Orden recomendado:

Fase 1:

```
Landing

+

WhatsApp Bot

+

Web Customer Portal

+

Admin


```

Fase 2:

```
Aplicación móvil cliente


```

Fase 3:

```
Aplicación agentes


```

---

# 3. Tipos de Aplicaciones

La plataforma tendrá tres aplicaciones:

---

# Customer App

Cliente final.

Funciones:

- registro;
- solicitud préstamo;
- consultar saldo;
- pagar cuotas;
- recibir alertas.

---

# Agent App

Agentes cobranza.

Funciones:

- cartera asignada;
- visitas;
- seguimiento;
- pagos.

---

# Internal App

Para empleados internos.

---

# 4. Arquitectura Mobile

```

Mobile Application


        │


        ▼


API Gateway


        │


        ▼


Backend Platform


        │


 ┌──────┼──────┐


 ▼      ▼      ▼


Loans  Payments  Notifications


```

---

# 5. App Cliente

Funciones principales:

---

## Dashboard

Mostrar:

- préstamo activo;
- próxima cuota;
- saldo pendiente.

---

## Solicitud crédito

Flujo:

```

Simular

↓

Solicitar

↓

KYC

↓

Evaluación

↓

Aprobación


```

---

## Pagos

Opciones:

- QR;
- transferencia;
- otros métodos.

---

## Documentos

Cliente puede descargar:

- contrato;
- comprobantes;
- estados.

---

# 6. App Agentes

Para cobranza.

Funciones:

---

## Cartera asignada

Lista clientes.

---

## Gestión visitas

Registrar:

- ubicación;
- fecha;
- resultado.

---

## Evidencias

Capturar:

- fotografías;
- documentos;
- notas.

---

# 7. Autenticación Mobile

Métodos:

---

OTP WhatsApp

---

OTP SMS

---

Biometría dispositivo

---

Face ID

Touch ID

Android Biometrics


---

# Tokens

Usar:

- Access Token corto;
- Refresh Token;
- Device Binding.

---

# 8. Pagos QR

Integración:

```

Cliente

↓

App

↓

Generar QR

↓

Pago Banco

↓

Confirmación

↓

Actualizar préstamo


```

---

# 9. Notificaciones Push

Usar:

Firebase Cloud Messaging.

---

Eventos:

- cuota próxima;
- pago recibido;
- préstamo aprobado;
- nueva oferta.

---

# 10. Offline Mode

Importante para agentes.

Permitir:

Guardar temporalmente:

- visitas;
- notas;
- evidencias.

Luego sincronizar.

---

# 11. Seguridad Mobile

Implementar:

---

## Protección almacenamiento

No guardar:

- documentos;
- tokens sensibles.

---

## Certificate Pinning

Evitar ataques MITM.

---

## Root/Jailbreak Detection

Detectar dispositivos comprometidos.

---

## App Integrity

Validar aplicación original.

---

# 12. Modelo de Datos

---

# mobile_devices

Dispositivos registrados.

---

# push_tokens

Tokens notificaciones.

---

# app_sessions

Sesiones móviles.

---

# device_security_checks

Validaciones seguridad.

---

# mobile_sync_queue

Cola sincronización offline.

---

# agent_locations

Ubicaciones agentes.

---

# field_visits

Visitas realizadas.

---

# visit_evidences

Evidencias.

---

# Modelo Total

1. mobile_devices

2. push_tokens

3. app_sessions

4. device_security_checks

5. mobile_sync_queue

6. agent_locations

7. field_visits

8. visit_evidences


Total:

8 tablas

---

# 13. Eventos

MobileDeviceRegistered

PushTokenUpdated

MobileLogin

VisitCreated

EvidenceUploaded

OfflineSyncCompleted

---

# 14. KPIs

Usuarios activos móviles.

Pagos desde app.

Retención móvil.

Errores aplicación.

Tiempo sincronización.

---

# Tecnologías recomendadas

## Frontend Mobile

React Native

Expo


---

## Backend

NestJS


---

## Push

Firebase Cloud Messaging


---

## Storage

S3


---

# Próximo Documento

DAD-44

Customer Portal Platform

Incluye:

- portal web cliente;
- dashboard financiero;
- simulador préstamos;
- pagos;
- documentos;
- autoservicio.