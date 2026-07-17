# Data Architecture Document (DAD)

# Parte XXXVII

# Identity & KYC Platform

Versión 1.0

---

# Tabla de Contenido

1. Objetivo
2. Arquitectura
3. Registro usuario
4. Authentication
5. Documento identidad
6. OCR Platform
7. Face Verification
8. KYC Decision Engine
9. Antifraude identidad
10. Modelo de Datos
11. Eventos
12. KPIs

---

# 1. Objetivo

Crear una plataforma segura para registrar y validar identidad de clientes.

---

# 2. Arquitectura

```

User

 |

Registration

 |

Identity Service

 |

KYC Service

 |

Verification Providers

 |

Verified Customer


```

---

# 3. Registro Usuario

Datos iniciales:

- teléfono;
- nombre;
- email opcional;
- país;
- aceptación términos.

---

# Identificador principal

Recomendado:

Número celular.

Motivo:

Bolivia tiene alta penetración WhatsApp.

---

# 4. Authentication

Métodos:

---

# OTP SMS

Código temporal.

---

# WhatsApp OTP

Alternativa.

---

# Biometría

Para app móvil futura.

---

# Tokens

Usar:

JWT

Refresh Tokens

Device Binding


---

# 5. Documento Identidad

Bolivia:

Documento principal:

Cédula de Identidad.


---

Proceso:

```

Foto documento

↓

Calidad imagen

↓

OCR

↓

Extracción datos

↓

Validación


```

---

# Datos extraídos

- nombre;
- apellido;
- número documento;
- fecha nacimiento;
- fotografía.

---

# 6. OCR Platform

Responsable:

Extraer información documentos.

---

Opciones:

Cloud:

- AWS Textract
- Google Vision
- Azure AI Vision

Open Source:

- Tesseract
- PaddleOCR


---

# 7. Face Verification

Proceso:

```

Documento foto

        +

Selfie


        ↓


Comparación facial


        ↓


Resultado


```

---

# Liveness Detection

Evita:

- fotos impresas;
- videos;
- deepfake básico.

---

# 8. KYC Decision Engine

Resultado:

```

APPROVED

REVIEW

REJECTED


```

---

# Factores:

Documento válido.

Edad.

Coincidencia facial.

Duplicados.

Riesgo fraude.

---

# 9. Antifraude Identidad

Detectar:

---

## Documento repetido

Misma CI múltiples cuentas.

---

## Teléfono repetido

Muchas cuentas.

---

## Dispositivo

Múltiples identidades.

---

## Ubicación

Patrones sospechosos.

---

# 10. Modelo de Datos

---

# identities

Identidades principales.

---

# identity_documents

Documentos.

---

# document_verifications

Resultados validación.

---

# ocr_results

Resultados OCR.

---

# biometric_checks

Pruebas biométricas.

---

# facial_matches

Comparaciones faciales.

---

# authentication_methods

Métodos login.

---

# otp_requests

Solicitudes OTP.

---

# user_devices

Dispositivos.

---

# kyc_cases

Casos KYC.

---

# kyc_decisions

Decisiones.

---

# identity_risk_flags

Alertas identidad.

---

# consent_records

Consentimientos.

---

# Modelo Total

1 identities

2 identity_documents

3 document_verifications

4 ocr_results

5 biometric_checks

6 facial_matches

7 authentication_methods

8 otp_requests

9 user_devices

10 kyc_cases

11 kyc_decisions

12 identity_risk_flags

13 consent_records


Total:

13 tablas

---

# 11. Eventos

UserRegistered

OTPRequested

OTPVerified

DocumentUploaded

OCRCompleted

FaceVerified

KYCApproved

KYCRejected

IdentityRiskDetected


---

# 12. KPIs

Tiempo KYC.

Tasa aprobación.

Errores OCR.

Fraude detectado.

Abandono proceso.

---

# Tecnologías

## Backend

NestJS

---

## Storage

S3 compatible

---

## OCR

PaddleOCR

Cloud Vision

---

## Biometrics

Proveedor especializado.

---

## Security

Encryption

Secrets Manager

Audit Logs


---

# Próximo Documento

DAD-38

Partner & Ecosystem Platform

Incluye:

- alianzas comerciales;
- comercios;
- promotores;
- referidos;
- APIs externas;
- modelo marketplace financiero.