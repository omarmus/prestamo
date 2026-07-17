# Data Architecture Document (DAD)

# Parte VI

# Document Management & KYC Verification

Versión 1.0

---

# Tabla de Contenido

1. Objetivo
2. Responsabilidades
3. Aggregate Root
4. Flujo Documental
5. Entidades
6. Estados
7. Eventos
8. Modelo de Datos
9. Reglas de Negocio

---

# 1. Objetivo

Este dominio administra todos los documentos del sistema.

No importa si pertenecen a:

- Lead
- Customer
- Loan
- Pago
- Contrato

Todo documento será administrado aquí.

---

# 2. Responsabilidades

• Subida de archivos

• Versionado

• OCR

• Biometría

• Selfie

• Liveness

• Validaciones

• Firmas

• Hash

• Almacenamiento

• Evidencias

• Auditoría

---

# 3. Aggregate Root

Document

---

# 4. Flujo

```

Cliente

↓

Carga documento

↓

Storage

↓

OCR

↓

IA

↓

Validación

↓

Aprobación

↓

Disponible para evaluación

```

---

# 5. Entidades

Document

DocumentType

DocumentCategory

DocumentVersion

OCRResult

DocumentValidation

BiometricValidation

LivenessValidation

ElectronicSignature

DocumentHash

DocumentStorage

DocumentShare

DocumentAudit

---

# 6. Estados

## DocumentStatus

```

UPLOADED

PROCESSING

OCR_COMPLETED

VALIDATED

REJECTED

EXPIRED

ARCHIVED

```

---

## ValidationStatus

```

PENDING

VALID

INVALID

REVIEW_REQUIRED

```

---

## SignatureStatus

```

NOT_SIGNED

SIGNED

REVOKED

EXPIRED

```

---

# 7. Eventos

```

DocumentUploaded

OCRCompleted

DocumentValidated

DocumentRejected

BiometricValidated

SignatureCompleted

DocumentArchived

```

---

# 8. Modelo de Datos

---

## documents

Documento principal.

| Campo | Tipo |
|--------|------|
| id | UUID |
| organization_id | UUID |
| customer_id | UUID |
| application_id | UUID |
| category_id | UUID |
| type_id | UUID |
| status | DocumentStatus |
| current_version | integer |
| storage_provider | varchar(30) |
| created_at | timestamptz |

Índices

```

ix_documents_customer

ix_documents_application

ix_documents_status

```

---

## document_categories

Ejemplos

IDENTITY

INCOME

BANK

CONTRACT

LEGAL

PAYMENT

PHOTO

OTHER

---

## document_types

Ejemplos

CI_FRONT

CI_BACK

SELFIE

LIVENESS

PAYSLIP

BANK_STATEMENT

SERVICE_BILL

CONTRACT

PROMISSORY_NOTE

QR_RECEIPT

---

## document_versions

Cada modificación crea una nueva versión.

Nunca sobrescribir archivos.

| Campo |
|--------|
| id |
| document_id |
| version |
| storage_key |
| file_name |
| mime_type |
| size |
| checksum |
| uploaded_by |
| uploaded_at |

---

## document_storage

Información física.

| Campo |
|--------|
| id |
| document_version_id |
| provider |
| bucket |
| region |
| storage_key |
| url |
| encrypted |

Proveedor

```

AWS_S3

MINIO

AZURE

GCS

```

---

## document_hashes

Integridad.

| Campo |
|--------|
| id |
| document_version_id |
| algorithm |
| hash |

Algoritmos

```

SHA256

SHA512

```

---

## ocr_results

Resultado OCR.

| Campo |
|--------|
| id |
| document_id |
| provider |
| confidence |
| extracted_data JSONB |
| processed_at |

Ejemplo JSON

```

{

"name":"Juan",

"document":"1234567",

"birth_date":"1994-02-10"

}

```

---

## document_validations

Resultado de validaciones.

| Campo |
|--------|
| id |
| document_id |
| validation_type |
| status |
| observations |
| validated_by |
| validated_at |

Tipos

```

OCR

MANUAL

AI

EXTERNAL

```

---

## biometric_validations

Reconocimiento facial.

| Campo |
|--------|
| id |
| customer_id |
| selfie_document_id |
| confidence |
| provider |
| result |
| validated_at |

---

## liveness_validations

Prueba de vida.

| Campo |
|--------|
| id |
| customer_id |
| video_document_id |
| result |
| confidence |
| provider |

---

## electronic_signatures

Firmas electrónicas.

| Campo |
|--------|
| id |
| customer_id |
| document_id |
| signed_at |
| provider |
| certificate |
| signature_hash |

---

## document_shares

Compartición segura.

| Campo |
|--------|
| id |
| document_id |
| token |
| expires_at |
| downloaded |

---

## document_audit

Auditoría.

| Campo |
|--------|
| id |
| document_id |
| action |
| user_id |
| ip |
| created_at |

---

# 9. Reglas

Nunca modificar un documento.

Siempre crear una nueva versión.

Nunca eliminar documentos financieros.

Todo documento tendrá hash criptográfico.

Todo documento deberá estar almacenado cifrado.

Las URLs de descarga nunca serán públicas.

Utilizar URLs firmadas con expiración.

Los documentos sensibles deberán registrar cada acceso.

Toda validación debe quedar auditada.

---

# OCR

El sistema deberá soportar múltiples proveedores.

Ejemplos

Google Vision

AWS Textract

Azure Document Intelligence

OpenAI Vision

Modelos locales

---

# IA

La IA podrá validar automáticamente:

• Documento borroso

• Documento cortado

• Documento vencido

• Nombre inconsistente

• Documento duplicado

• Selfie incorrecta

• Posible fraude

---

# Storage

El almacenamiento será desacoplado.

La aplicación nunca accederá directamente a S3.

Siempre utilizar un servicio de Storage.

---

# Seguridad

Todos los archivos:

• cifrados

• versionados

• auditados

• protegidos

• con hash

• con URL temporal

---

# Tablas Totales

1. documents

2. document_categories

3. document_types

4. document_versions

5. document_storage

6. document_hashes

7. ocr_results

8. document_validations

9. biometric_validations

10. liveness_validations

11. electronic_signatures

12. document_shares

13. document_audit

Total

13 tablas

---

# Próximo Documento

DAD-07

Credit Evaluation Engine

Se construirá el motor completo de evaluación financiera:

• Motor de reglas

• IA

• Score

• Riesgo

• Fraude

• Endeudamiento

• Capacidad de pago

• Variables financieras

• Recomendaciones automáticas

• Explicabilidad de decisiones (Explainable AI)

Este será el cerebro de la fintech.