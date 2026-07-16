# Sistema Fintech de Préstamos Digitales para Bolivia
## Software Design Document (SDD)

# Parte II
# Análisis Funcional del Sistema

Versión 1.0

---

# Tabla de Contenido

1. Objetivos Funcionales
2. Actores del Sistema
3. Flujo General del Negocio
4. Módulos del Sistema
5. Flujo Completo del Cliente
6. Flujo Interno de la Empresa
7. Estados de una Solicitud
8. Estados del Préstamo
9. Casos de Uso
10. Requisitos Funcionales
11. Requisitos No Funcionales
12. Roadmap del MVP

---

# 1. Objetivos Funcionales

El sistema administrará completamente el ciclo de vida de un préstamo digital.

Desde que un usuario conoce la empresa hasta que termina de pagar su crédito.

El objetivo es minimizar el trabajo manual mediante automatización e Inteligencia Artificial.

---

# 2. Actores del Sistema

## Cliente

Solicita préstamos.

Puede:

- registrarse
- conversar por WhatsApp
- enviar documentos
- consultar su préstamo
- pagar cuotas
- solicitar renovación

---

## Bot IA

Es el primer contacto.

Responsabilidades:

- responder consultas
- registrar solicitudes
- solicitar documentos
- validar información
- responder preguntas frecuentes
- generar tickets
- enviar recordatorios

---

## Analista

Responsable de evaluar solicitudes.

Puede:

- revisar documentos
- aprobar
- rechazar
- solicitar información adicional
- modificar condiciones

---

## Supervisor

Puede supervisar analistas.

Funciones:

- aprobar montos altos
- revisar excepciones
- modificar políticas
- generar reportes

---

## Cobranza

Gestiona clientes con mora.

Puede:

- llamar clientes
- enviar mensajes
- registrar compromisos
- reprogramar pagos

---

## Administrador

Tiene acceso completo.

Gestiona:

- usuarios
- configuración
- tasas
- productos
- permisos
- reglas
- auditoría

---

# 3. Flujo General del Negocio

```text
Publicidad

↓

Landing

↓

WhatsApp

↓

Bot IA

↓

Solicitud

↓

Documentos

↓

OCR

↓

Validación

↓

Motor de Reglas

↓

Score IA

↓

Analista

↓

Aprobación

↓

Contrato

↓

Firma

↓

Desembolso

↓

Pagos

↓

Cobranza

↓

Renovación
```

---

# 4. Módulos del Sistema

La plataforma estará compuesta por módulos independientes.

---

# Módulo 1

# Landing

Objetivo:

Captar clientes.

Contenido:

- Hero
- Beneficios
- Simulador
- Requisitos
- Preguntas frecuentes
- Testimonios
- Contacto

Botón principal

```text
Solicitar préstamo
```

Abre WhatsApp.

---

# Módulo 2

# WhatsApp

Será el principal canal de atención.

Funciones

- atención automática
- registro
- carga documentos
- consultas
- recordatorios
- pagos
- renovación

Ejemplo

```
Hola

Necesito un préstamo
```

↓

```
¿Cuánto dinero necesitas?
```

↓

```
5000 Bs
```

↓

```
¿En cuántos meses?
```

↓

```
6
```

↓

La solicitud queda registrada.

---

# Módulo 3

# Gestión de Prospectos

Antes de ser cliente.

Información

- nombre
- teléfono
- origen
- campaña
- estado

Estados

- nuevo
- contactado
- interesado
- solicitud creada
- descartado

---

# Módulo 4

# Clientes

Cada cliente tendrá una ficha completa.

Datos

Información personal

Información laboral

Ingresos

Referencias

Documentos

Dirección

Historial

Score

Observaciones

Auditoría

---

# Módulo 5

# Documentos

Documentos soportados

CI

Selfie

Factura de servicio

Boleta de pago

Extracto bancario

Contrato

Comprobantes

Cada documento tendrá

- versión
- fecha
- estado
- OCR
- validación

---

# Módulo 6

# OCR

Lee automáticamente

Nombre

CI

Fecha nacimiento

Dirección

Número documento

Fecha emisión

Compara con datos registrados.

---

# Módulo 7

# Motor de Reglas

El corazón de la plataforma.

Ejemplo

```
Edad menor 21

↓

Solicitar garante

-------------------

Ingreso menor Bs 2.000

↓

Revisión Manual

-------------------

Score mayor 90

↓

Aprobación Automática

-------------------

Cliente en mora

↓

Rechazar
```

Todo configurable.

---

# Módulo 8

# IA

La IA trabajará durante todo el proceso.

Funciones

Clasificación

Resumen documentos

Resumen conversaciones

Predicción mora

Análisis riesgo

Generación contratos

Sugerencias analista

---

# Módulo 9

# Solicitudes

Cada solicitud posee

Número

Cliente

Monto

Plazo

Producto

Estado

Documentos

Observaciones

Historial

---

# Módulo 10

# Evaluación

El analista visualizará

Datos personales

Documentos

Historial

Resultado OCR

Score

Resultado IA

Resultado reglas

Comentarios

Todo desde una única pantalla.

---

# Módulo 11

# Préstamos

Una vez aprobado.

Se genera

Número

Capital

Interés

Comisiones

Cronograma

Saldo

Estado

---

# Módulo 12

