# Data Architecture Document (DAD)

# Parte XLVI

# Product Configuration Engine

Versión 1.0

---

# Tabla de Contenido

1. Objetivo
2. Arquitectura
3. Concepto Product Engine
4. Productos Financieros
5. Reglas de Crédito
6. Motor de Cálculo
7. Tasas e Intereses
8. Comisiones
9. Versionamiento
10. Modelo de Datos
11. Eventos
12. KPIs

---

# 1. Objetivo

Crear un motor configurable para administrar productos financieros sin depender de cambios constantes en desarrollo.

---

# 2. Arquitectura

```

Admin Backoffice

        │

        ▼

Product Configuration Engine


        │


 ┌──────┼────────┐


 ▼      ▼        ▼


Products Rules Calculator


        │


        ▼


Loan Management System


```

---

# 3. Concepto Product Engine

Un producto financiero define:

- cuánto prestar;
- a quién;
- condiciones;
- costos;
- reglas;
- comportamiento.

---

Ejemplo:

Producto:

```
Préstamo Express


Monto:

500 - 5000 Bs


Plazo:

7 - 90 días


Interés:

X%


```

---

# 4. Productos Financieros

El sistema debe soportar múltiples productos.

---

# Producto Express

Características:

- aprobación rápida;
- montos bajos.

---

# Producto Cliente Recurrente

Para clientes con historial.

Características:

- mayor límite;
- menor tasa.

---

# Producto Comercio

Para aliados comerciales.

---

# Producto Nómina

Para empresas.

---

# 5. Reglas de Crédito

Motor de reglas.

Ejemplos:

---

Regla edad:

```

Edad >= 18

Aceptar


```

---

Regla mora:

```

Mora activa

Rechazar


```

---

Regla historial:

```

3 préstamos pagados

Aumentar límite


```

---

# Tipos de reglas

---

## Eligibility Rules

Determinan si aplica.

---

## Approval Rules

Determinan aprobación.

---

## Pricing Rules

Calculan costo.

---

## Limit Rules

Calculan monto máximo.

---

# 6. Motor de Cálculo

Responsable de calcular:

- cuota;
- interés;
- comisión;
- fecha vencimiento.

---

Ejemplo:

Entrada:

```

Monto:

3000


Plazo:

60 días


Tasa:

10%


```

Salida:

```

Cuota:

550


Total:

3300


```

---

# 7. Tasas e Intereses

Debe soportar:

---

Interés fijo.

---

Interés diario.

---

Interés mensual.

---

Interés por riesgo.

---

Interés promocional.

---

# 8. Comisiones

Tipos:

---

Apertura crédito.

---

Seguro.

---

Servicio.

---

Mora.

---

Partner.

---

# 9. Versionamiento

Toda modificación debe crear versión.

Ejemplo:

```

Producto Express

Versión 1

Enero 2026


Versión 2

Marzo 2026


```

Los préstamos antiguos mantienen su versión original.

---

# 10. Modelo de Datos

---

# loan_products

Productos crédito.

---

# product_versions

Versiones producto.

---

# product_rules

Reglas.

---

# rule_conditions

Condiciones.

---

# pricing_models

Modelos cálculo.

---

# interest_rates

Tasas.

---

# fee_definitions

Comisiones.

---

# loan_limits

Límites.

---

# eligibility_criteria

Criterios elegibilidad.

---

# product_channels

Canales disponibles.

---

# Modelo Total

1. loan_products

2. product_versions

3. product_rules

4. rule_conditions

5. pricing_models

6. interest_rates

7. fee_definitions

8. loan_limits

9. eligibility_criteria

10. product_channels


Total:

10 tablas

---

# 11. Eventos

ProductCreated

ProductUpdated

RuleChanged

RateUpdated

ProductActivated

ProductDeactivated

---

# 12. KPIs

Productos activos.

Conversión por producto.

Rentabilidad producto.

Tasa aprobación.

Mora por producto.

---

# Tecnologías recomendadas

## Backend

NestJS


---

## Rules Engine

Implementación propia.

o

Motor externo:

- Drools;
- JSON Rules Engine.


---

## Configuración

JSON Schema

Dynamic Forms


---

# Próximo Documento

DAD-47

Customer Experience Platform

Incluye:

- onboarding;
- embudos;
- personalización;
- campañas;
- retención;
- experiencia cliente.