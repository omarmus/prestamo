# Data Architecture Document (DAD)
# Fintech de Préstamos Digitales para Bolivia

**Versión:** 1.0

**Estado:** En Diseño

**Arquitectura:** DDD + Clean Architecture + Modular Monolith

**Base de Datos:** PostgreSQL 17+

**ORM:** Prisma ORM

**Backend:** NestJS

**Frontend:** React + NextJS

**Cloud:** AWS

**Autor:** Equipo de Arquitectura

---

# Índice General

## Parte I

- Introducción
- Objetivos
- Principios
- Convenciones
- Estándares
- Arquitectura de Datos

## Parte II

Identity & Access Management

## Parte III

CRM

## Parte IV

Customer Management

## Parte V

Loan Application

## Parte VI

Documents

## Parte VII

Evaluation Engine

## Parte VIII

Loan Core

## Parte IX

Payments

## Parte X

Collections

## Parte XI

Notifications

## Parte XII

WhatsApp

## Parte XIII

Artificial Intelligence

## Parte XIV

Configuration

## Parte XV

Reporting

## Parte XVI

Audit

## Parte XVII

Infrastructure

## Parte XVIII

Dictionary

---

# 1. Introducción

Este documento define la arquitectura completa de datos del sistema Fintech.

Su objetivo es servir como fuente única de verdad (Single Source of Truth) para todos los equipos técnicos.

Toda entidad del sistema deberá existir primero en este documento antes de implementarse en código.

El DAD servirá como base para:

- PostgreSQL
- Prisma Schema
- NestJS
- APIs
- Eventos
- Integraciones
- Inteligencia Artificial
- Reportes
- Auditoría
- Data Warehouse

---

# 2. Objetivos

La arquitectura de datos debe cumplir los siguientes objetivos.

- Escalabilidad
- Seguridad
- Integridad
- Flexibilidad
- Alto rendimiento
- Multiempresa
- Auditoría completa
- Alta disponibilidad
- Evolución sencilla

---

# 3. Principios

## 3.1 UUID

Todas las tablas utilizarán UUID v7 como Primary Key.

Nunca se utilizarán IDs autoincrementales.

Ejemplo

```
01983c31-a25c-78c1-8b11-784bcf52ef55
```

Ventajas

- Distribuido
- Seguro
- No predecible
- Compatible con microservicios

---

## 3.2 UTC

Toda fecha será almacenada en UTC.

Nunca guardar fechas locales.

El frontend convertirá la zona horaria.

---

## 3.3 Soft Delete

Nunca eliminar información financiera.

Todas las tablas funcionales tendrán

```
deleted_at
deleted_by
```

---

## 3.4 Auditoría

Todas las modificaciones deberán quedar registradas.

No existen operaciones sin auditoría.

---

## 3.5 Multi Tenant Ready

Aunque el MVP será para una sola empresa, todas las tablas quedarán preparadas para múltiples organizaciones.

Cada entidad incluirá:

```
organization_id
```

Esto permitirá convertir la plataforma en SaaS sin rediseñar la base de datos.

---

## 3.6 Immutable Financial Data

Las operaciones financieras nunca serán modificadas.

Si existe un error se generará una nueva operación compensatoria.

Nunca actualizar:

- pagos
- desembolsos
- movimientos
- intereses

---

## 3.7 Event Driven

Toda operación importante generará un evento.

Ejemplo

```
LoanCreated

LoanApproved

LoanRejected

PaymentReceived

InstallmentPaid

CustomerBlocked
```

Estos eventos podrán utilizarse posteriormente con Kafka, RabbitMQ o SNS/SQS sin modificar el dominio.

---

# 4. Convenciones

## Tablas

Plural

Correcto

```
customers

loans

payments

documents
```

Incorrecto

```
customer

loan

payment
```

---

## Columnas

snake_case

Ejemplo

```
first_name

last_name

created_at
```

---

## Primary Key

Siempre

```
id
```

Nunca

```
customer_id

loan_id
```

