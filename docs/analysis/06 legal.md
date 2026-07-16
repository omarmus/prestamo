# Sistema Fintech de Préstamos Digitales para Bolivia
# Software Design Document (SDD)

# Parte VI
# Marco Legal y Regulatorio para una Fintech de Préstamos en Bolivia

Versión 1.0

---

# Tabla de Contenido

1. Introducción
2. Marco Normativo
3. Autoridades Reguladoras
4. ¿Necesitamos una licencia?
5. ¿Qué tipo de empresa debemos constituir?
6. Empresas de Tecnología Financiera (ETF)
7. Regulación de Plataformas de Financiamiento
8. Protección al Consumidor Financiero
9. Prevención de Lavado de Dinero (AML)
10. Protección de Datos
11. Firma Electrónica
12. Contratos Digitales
13. Riesgos Legales
14. Roadmap Legal
15. Recomendaciones

---

# 1. Introducción

Hasta 2025 Bolivia no contaba con una regulación específica para empresas Fintech.

Este escenario cambió con la publicación del:

**Decreto Supremo N.º 5384**

que crea el marco regulatorio para las Empresas de Tecnología Financiera (ETF), otorgando a la Autoridad de Supervisión del Sistema Financiero (ASFI) la facultad de regular y supervisar este tipo de empresas. 

Posteriormente la ASFI emitió el Reglamento para Empresas de Tecnología Financiera y sus modificaciones, definiendo requisitos de funcionamiento, categorías y procedimientos de autorización. 

---

# 2. Marco Normativo

La plataforma deberá considerar principalmente:

## Constitución Política del Estado

Protección de consumidores.

Derechos económicos.

Protección de datos personales.

---

## Ley N° 393

Ley de Servicios Financieros.

Es la principal norma del sistema financiero boliviano.

---

## Decreto Supremo N.º 5384

Regula la constitución y funcionamiento de las Empresas de Tecnología Financiera (ETF). 
---

## Reglamento para Empresas de Tecnología Financiera

Emitido por ASFI.

Define:

- categorías
- requisitos
- autorizaciones
- supervisión
- obligaciones
- controles internos 


---

## Normativa UIF

Prevención de legitimación de ganancias ilícitas.

---

## Código de Comercio

Constitución de sociedades.

---

## Código Civil

Contratos.

Obligaciones.

---

## Código Penal

Delitos financieros.

Fraude.

Suplantación.

Lavado de dinero.

---

# 3. Autoridades Reguladoras

## ASFI

Autoridad de Supervisión del Sistema Financiero.

Será la principal autoridad reguladora.

Funciones

- autorizar
- supervisar
- fiscalizar
- sancionar

---

## Banco Central de Bolivia

Participa principalmente en:

- sistema de pagos
- medios electrónicos
- infraestructura financiera

---

## UIF

Unidad de Investigaciones Financieras.

Control AML.

Prevención de lavado.

---

## Impuestos Nacionales

Facturación.

Tributación.

---

# 4. ¿Necesitamos una licencia?

Esta es probablemente la decisión más importante del proyecto.

Dependerá del modelo de negocio.

---

## Escenario A

La empresa presta dinero propio.

En este caso es muy probable que se requiera cumplir con el marco regulatorio aplicable y obtener las autorizaciones correspondientes de la ASFI, según el tipo de actividad y la estructura del negocio. 

---

## Escenario B

La empresa únicamente desarrolla software.

No presta dinero.

No administra fondos.

No recibe depósitos.

Solo ofrece tecnología.

En este escenario el análisis regulatorio puede ser diferente, aunque igualmente deberá revisarse la normativa ETF aplicable.

---

## Escenario C

Marketplace.

Conecta inversionistas.

Conecta financieras.

Conecta clientes.

La regulación dependerá del modelo operativo.

---

# 5. Constitución de la Empresa

Inicialmente recomendamos constituir una:

Sociedad de Responsabilidad Limitada (SRL)

o

Sociedad Anónima (SA)

dependiendo del plan de inversión.

---

Posteriormente

registrar la empresa como

Empresa de Tecnología Financiera

si corresponde al modelo de negocio.

---

# 6. Empresas de Tecnología Financiera (ETF)

La regulación reconoce varias categorías de servicios.

Entre ellas:

- plataformas de financiamiento
- plataformas de pago
- soluciones blockchain
- tecnologías empresariales
- otras categorías que ASFI incorpore posteriormente


Nuestro proyecto encaja principalmente dentro de:

## Plataforma de Financiamiento

---

# 7. ¿Qué actividades realizará nuestra plataforma?

Nuestra fintech ofrecerá:

✔ Captación digital.

✔ Evaluación.

✔ Gestión documental.

✔ IA.

✔ CRM.

✔ Administración de préstamos.

✔ Cobranza.

✔ Portal del cliente.

