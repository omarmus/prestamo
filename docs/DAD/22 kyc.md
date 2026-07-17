# Data Architecture Document (DAD)

# Parte XXII

# KYC & Identity Verification Platform

Versión 1.0

---

# Tabla de Contenido

1. Objetivo
2. Arquitectura
3. Flujo KYC
4. Tipos de Validación
5. Aggregate Roots
6. Estados
7. Entidades
8. Modelo de Datos
9. Integraciones
10. Reglas
11. KPIs

---

# 1. Objetivo

Gestionar la identificación y validación de clientes antes de otorgar productos financieros.

---

# 2. Arquitectura

```

Customer

↓

KYC Service

↓

Document Engine

↓

OCR Engine

↓

Biometric Engine

↓

Risk Engine

↓

KYC Decision

```

---

# 3. Flujo KYC

## Paso 1

Crear identidad.

Cliente ingresa:

- Nombre
- Carnet
- Fecha nacimiento
- Teléfono

---

## Paso 2

Capturar documento.

Tipos:

- Cédula identidad
- Pasaporte
- Licencia

---

## Paso 3

OCR

Extraer:

- Nombre completo
- Número documento
- Fecha nacimiento
- Fecha expiración

---

## Paso 4

Validación documental

Analiza:

- Alteraciones
- Calidad imagen
- Seguridad documento

---

## Paso 5

Selfie

Captura rostro.

---

## Paso 6

Liveness

Verifica que sea una persona real.

Ejemplos:

- Movimiento cabeza
- Parpadeo
- Video corto

---

## Paso 7

Face Matching

Comparación:

Documento

vs

Selfie

---

## Paso 8

Resultado

```
APPROVED

REVIEW

REJECTED

```

---

# 4. Tipos de Validación

---

# Identity Verification

Comprueba:

Quién es.

---

# Document Verification

Comprueba:

Documento válido.

---

# Biometric Verification

Comprueba:

Rostro.

---

# Address Verification

Opcional:

Dirección.

---

# Employment Verification

Opcional:

Trabajo.

---

# 5. Aggregate Roots

KYCProfile

VerificationCase

IdentityDocument

BiometricCheck

---

# 6. Estados

KYCStatus

```

CREATED

DOCUMENT_PENDING

DOCUMENT_REVIEW

BIOMETRIC_PENDING

PROCESSING

APPROVED

REJECTED

EXPIRED

```

---

DocumentStatus

```

UPLOADED

PROCESSING

VALID

INVALID

```

---

# 7. Entidades

KYCProfile

VerificationCase

IdentityDocument

DocumentExtraction

SelfieCapture

BiometricCheck

LivenessCheck

IdentityMatch

KYCScore

VerificationProvider

VerificationAttempt

---

# 8. Modelo de Datos

---

# kyc_profiles

Perfil KYC.

Campos:

id

customer_id

status

score

verified_at

---

# verification_cases

Cada proceso de validación.

---

# identity_documents

Documentos.

Campos:

type

number_hash

country

front_image

back_image

status

---

# document_extractions

Datos extraídos OCR.

Ejemplo:

```
Nombre

Fecha nacimiento

Número documento

```

---

# document_checks

Validaciones.

Ejemplo:

```
Documento borroso

Documento alterado

```

---

# selfie_captures

Selfies.

Campos:

storage_path

quality

created_at

---

# liveness_checks

Prueba vida.

Campos:

method

score

result

---

# biometric_checks

Comparación facial.

Campos:

similarity_score

threshold

result

---

# identity_matches

Comparaciones.

---

# kyc_scores

Resultado.

Ejemplo:

```
Score:

95/100

```

---

# verification_attempts

Intentos.

Importante para fraude.

---

# verification_providers

Proveedores externos.

Ejemplo:

OCR

Biometría

---

# 9. Integraciones

Posibles proveedores:

## OCR

- AWS Textract
- Google Vision
- Azure Document Intelligence
- OpenCV + modelos propios


## Facial

- AWS Rekognition
- Azure Face
- Face++


## Liveness

- Proveedores especializados

---

# Bolivia

Considerar:

- Carnet de Identidad boliviano.
- Calidad variable de fotografías.
- Diferentes formatos.
- Validaciones manuales.

---

# 10. Reglas

Nunca guardar documentos públicos.

Todo documento debe estar cifrado.

Las imágenes deben vivir en almacenamiento privado.

Toda consulta debe quedar auditada.

Los intentos fallidos aumentan riesgo fraude.

Un KYC aprobado puede tener expiración.

---

# Expiración

Ejemplo:

```
KYC aprobado

válido:

12 meses

```

Después:

Nueva validación.

---

# 11. Eventos

KYCStarted

DocumentUploaded

OCRCompleted

BiometricCompleted

KYCApproved

KYCRejected

KYCExpired

---

# 12. KPIs

Tasa aprobación KYC

Tiempo promedio validación

Intentos fallidos

Revisión manual

Costo por verificación

Fraude detectado

---

# Tablas Totales

1 kyc_profiles

2 verification_cases

3 identity_documents

4 document_extractions

5 document_checks

6 selfie_captures

7 liveness_checks

8 biometric_checks

9 identity_matches

10 kyc_scores

11 verification_attempts

12 verification_providers


Total:

12 tablas

---

# Próximo Documento

DAD-23

Digital Contracts Platform

Incluye:

- Contratos préstamo
- Firma electrónica
- Evidencia legal
- Versionamiento
- Plantillas
- Hash documental
- Integración con desembolso