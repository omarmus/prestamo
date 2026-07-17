# Data Architecture Document (DAD)

# Parte XXIII

# Digital Contracts Platform

Versión 1.0

---

# Tabla de Contenido

1. Objetivo
2. Arquitectura
3. Flujo contractual
4. Componentes
5. Aggregate Roots
6. Modelo de Datos
7. Firma Digital
8. Evidencia Legal
9. Eventos
10. Reglas
11. KPIs

---

# 1. Objetivo

Gestionar contratos digitales asociados a productos financieros.

Incluye:

- creación;
- aprobación;
- firma;
- almacenamiento;
- auditoría;
- evidencia.

---

# 2. Arquitectura

```

Loan Approved

↓

Contract Generator

↓

Template Engine

↓

PDF Generator

↓

Signature Process

↓

Evidence Storage

↓

Contract Active

```

---

# 3. Flujo Contractual

## Paso 1

Préstamo aprobado.

Evento:

LoanApproved


---

## Paso 2

Generación contrato.

Usa:

- producto;
- monto;
- tasa;
- plazo;
- cliente.


---

## Paso 3

Renderizado.

Genera:

PDF

HTML

Versión digital

---

## Paso 4

Presentación cliente.

Canales:

WhatsApp

Web

App móvil

---

## Paso 5

Aceptación.

Métodos:

OTP

Firma electrónica

Click acceptance

Firma avanzada

---

## Paso 6

Evidencia.

Guardar:

- fecha;
- IP;
- dispositivo;
- ubicación;
- hash;
- versión contrato.

---

# 4. Componentes

---

# Template Engine

Administra plantillas.

Ejemplo:

Contrato préstamo consumo.

---

# Document Generator

Genera documentos.

Formatos:

PDF

HTML

---

# Signature Engine

Gestiona firma.

---

# Evidence Engine

Guarda evidencia legal.

---

# Storage Engine

Almacena documentos.

---

# 5. Aggregate Roots

Contract

ContractTemplate

Signature

EvidenceRecord

DocumentVersion

---

# 6. Modelo de Datos

---

# contracts

Contrato principal.

Campos:

id

loan_id

customer_id

status

version

created_at

signed_at

---

Estados:

```

DRAFT

GENERATED

SENT

VIEWED

SIGNED

ACTIVE

EXPIRED

CANCELLED

```

---

# contract_templates

Plantillas.

Campos:

name

country

product_type

version

active

---

# contract_versions

Versionamiento.

Ejemplo:

Contrato v1.0

Contrato v1.1

---

# contract_variables

Variables dinámicas.

Ejemplo:

```

{{customer_name}}

{{loan_amount}}

{{interest_rate}}

```

---

# documents

Archivos generados.

Campos:

storage_path

hash

mime_type

size

---

# signatures

Firmas.

Campos:

type

provider

status

timestamp

---

# signature_attempts

Intentos.

---

# evidence_records

Evidencias.

Campos:

ip

device

location

timestamp

hash

---

# acceptance_events

Aceptaciones.

Ejemplo:

Cliente aceptó términos.

---

# legal_notifications

Comunicaciones legales.

Ejemplo:

Envío contrato WhatsApp.

---

# contract_audit

Historial.

---

# 7. Firma Digital

Opciones:

---

## OTP Acceptance

Más simple.

Ejemplo:

Código enviado WhatsApp.

Cliente confirma.

---

## Firma electrónica simple

Aceptación digital.

---

## Firma avanzada

Proveedor certificado.

---

# Recomendación MVP

Empezaría con:

```
Contrato PDF

+

OTP WhatsApp

+

Registro evidencia

```

Después integrar firma avanzada.

---

# 8. Evidencia Legal

Guardar:

## Identidad

Cliente verificado.

---

## Tiempo

Timestamp certificado.

---

## Comunicación

Mensaje enviado.

---

## Dispositivo

Información técnica.

---

## Integridad

Hash documento.

Ejemplo:

```
SHA256:

a83b92.....

```

---

# 9. Eventos

ContractCreated

ContractGenerated

ContractSent

ContractViewed

ContractSigned

ContractExpired

SignatureFailed

---

# 10. Reglas

Un préstamo no puede desembolsarse sin contrato firmado.

Nunca modificar contratos activos.

Toda modificación genera nueva versión.

Toda firma debe tener evidencia.

Los documentos deben tener backup.

---

# 11. KPIs

Contratos generados

Contratos firmados

Tiempo firma

Abandonos

Errores firma

Costo documental

---

# Tablas Totales

1 contracts

2 contract_templates

3 contract_versions

4 contract_variables

5 documents

6 signatures

7 signature_attempts

8 evidence_records

9 acceptance_events

10 legal_notifications

11 contract_audit


Total:

11 tablas

---

# Próximo Documento

DAD-24

Payment & QR Platform

Incluye:

- QR dinámico Bolivia
- conciliación bancaria
- pagos automáticos
- estados financieros
- integración bancaria
- webhook payments
- ledger