Por lo tanto deberá analizar cuidadosamente el alcance regulatorio antes de iniciar operaciones comerciales.

---

# 8. Protección al Consumidor

El sistema deberá cumplir principios de transparencia.

Siempre mostrar:

Monto solicitado.

Intereses.

Comisiones.

Gastos.

Cronograma.

Saldo.

Mora.

Nunca ocultar costos.

---

También deberá permitir

- reclamos
- consultas
- historial
- contratos

---

# 9. Prevención de Lavado de Dinero (AML)

La plataforma deberá incorporar desde el diseño:

## KYC

Know Your Customer.

---

Verificación de identidad.

---

Registro documental.

---

Monitoreo de operaciones.

---

Alertas.

---

Auditoría.

---

Bitácora.

---

Reportes regulatorios cuando sean exigibles.

---

# 10. KYC

El sistema deberá validar

Nombre.

CI.

Fecha nacimiento.

Fotografía.

Selfie.

Prueba de vida (fase futura).

---

# 11. Documentación

Todos los documentos deberán conservarse.

Ejemplo

Carnet.

Contrato.

Extractos.

Comprobantes.

Conversaciones.

Logs.

---

# 12. Firma Electrónica

El contrato deberá firmarse digitalmente.

Recomendación

Integrar posteriormente un proveedor certificado.

El sistema deberá permitir:

- generación PDF
- hash
- sello de tiempo
- auditoría

---

# 13. Protección de Datos

Toda información será considerada confidencial.

Se recomienda:

Encriptación.

Backups.

Control acceso.

Logs.

MFA.

Tokenización.

---

Documentos

Encriptados.

---

Contraseñas

Argon2.

---

# 14. Auditoría

Toda acción deberá registrarse.

Ejemplo

```
Usuario

↓

Acción

↓

Fecha

↓

IP

↓

Resultado
```

Nunca eliminar auditoría.

---

# 15. Riesgos Legales

Los principales riesgos serán:

Fraude documental.

Suplantación.

Lavado.

Financiamiento ilícito.

Incumplimiento regulatorio.

Incumplimiento tributario.

Incumplimiento contractual.

---

# 16. Roadmap Legal

## Etapa 1

Constitución empresa.

---

## Etapa 2

Análisis regulatorio.

---

## Etapa 3

Revisión jurídica del modelo.

---

## Etapa 4

Adecuación normativa.

---

## Etapa 5

Obtención de autorizaciones.

---

## Etapa 6

Inicio operaciones.

---

# 17. Arquitectura orientada al cumplimiento

La arquitectura técnica deberá incluir módulos específicos para cumplimiento normativo.

```
Compliance

↓

KYC

↓

AML

↓

Auditoría

↓

Documentos

↓

Motor Reglas

↓

Reportes
```

---

# 18. Checklist Legal

Antes del lanzamiento deberá verificarse:

☐ Empresa constituida.

☐ NIT.

☐ Matrícula de Comercio.

☐ Cuenta bancaria empresarial.

☐ Análisis regulatorio realizado.

☐ Contratos revisados.

☐ Políticas de privacidad.

☐ Términos y condiciones.

☐ Política AML/KYC.

☐ Manual de Seguridad.

☐ Manual de Auditoría.

☐ Política de conservación documental.

☐ Estrategia de respuesta a incidentes.

---

# 19. Recomendaciones Estratégicas

## No iniciar como banco

El objetivo inicial debe ser construir una plataforma tecnológica.

---

## Construir el software primero

El software puede desarrollarse completamente antes de solicitar autorizaciones regulatorias para operar comercialmente.

---

## Diseñar con Compliance desde el día uno

Agregar cumplimiento después suele ser costoso.

Debe incorporarse desde la arquitectura.

---

## Contratar asesoría especializada

Antes del lanzamiento comercial es indispensable contar con abogados especializados en regulación financiera boliviana para validar:

- estructura societaria
- licencias
- contratos
- políticas AML
- cumplimiento ASFI
- aspectos tributarios

---

# Conclusiones

Bolivia cuenta desde 2025 con un marco regulatorio específico para Empresas de Tecnología Financiera, lo que representa un avance importante para el desarrollo de este tipo de proyectos. El Decreto Supremo N.º 5384 y el Reglamento de la ASFI establecen el marco de autorización, supervisión y funcionamiento de las ETF.

La recomendación para este proyecto es desarrollar la plataforma desde el inicio con una arquitectura orientada al cumplimiento (Compliance by Design), incorporando módulos de KYC, AML, auditoría, gestión documental y seguridad, de manera que la adecuación regulatoria sea un proceso de configuración y validación, y no una reconstrucción del sistema.

Finalmente, antes de iniciar operaciones con clientes reales y desembolsar créditos, deberá realizarse un análisis jurídico específico del modelo de negocio para confirmar las autorizaciones requeridas y garantizar el cumplimiento integral de la normativa vigente en Bolivia.