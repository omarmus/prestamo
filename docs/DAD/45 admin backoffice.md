# Data Architecture Document (DAD)

# Parte XLV

# Admin Backoffice Platform

Versión 1.0

---

# Tabla de Contenido

1. Objetivo
2. Arquitectura
3. Usuarios Internos
4. Dashboard Operativo
5. Gestión Clientes
6. Gestión Solicitudes Crédito
7. Aprobación Manual
8. Gestión Préstamos
9. Gestión Pagos
10. Gestión Cobranza
11. Configuración Negocio
12. Modelo de Datos
13. Eventos
14. KPIs

---

# 1. Objetivo

Crear una plataforma administrativa centralizada para operar la fintech diariamente.

---

# 2. Arquitectura

```

Internal Users


      │


      ▼


Admin Portal


      │


      ▼


API Gateway


      │


      ▼


Backend Platform


      │


 ┌────┼────┬────┐


 ▼    ▼    ▼    ▼


Loans KYC Payments Reports


```

---

# 3. Usuarios Internos

El sistema debe manejar roles.

---

# Super Admin

Acceso completo.

---

# Operaciones

Gestiona clientes y préstamos.

---

# Analista Crédito

Evalúa solicitudes.

---

# Cobranza

Gestiona mora.

---

# Finanzas

Control pagos y conciliaciones.

---

# Soporte

Atención cliente.

---

# Auditor

Solo lectura.

---

# 4. Dashboard Operativo

Vista principal.

Métricas:

---

## Crédito

- solicitudes nuevas;
- aprobadas;
- rechazadas;
- desembolsadas.

---

## Cartera

- saldo total;
- mora;
- recuperación.

---

## Operación

- KYC pendientes;
- pagos pendientes;
- casos revisión.

---

Ejemplo:

```

Solicitudes hoy:

150


Aprobadas:

80


Monto aprobado:

Bs450000


Mora:

3.5%


```

---

# 5. Gestión Clientes

Funciones:

---

Buscar:

- nombre;
- CI;
- teléfono;
- préstamo.

---

Ver perfil:

- identidad;
- historial;
- préstamos;
- pagos;
- conversaciones.

---

Acciones:

- bloquear;
- desbloquear;
- actualizar datos.

---

# 6. Gestión Solicitudes Crédito

Flujo:

```

Nueva solicitud

        ↓

Revisión automática

        ↓

Analista

        ↓

Aprobación/Rechazo

        ↓

Desembolso


```

---

Información visible:

- monto;
- plazo;
- score;
- ingresos;
- historial.

---

# 7. Aprobación Manual

Casos:

- score intermedio;
- documentos dudosos;
- excepciones.

---

Acciones:

Aprobar.

Rechazar.

Solicitar información.

Escalar.

---

# 8. Gestión Préstamos

Permite:

Consultar:

- préstamos activos;
- cuotas;
- saldos.

---

Acciones:

- reestructurar;
- refinanciar;
- aplicar ajustes.

---

# 9. Gestión Pagos

Control:

- pagos recibidos;
- pagos pendientes;
- conciliaciones.

---

Acciones:

- registrar pago manual;
- reversar;
- revisar comprobantes.

---

# 10. Gestión Cobranza

Vista cartera:

```

Cliente

Días atraso

Monto

Riesgo

Acción


```

---

Funciones:

- asignar gestores;
- crear tareas;
- registrar contacto.

---

# 11. Configuración Negocio

Administrar:

---

Productos crédito.

---

Tasas.

---

Plazos.

---

Comisiones.

---

Reglas aprobación.

---

Plantillas mensajes.

---

Usuarios.

---

# 12. Modelo de Datos

---

# admin_users

Usuarios internos.

---

# admin_roles

Roles administrativos.

---

# admin_permissions

Permisos.

---

# admin_sessions

Sesiones.

---

# approval_workflows

Flujos aprobación.

---

# approval_tasks

Tareas revisión.

---

# admin_notes

Notas internas.

---

# customer_assignments

Asignaciones agentes.

---

# system_configurations

Configuraciones generales.

---

# Modelo Total

1. admin_users

2. admin_roles

3. admin_permissions

4. admin_sessions

5. approval_workflows

6. approval_tasks

7. admin_notes

8. customer_assignments

9. system_configurations


Total:

9 tablas

---

# 13. Eventos

AdminUserCreated

RoleAssigned

LoanReviewed

LoanApproved

LoanRejected

CustomerAssigned

ConfigurationChanged

---

# 14. KPIs

Tiempo aprobación.

Productividad analistas.

Casos pendientes.

Tiempo resolución.

Carga operativa.

---

# Tecnologías recomendadas

## Frontend

Next.js

React

---

## UI

Material UI

Ant Design

Tailwind


---

## Backend

NestJS


---

## Seguridad

RBAC

Audit Logs

MFA


---

# Próximo Documento

DAD-46

Product Configuration Engine

Incluye:

- productos préstamo;
- reglas negocio;
- tasas;
- plazos;
- comisiones;
- motor configuración sin código.