como PK.

---

## Foreign Keys

Siempre

```
customer_id

loan_id

payment_id
```

---

## Índices

Formato

```
ix_table_column

Ejemplo

ix_customers_document_number
```

---

## Unique

Formato

```
uq_table_column
```

---

## Foreign Key

Formato

```
fk_table_reference
```

---

# 5. Campos Base

Casi todas las tablas heredarán estos campos.

| Campo | Tipo |
|---------|---------|
| id | UUID |
| organization_id | UUID |
| created_at | timestamptz |
| created_by | UUID |
| updated_at | timestamptz |
| updated_by | UUID |
| deleted_at | timestamptz |
| deleted_by | UUID |
| version | integer |

Estos campos serán implementados mediante una BaseEntity compartida.

---

# 6. Convenciones de Tipos

| Tipo | PostgreSQL |
|---------|-------------|
| UUID | uuid |
| Texto corto | varchar |
| Texto largo | text |
| Decimal | numeric(18,2) |
| Porcentaje | numeric(8,4) |
| Boolean | boolean |
| JSON | jsonb |
| Fecha | date |
| Fecha Hora | timestamptz |

---

# 7. Convenciones Monetarias

Nunca utilizar

```
float

double
```

Siempre utilizar

```
numeric(18,2)
```

Para tasas

```
numeric(10,6)
```

---

# 8. JSONB

Solo podrá utilizarse para datos dinámicos.

Ejemplos

Configuraciones

Metadata

Respuesta OCR

Respuesta IA

Logs

Nunca utilizar JSON para relaciones.

---

# 9. Enumeraciones

Todas las enumeraciones vivirán centralizadas.

Ejemplo

LoanStatus

```
DRAFT

SUBMITTED

UNDER_REVIEW

APPROVED

REJECTED

DISBURSED

ACTIVE

PAID

DEFAULTED

WRITTEN_OFF

CLOSED
```

---

CustomerStatus

```
LEAD

ACTIVE

BLOCKED

BLACKLISTED

INACTIVE

DECEASED
```

---

PaymentStatus

```
PENDING

PROCESSING

COMPLETED

FAILED

REVERSED

EXPIRED
```

---

# 10. Estrategia de Auditoría

Todas las operaciones importantes generarán un registro.

Ejemplo

```
Usuario

↓

Acción

↓

Entidad

↓

Registro

↓

Valores Anteriores

↓

Valores Nuevos

↓

Fecha

↓

IP

↓

Dispositivo
```

Nunca eliminar registros de auditoría.

---

# 11. Estrategia de Versionado

Cada registro tendrá

```
version
```

Se utilizará para:

- Optimistic Locking
- Sincronización
- APIs
- Eventos

---

# 12. Estrategia de Índices

Toda tabla deberá definir explícitamente sus índices.

No se crearán índices implícitos excepto los de Primary Key.

Cada índice deberá justificarse.

---

# 13. Preparado para Escalabilidad

La arquitectura permitirá evolucionar sin romper compatibilidad hacia:

- Microservicios
- CQRS
- Event Sourcing parcial
- Read Models
- Data Warehouse
- BI
- Machine Learning
- IA Predictiva

---

# 14. Dominios del Sistema

La plataforma estará dividida en los siguientes Bounded Contexts:

1. Identity
2. CRM
3. Customers
4. Loan Applications
5. Documents
6. Evaluation
7. Loan Core
8. Payments
9. Collections
10. Notifications
11. WhatsApp
12. Artificial Intelligence
13. Configuration
14. Reporting
15. Audit
16. Infrastructure

Cada dominio tendrá su propio conjunto de entidades, reglas, eventos y repositorios.

---

# Próximo Documento

**DAD-02 — Identity & Access Management**

En el siguiente documento se modelará completamente el dominio de autenticación y autorización, incluyendo usuarios, roles, permisos, sesiones, MFA, dispositivos, API Keys, OAuth, auditoría de acceso y políticas de seguridad.