# Cronograma

Genera automáticamente

Cuotas

Capital

Interés

Seguro

Mora

Saldo

---

# Módulo 13

# Pagos

Registra

Fecha

Monto

Capital

Interés

Mora

Comprobante

Método pago

Caja

---

# Módulo 14

# Cobranza

Uno de los módulos más importantes.

Clasificación

Por vencer

Vence hoy

1 día

7 días

15 días

30 días

60 días

90 días

Cada gestor tendrá una agenda.

---

# Módulo 15

# CRM

Permitirá

Seguimiento

Notas

Llamadas

Correos

WhatsApp

Visitas

Compromisos

---

# Módulo 16

# Campañas

Administrará

Facebook

TikTok

Instagram

Google

Referidos

Permitiendo conocer

Costo adquisición

Conversión

ROI

---

# Módulo 17

# Reportes

Dashboard

Capital colocado

Intereses

Ganancia

Mora

Clientes

Cobranza

Desembolsos

Evaluaciones

Usuarios

---

# Módulo 18

# Configuración

Productos

Tasas

Usuarios

Roles

Permisos

Parámetros

Reglas

Sucursales

---

# Módulo 19

# Auditoría

Todo queda registrado.

Ejemplo

```
Juan aprobó préstamo

Pedro modificó interés

María eliminó documento

Carlos inició sesión
```

---

# 5. Flujo Completo del Cliente

```text
Landing

↓

WhatsApp

↓

Bot IA

↓

Solicitud

↓

Documentos

↓

Validación

↓

Evaluación

↓

Aprobación

↓

Firma

↓

Desembolso

↓

Pago cuotas

↓

Renovación
```

---

# 6. Flujo Interno

```text
Nueva solicitud

↓

OCR

↓

Motor reglas

↓

IA

↓

Analista

↓

Supervisor

↓

Contrato

↓

Firma

↓

Tesorería

↓

Desembolso

↓

Seguimiento

↓

Cobranza

↓

Cierre
```

---

# 7. Estados de la Solicitud

```text
Nueva

↓

Pendiente documentos

↓

En evaluación

↓

Observada

↓

Aprobada

↓

Rechazada

↓

Cancelada
```

---

# 8. Estados del Préstamo

```text
Pendiente firma

↓

Pendiente desembolso

↓

Activo

↓

Al día

↓

Mora

↓

Judicial

↓

Cancelado

↓

Castigado
```

---

# 9. Casos de Uso

## Cliente

Solicitar préstamo

Consultar estado

Subir documentos

Firmar contrato

Consultar cuotas

Pagar

Renovar préstamo

---

## Analista

Evaluar solicitud

Solicitar documentos

Aprobar

Rechazar

Consultar historial

---

## Supervisor

Aprobar excepciones

Modificar políticas

Gestionar usuarios

---

## Cobranza

Registrar llamadas

Registrar pagos

Enviar recordatorios

Programar visitas

---

## Administrador

Configurar sistema

Gestionar productos

Gestionar tasas

Configurar reglas

Administrar IA

Administrar auditoría

---

# 10. Requisitos Funcionales

RF-001

El cliente podrá solicitar préstamos desde WhatsApp.

RF-002

El sistema registrará automáticamente la solicitud.

RF-003

El sistema validará documentos mediante OCR.

RF-004

La IA analizará la información.

RF-005

El motor de reglas evaluará la solicitud.

RF-006

El analista podrá aprobar o rechazar.

RF-007

El sistema generará el contrato.

RF-008

El cliente firmará electrónicamente.

RF-009

Se generará automáticamente el cronograma.

RF-010

El sistema realizará seguimiento del préstamo.

RF-011

La cobranza enviará recordatorios automáticos.

RF-012

Todo cambio será auditado.

---

# 11. Requisitos No Funcionales

- Arquitectura modular.
- Escalable horizontalmente.
- API First.
- Mobile First.
- Alta disponibilidad.
- Tiempo de respuesta menor a 2 segundos para operaciones comunes.
- Cifrado de documentos.
- Auditoría completa.
- Backups automáticos.
- Alta observabilidad.
- Preparado para múltiples entidades financieras (multi-tenant).

---

# 12. Roadmap del MVP

## Fase 1

Landing.

WhatsApp.

Registro.

Panel administrativo básico.

Clientes.

Solicitudes.

---

## Fase 2

OCR.

Evaluación.

Motor de reglas.

Contratos.

Firma electrónica.

---

## Fase 3

Préstamos.

Cronograma.

Pagos.

Cobranza.

Dashboard.

---

## Fase 4

IA.

Predicción de mora.

CRM.

Campañas.

Automatizaciones.

---

## Fase 5

Aplicación móvil.

Portal del cliente.

Marketplace financiero.

API pública.

Multiempresa (SaaS).

---

# Conclusión

El análisis funcional define una plataforma que va mucho más allá de un sistema de préstamos tradicional. La solución cubre el ciclo completo de originación, evaluación, administración, cobranza y fidelización, con una arquitectura preparada para incorporar inteligencia artificial, automatización y operación multiempresa.

Esta base funcional servirá como insumo para la siguiente etapa del proyecto, donde se detallará la arquitectura técnica, los dominios DDD, los microservicios, el modelo de datos y la infraestructura necesaria para soportar la plataforma a gran escala.
