# Data Architecture Document (DAD)

# Parte XLIV

# Customer Portal Platform

Versión 1.0

---

# Tabla de Contenido

1. Objetivo
2. Estrategia Customer Portal
3. Arquitectura
4. Registro y Acceso
5. Dashboard Cliente
6. Simulador Crédito
7. Gestión Préstamo
8. Pagos y Cuotas
9. Documentos Digitales
10. Perfil Cliente
11. Modelo de Datos
12. Eventos
13. KPIs

---

# 1. Objetivo

Crear un portal digital donde el cliente pueda gestionar toda su relación con la fintech sin depender completamente de un asesor.

---

# 2. Estrategia Customer Portal

El portal debe complementar WhatsApp.

No reemplazarlo.

Modelo:

```

Cliente

   │

   ├── WhatsApp Bot

   │

   └── Customer Portal


```

---

# 3. Arquitectura

```

Customer Portal

        │

        ▼

Frontend Web


        │


        ▼


API Gateway


        │


        ▼


Backend Platform


        │


 ┌──────┼────────┐


 ▼      ▼        ▼


Loans Payments Documents


```

---

# 4. Registro y Acceso

Métodos:

---

## WhatsApp Login

Cliente recibe enlace seguro.

---

## OTP

Código temporal.

---

## Email

Opcional.

---

# Seguridad

Implementar:

- sesiones seguras;
- expiración tokens;
- control dispositivos.

---

# 5. Dashboard Cliente

Pantalla principal.

Debe mostrar:

---

## Crédito activo

Ejemplo:

```

Préstamo:

Bs5000


Saldo:

Bs2800


Próxima cuota:

Bs350


Fecha:

15 agosto


```

---

## Estado financiero

Mostrar:

- total prestado;
- total pagado;
- historial.

---

## Acciones rápidas

Botones:

```

Pagar cuota

Solicitar préstamo

Descargar contrato

Hablar WhatsApp


```

---

# 6. Simulador Crédito

Antes de solicitar.

Permite calcular:

- monto;
- plazo;
- cuota;
- intereses.

---

Ejemplo:

```

Monto:

Bs3000


Plazo:

60 días


Cuota:

Bs170


```

---

El simulador usa:

Loan Product Engine.

---

# 7. Gestión Préstamo

Cliente puede:

---

Consultar:

- estado;
- saldo;
- fechas.

---

Ver:

- cronograma;
- pagos realizados;
- cargos.

---

Solicitar:

- renovación;
- aumento línea crédito.

---

# 8. Pagos y Cuotas

Funciones:

---

## Generar pago

```

Seleccionar cuota

↓

Crear QR

↓

Pagar

↓

Confirmación


```

---

## Historial pagos

Mostrar:

- fecha;
- monto;
- referencia;
- estado.

---

# 9. Documentos Digitales

Repositorio cliente.

Documentos:

- contrato préstamo;
- pagaré;
- comprobantes;
- certificados.

---

Características:

- descarga;
- visualización;
- control versiones.

---

# 10. Perfil Cliente

Información:

---

Datos personales:

- nombre;
- teléfono;
- dirección.

---

Información financiera:

- ingresos;
- actividad económica.

---

Configuración:

- preferencias;
- notificaciones.

---

# 11. Modelo de Datos

---

# customer_portal_users

Usuarios portal.

---

# customer_sessions

Sesiones activas.

---

# customer_preferences

Preferencias cliente.

---

# customer_documents

Documentos visibles.

---

# document_access_logs

Accesos documentos.

---

# loan_simulations

Simulaciones realizadas.

---

# portal_actions

Acciones cliente.

---

# Modelo Total

1. customer_portal_users

2. customer_sessions

3. customer_preferences

4. customer_documents

5. document_access_logs

6. loan_simulations

7. portal_actions


Total:

7 tablas

---

# 12. Eventos

CustomerPortalRegistered

CustomerLogin

LoanSimulationCreated

DocumentViewed

PaymentStarted

PortalActionCreated

---

# 13. KPIs

Usuarios registrados.

Usuarios activos.

Simulaciones realizadas.

Conversión simulación → préstamo.

Pagos digitales.

Documentos consultados.

---

# Tecnologías recomendadas

## Frontend

Next.js

React

---

## Backend

NestJS

---

## Authentication

OAuth2 / JWT

---

## Storage

S3 privado

---

## Analytics

Eventos propios + BI

---

# Próximo Documento

DAD-45

Admin Backoffice Platform

Incluye:

- panel administrativo;
- usuarios internos;
- aprobación préstamos;
- gestión clientes;
- cobranza;
- reportes;
- configuración negocio.