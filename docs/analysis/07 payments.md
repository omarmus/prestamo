# Sistema Fintech de Préstamos Digitales para Bolivia
# Software Design Document (SDD)

# Parte VII
# Sistema de Pagos QR e Integración Bancaria

Versión 1.0

---

# Tabla de Contenido

1. Introducción
2. Ecosistema de Pagos en Bolivia
3. QR BCB Bolivia
4. QR Estático vs QR Dinámico
5. Arquitectura propuesta
6. Flujo de Cobro
7. APIs Bancarias
8. Payment Service
9. Modelo de Datos
10. Conciliación Bancaria
11. Seguridad
12. Roadmap

---

# 1. Introducción

Bolivia posee uno de los sistemas de pagos QR más desarrollados de Latinoamérica.

El Banco Central implementó el estándar:

QR BCB Bolivia

que permite la interoperabilidad entre prácticamente todas las entidades financieras.

Esto significa que un cliente del Banco Mercantil puede pagar un QR generado por BCP, Banco Unión, BancoSol u otra entidad participante utilizando su propia aplicación bancaria. El estándar fue diseñado para unificar el ecosistema de pagos digitales del país.

---

# 2. ¿Qué es QR BCB Bolivia?

Es el estándar oficial de pagos inmediatos.

Características

- interoperable
- disponible 24/7
- tiempo real
- transferencias
- pagos comercio
- comercio electrónico
- pago servicios
- pago de préstamos

Nuestro sistema utilizará este estándar como mecanismo principal para cobrar cuotas de préstamos. El QR contiene la información necesaria para iniciar el pago y es procesado por la infraestructura del sistema financiero nacional.

---

# 3. QR Estático

Siempre representa la misma cuenta.

Ejemplo

Empresa

Cuenta

123456

Todos los clientes pagan al mismo QR.

Problemas

- difícil conciliación
- requiere ingresar monto manualmente
- mayor riesgo de errores

No recomendado para préstamos.

---

# 4. QR Dinámico

Cada pago genera un nuevo QR.

Ejemplo

Cliente

Juan Pérez

Cuota

5

Monto

Bs 532.45

Vence

15/08/2026

Referencia

LOAN-000145-INST-05

Expira

24 horas

Cada QR identifica una obligación específica.

Este es el modelo recomendado.

---

# 5. Flujo Propuesto

```
Cliente

↓

WhatsApp

↓

Solicita pagar

↓

Payment Service

↓

Banco

↓

Genera QR

↓

Cliente escanea

↓

Banco procesa

↓

Webhook

↓

Payment Service

↓

Loan Service

↓

Cuota Pagada
```

---

# 6. Arquitectura

```
Frontend

↓

Payment Service

↓

────────────────────────────

BCP Adapter

BNB Adapter

Banco Unión Adapter

Mercantil Adapter

BancoSol Adapter

────────────────────────────

↓

QR BCB Bolivia
```

Cada banco implementará un adaptador independiente.

---

# 7. Payment Service

Responsabilidades

Generar QR.

Consultar estado.

Registrar pagos.

Conciliar pagos.

Notificar.

Emitir eventos.

Nunca contendrá lógica del préstamo.

---

# 8. APIs Bancarias

Varios bancos bolivianos ya ofrecen APIs para:

- generar QR dinámicos
- consultar pagos
- recibir confirmaciones
- integración con comercio electrónico

La disponibilidad, requisitos de acceso y contratos dependen de cada entidad financiera. En la práctica será necesario firmar convenios comerciales con el banco elegido para obtener credenciales de producción.

---

# 9. Flujo de Cobranza

```
Cliente

↓

Ver cuota

↓

Botón

"Pagar"

↓

Generar QR

↓

Escanear

↓

Pago

↓

Banco confirma

↓

Webhook

↓

Actualizar préstamo

↓

Enviar comprobante
```

Todo el proceso puede completarse en segundos.

---

# 10. Modelo de Datos

PaymentRequest

- id
- loanId
- installmentId
- amount
- currency
- expiration
- qrReference
- bankProvider
- status

Payment

- id
- transactionId
- bank
- amount
- date
- reference
- qrReference
- receipt

---

# 11. Conciliación

La conciliación será automática.

Cada pago será comparado con:

Monto.

Referencia.

Cliente.

Préstamo.

Cuota.

Estado.

Si todo coincide:

↓

Pago confirmado.

En caso contrario:

↓

Revisión manual.

---

# 12. Webhooks

Los bancos enviarán notificaciones.

Ejemplo

```
PaymentCompleted
```

↓

Payment Service

↓

Loan Service

↓

Installment Paid

↓

Notification Service

↓

WhatsApp

```
Pago recibido correctamente.

Gracias.
```

---

# 13. Seguridad

Todos los webhooks deberán validarse mediante:

- firma digital
- IP permitidas
- tokens
- HTTPS
- idempotencia

Cada evento deberá registrarse en auditoría.

---

# 14. Requisitos Legales

La integración con APIs bancarias generalmente requiere:

- Empresa legalmente constituida.
- NIT.
- Cuenta bancaria empresarial.
- Contrato con el banco.
- Homologación técnica.
- Cumplimiento de requisitos de seguridad.
- En algunos casos, validación del modelo de negocio y cumplimiento de la regulación aplicable.

---

# 15. Roadmap

Fase 1

Integración con un solo banco.

---

Fase 2

Dos bancos.

---

Fase 3

Conciliación automática.

---

Fase 4

Múltiples bancos.

---

Fase 5

Motor de selección automática del banco.

---

# 16. Recomendación Arquitectónica

No acoplar el sistema a un banco específico.

Toda la plataforma únicamente interactuará con:

Payment Service

El Payment Service decidirá qué adaptador utilizar.

Esto permitirá:

- cambiar de banco sin afectar el resto del sistema
- negociar mejores condiciones comerciales
- agregar nuevos bancos rápidamente
- soportar múltiples entidades financieras en el futuro

---

# Conclusiones

El sistema de pagos debe diseñarse como un dominio independiente dentro de la arquitectura. Aprovechar el estándar **QR BCB Bolivia** y las APIs bancarias existentes permitirá ofrecer pagos interoperables, conciliación automática y una excelente experiencia para el cliente, evitando desarrollar un esquema propietario y alineándose con la infraestructura oficial del país.