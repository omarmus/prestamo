# Data Architecture Document (DAD)

# Parte XVI

# Fraud Detection Platform

Versión 1.0

---

# Objetivo

Detectar fraude antes, durante y después del otorgamiento del préstamo.

No evalúa riesgo financiero.

Evalúa riesgo de fraude.

---

# Arquitectura

```

Solicitud

↓

Identity Engine

↓

Device Engine

↓

Behavior Engine

↓

Network Engine

↓

AI Fraud Engine

↓

Fraud Score

↓

Decision Engine

```

---

# Aggregate Roots

FraudCase

FraudEvaluation

DeviceFingerprint

IdentityProfile

---

# Motores

Identity Engine

Device Engine

Document Engine

Behavior Engine

Velocity Engine

Network Engine

Blacklist Engine

AI Fraud Engine

---

# Entidades

FraudCase

FraudEvaluation

FraudRule

FraudAlert

Device

DeviceFingerprint

IPAddress

Location

BehaviorProfile

IdentityProfile

Blacklist

Watchlist

VelocityCheck

FraudHistory

---

# Estados

FraudStatus

```

PENDING

CLEAR

REVIEW

BLOCKED

CONFIRMED

FALSE_POSITIVE

```

---

AlertSeverity

```

LOW

MEDIUM

HIGH

CRITICAL

```

---

# Modelo de Datos

## fraud_cases

Caso principal.

---

## fraud_evaluations

Resultado completo.

Campos

Fraud Score

Risk Level

Recommendation

Confidence

---

## fraud_rules

Reglas.

Ejemplos

Documento duplicado

Más de 3 préstamos

Mismo teléfono

Mismo dispositivo

Mismo IP

VPN

Proxy

Tor

Root

Emulador

---

## fraud_alerts

Alertas.

---

## devices

Dispositivo.

Campos

OS

Versión

Marca

Modelo

Navegador

Idioma

Zona horaria

Resolución

---

## device_fingerprints

Fingerprint.

Hash único.

---

## ip_addresses

Historial.

ASN

Proveedor

VPN

Proxy

Tor

País

Ciudad

---

## locations

Ubicación.

GPS

Ciudad

Departamento

---

## behavior_profiles

Patrones.

Velocidad de escritura

Tiempo entre clics

Tiempo formulario

Copiar/Pegar

Mouse

Touch

---

## identity_profiles

Perfil.

Documentos

Emails

Teléfonos

Selfies

Cuentas bancarias

---

## velocity_checks

Ejemplos

5 solicitudes en 10 minutos

3 teléfonos

2 dispositivos

10 OTP

---

## blacklists

Lista negra.

---

## watchlists

Observación.

---

## fraud_history

Historial.

Nunca eliminar.

---

# Eventos

FraudDetected

FraudBlocked

AlertGenerated

DeviceRegistered

VelocityExceeded

IdentityMatched

BlacklistMatched

---

# IA

La IA podrá detectar

Patrones

Redes

Anomalías

Comportamientos

Fraudes similares

---

# KPIs

Fraudes

Falsos positivos

Tiempo detección

Fraudes evitados

Pérdidas evitadas

Score promedio

---

# Reglas

Nunca eliminar evidencia.

Nunca borrar fingerprint.

Toda evaluación queda registrada.

Toda alerta tiene prioridad.

Todo fraude genera auditoría.

---

# Próximo Documento

DAD-17

Data Warehouse & Business Intelligence