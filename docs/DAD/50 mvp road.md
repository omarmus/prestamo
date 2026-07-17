# Data Architecture Document (DAD)

# Parte L

# MVP Implementation Roadmap

Fintech Préstamos Bolivia

Versión 1.0

---

# 1. Objetivo del MVP

Construir una primera versión funcional que permita:

- captar clientes;
- atender mediante WhatsApp AI;
- registrar solicitudes;
- analizar créditos manualmente;
- aprobar préstamos;
- generar documentación;
- registrar desembolsos;
- registrar pagos.

---

# 2. Alcance MVP

## Incluido

✅ Landing Page

✅ WhatsApp Bot AI

✅ Registro clientes

✅ Registro solicitudes préstamo

✅ Panel administrador

✅ Evaluación manual

✅ Aprobación manual

✅ Gestión préstamos

✅ Registro pagos manuales

✅ Notificaciones básicas

✅ Documentos básicos


---

## No incluido

❌ App móvil

❌ QR pagos

❌ Integración bancaria

❌ Credit Scoring AI

❌ Machine Learning

❌ Automatización cobranza

❌ Marketplace

❌ Multi país


---

# 3. Arquitectura MVP

```

Cliente


 │


 ▼


Landing Page


 │


 ▼


WhatsApp AI Bot


 │


 ▼


Backend API


 │


 ├───────────────┐


 ▼               ▼


PostgreSQL      Storage


 │


 ▼


Admin Dashboard


```

---

# 4. DAD necesarios para el MVP

No todos los documentos anteriores son necesarios.

Para construir el MVP solamente necesitamos:

---

# DAD-20

Arquitectura General

Modelos:

- usuarios;
- configuración base.

---

# DAD-32

Loan Management

Modelos:

- préstamos;
- cuotas;
- productos.

---

# DAD-36

WhatsApp & Notifications

Modelos:

- conversaciones;
- mensajes;
- plantillas.

---

# DAD-37

Identity & KYC

Modelos:

- clientes;
- documentos;
- verificaciones.

---

# DAD-40

Security Architecture

Modelos:

- usuarios internos;
- roles;
- auditoría.

---

# DAD-45

Admin Backoffice

Modelos:

- administradores;
- tareas;
- aprobaciones.

---

# DAD-49

Legal Documents

Modelos:

- contratos;
- documentos.

---

# DAD-50

Roadmap MVP

Integración final.

---

# 5. Modelo completo MVP

## Módulo Usuarios

(DAD-20 + DAD-40)


---

## users

Usuarios autenticación.


Campos:

id

email

phone

password_hash

status

created_at


---

## roles

Roles sistema.


Ejemplo:

ADMIN

ANALYST

CUSTOMER


---

## user_roles

Relación usuarios roles.


---

# Módulo Clientes

(DAD-37)


---

## customers

Cliente financiero.


Campos:

id

user_id

first_name

last_name

document_number

birth_date

phone

email

address

occupation

monthly_income

status


Estados:

LEAD

REGISTERED

VERIFIED


---

## customer_documents

Documentos cliente.


Ejemplo:

CI

selfie

comprobante domicilio


Campos:

id

customer_id

type

file_url

status

verified_at


---

# Módulo WhatsApp AI

(DAD-36)


---

## whatsapp_contacts

Contactos WhatsApp.


Campos:

id

phone

customer_id

status


---

## whatsapp_conversations

Conversaciones.


Campos:

id

customer_id

started_at

ended_at

status


---

## whatsapp_messages

Mensajes.


Campos:

id

conversation_id

direction

message

sender

created_at


---

## chatbot_sessions

Sesiones bot.


Campos:

id

conversation_id

intent

state

data_collected


---

# Módulo Solicitud Crédito

(DAD-32)


---

## loan_products

Productos préstamo.


Ejemplo:

Préstamo Express


Campos:

id

name

min_amount

max_amount

term_days

status


---

## loan_applications

Solicitudes.


Campos:

id

customer_id

product_id

amount_requested

term_requested

purpose

status

created_at


Estados:

PENDING

REVIEW

APPROVED

REJECTED


---

# Módulo Evaluación Manual


---

## loan_reviews

Revisión analista.


Campos:

id

application_id

reviewer_id

decision

notes

created_at


---

## approval_tasks

Tareas aprobación.


Campos:

id

application_id

assigned_user

status


---

# Módulo Préstamos


(DAD-32)


---

## loans

Préstamos aprobados.


Campos:

id

customer_id

application_id

principal_amount

interest_amount

total_amount

start_date

end_date

status


---

## loan_installments

Cuotas.


Campos:

id

loan_id

number

due_date

amount

paid_amount

status


---

# Módulo Pagos Manuales


---

## payments

Pagos.


Campos:

id

loan_id

customer_id

amount

payment_date

method

reference

status


Métodos:

CASH

TRANSFER

OTHER


---

# Módulo Documentos


(DAD-49)


---

## document_templates

Plantillas.


---

## generated_documents

Documentos generados.


Ejemplo:

Contrato préstamo.


Campos:

id

customer_id

loan_id

type

file_url

created_at


---

# Módulo Administración


(DAD-45)


---

## admin_notes

Notas internas.


Campos:

id

user_id

customer_id

note


---

## audit_logs

Auditoría.


Campos:

id

user_id

action

entity

entity_id

created_at


---

# 6. Total Tablas MVP


## Usuarios

3 tablas

- users
- roles
- user_roles


---

## Clientes

2 tablas

- customers
- customer_documents


---

## WhatsApp

4 tablas

- whatsapp_contacts
- whatsapp_conversations
- whatsapp_messages
- chatbot_sessions


---

## Crédito

5 tablas

- loan_products
- loan_applications
- loan_reviews
- approval_tasks
- loans


---

## Pagos

2 tablas

- loan_installments
- payments


---

## Documentos

2 tablas

- document_templates
- generated_documents


---

## Administración

2 tablas

- admin_notes
- audit_logs


---

# Total MVP

20 tablas


---

# 7. Orden de Desarrollo


## Fase 1

Base sistema

DAD-20

DAD-40


Construir:

- usuarios;
- roles;
- seguridad.


---

## Fase 2

Captación cliente

DAD-36

DAD-37


Construir:

- landing;
- WhatsApp;
- chatbot;
- clientes.


---

## Fase 3

Crédito

DAD-32


Construir:

- solicitudes;
- revisión;
- aprobación.


---

## Fase 4

Operación financiera


Construir:

- préstamos;
- cuotas;
- pagos.


---

## Fase 5

Legal


Construir:

- contratos;
- documentos.


---

# 8. Stack MVP recomendado


Frontend:

Next.js


Backend:

NestJS


Database:

PostgreSQL


Queue:

Redis + BullMQ


Storage:

S3


WhatsApp:

WhatsApp Cloud API


AI Bot:

Claude / ChatGPT / Gemini API


---

# 9. Tiempo estimado


Desarrollo individual:

4-6 meses


Equipo pequeño:

2-3 meses


---

# 10. Evolución después MVP


Luego agregar:

DAD-31

Credit Scoring AI


DAD-35

QR Payments Bolivia


DAD-39

Analytics


DAD-48

Fraud Detection


DAD-43

Mobile Apps

