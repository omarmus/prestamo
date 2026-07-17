# Design: Fase 3 — Customer Portal Core + Clientes

## Overview

Fase 3 construye el módulo **Customers** (backend NestJS, Clean Architecture) y el **Portal del Cliente** (frontend Next.js). El cliente que ya se registró por WhatsApp o web tendrá un dashboard protegido donde gestionar su perfil, documentos, y simular préstamos.

Dos dominios DDD separados:

| Dominio | Backend | Frontend |
|---------|---------|----------|
| **Customer** | Datos personales, documentos, empleo, ingresos, cuentas bancarias | Perfil, documentos |
| **Portal** | Simulaciones, acciones de portal | Dashboard, simulator |

Relación: **User 1:1 → Customer** (se crea automáticamente al registrar un User).

---

## Current State

**Backend:**
- `identity/` module con Clean Architecture — referencia de patrón para `customers/`
- Prisma schema actual: 7 modelos (Role, User, FailedLoginAttempt, AuditLog, SystemConfiguration, WhatsApp*, ChatbotSession)
- Auth: JWT (access 15m + refresh 7d rotation), argon2id, guards funcionales

**Frontend:**
- AuthProvider con login/register funcionales
- Landing pública, redirect post-auth a home
- shadcn/ui: Button, Card, Input, Label, Dialog, Select, Badge, Avatar instalados

**Pendiente:** No existe Customer entity, no hay portal routes, no hay customer data model en Prisma.

---

## Quiet Truth / Design Decisions

### 1. Customer como Bounded Context separado de Identity

Aunque User y Customer tienen relación 1:1, son dominios distintos. User maneja autenticación; Customer maneja datos del cliente financiero (KYC, perfil económico, documentos). No mezclar.

### 2. Documentos como base64 en DB (ponytail)

Subida a S3 es post-MVP. Para el MVP almacenamos los archivos como base64 en un campo `content` o en disco local con path. Esto evita configurar S3 buckets, IAM, firmas, etc.

**Ceiling conocido:** Archivos >5MB impactan performance de DB y backups. Migrar a S3 cuando tengamos documentos reales de clientes.

### 3. Simulador: cálculo en frontend, registro en backend

El simulador calcula cuota fija (método francés) en el frontend para respuesta instantánea. Cada simulación se persiste en `loan_simulations` para tracking de conversión. Sin aprobación real — es solo estimación.

### 4. No reutilizar Customer del schema de WhatsApp

Los `whatsapp_contacts` tienen un `userId` opcional, pero los datos del Customer (direcciones, empleo, ingresos) son un perfil financiero completo que vive en su propio módulo. La relación es User → Customer 1:1, y WhatsAppContact se relaciona a User.

### 5. portal_actions como insert-only liviano

`portal_actions` registra eventos de navegación (VIEW_LOANS, APPLY_CLICK, DOCUMENT_UPLOAD, etc.) sin FK a tablas externas. Sirve para entender comportamiento del cliente sin analytics externo. Insert-only, sin updates.

---

## Architecture

### Backend — Módulo Customers

```
apps/api/src/customers/
├── domain/
│   ├── customer.entity.ts
│   ├── customer.repository.ts     (port)
│   ├── errors/
│   │   └── customer.errors.ts
│   └── value-objects/
│       ├── document-number.vo.ts
│       └── bolivian-phone.vo.ts
├── application/
│   ├── create-customer/
│   │   ├── create-customer.command.ts
│   │   └── create-customer.handler.ts
│   ├── update-customer/
│   │   ├── update-customer.command.ts
│   │   └── update-customer.handler.ts
│   ├── get-customer/
│   │   └── get-customer.query.ts
│   ├── upload-document/
│   │   ├── upload-document.command.ts
│   │   └── upload-document.handler.ts
│   ├── simulate-loan/
│   │   ├── simulate-loan.command.ts
│   │   └── simulate-loan.handler.ts
│   └── ports/
│       ├── document-storage.port.ts  (abstracción para subida de archivos)
│       └── customer-query.port.ts
├── infrastructure/
│   ├── persistence/
│   │   ├── prisma-customer.repository.ts
│   │   └── prisma-customer.mapper.ts
│   └── storage/
│       └── local-document-storage.ts  (ponytail: base64 en DB, migrar a S3)
├── presentation/
│   ├── customers.controller.ts
│   ├── customers.module.ts
│   └── dto/
│       ├── create-customer.dto.ts
│       ├── update-customer.dto.ts
│       ├── customer-response.dto.ts
│       ├── upload-document.dto.ts
│       └── simulate-loan.dto.ts
└── customers.module.ts  (registrado en AppModule)
```

### Frontend — Portal

```
apps/web/
├── app/
│   └── portal/
│       ├── layout.tsx               ← Layout protegido con sidebar
│       ├── page.tsx                 ← redirect a /portal/dashboard
│       ├── dashboard/page.tsx
│       ├── profile/page.tsx
│       ├── documents/page.tsx
│       └── simulator/page.tsx
├── features/
│   └── portal/
│       ├── hooks/
│       │   ├── use-customer.ts
│       │   ├── use-documents.ts
│       │   └── use-simulator.ts
│       └── components/
│           ├── customer-form.tsx
│           ├── document-list.tsx
│           ├── document-uploader.tsx
│           ├── simulator-form.tsx
│           ├── amortization-table.tsx
│           └── portal-sidebar.tsx
└── lib/
    └── api/
        └── customer.ts              ← fetch wrappers
```

---

## Data Model (Prisma)

Basado en DAD-04 (Customer Management & KYC) + DAD-44 (Customer Portal Platform), simplificado para MVP.

### Nuevos modelos (10 tablas)

```prisma
// ===== Fase 3: Customer Management & Portal =====

model Customer {
  id              String   @id @default(uuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id])
  customerNumber  String?  @unique  // readable: CUST-0001
  firstName       String
  middleName      String?
  lastName        String
  secondLastName  String?
  documentType    String   @default("CI")  // CI | PASSPORT | OTHER
  documentNumber  String?
  birthDate       DateTime?
  gender          String?
  maritalStatus   String?
  occupation      String?
  monthlyIncome   Decimal? @db.Decimal(18,2)
  status          String   @default("REGISTERED")  // LEAD | REGISTERED | VERIFIED | BLOCKED
  kycStatus       String   @default("NOT_STARTED")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  addresses      CustomerAddress[]
  phones         CustomerPhone[]
  emails         CustomerEmail[]
  employments    CustomerEmployment[]
  incomes        CustomerIncome[]
  bankAccounts   CustomerBankAccount[]
  documents      CustomerDocument[]
  simulations    LoanSimulation[]
  portalActions  PortalAction[]

  @@index([userId])
  @@index([documentNumber])
  @@index([status])
}

model CustomerAddress {
  id          String @id @default(uuid())
  customerId  String
  customer    Customer @relation(fields: [customerId], references: [id])
  type        String   @default("HOME")  // HOME | WORK | CORRESPONDENCE
  country     String   @default("BO")
  department  String?
  city        String?
  zone        String?
  street      String?
  number      String?
  isPrimary   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([customerId])
}

model CustomerPhone {
  id          String  @id @default(uuid())
  customerId  String
  customer    Customer @relation(fields: [customerId], references: [id])
  phone       String
  isWhatsApp  Boolean @default(false)
  isPrimary   Boolean @default(false)
  verified    Boolean @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([customerId])
}

model CustomerEmail {
  id          String  @id @default(uuid())
  customerId  String
  customer    Customer @relation(fields: [customerId], references: [id])
  email       String
  isPrimary   Boolean  @default(false)
  verified    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([customerId])
  @@index([email])
}

model CustomerEmployment {
  id                String   @id @default(uuid())
  customerId        String
  customer          Customer @relation(fields: [customerId], references: [id])
  employer          String?
  position          String?
  employmentStatus  String   @default("EMPLOYEE")  // EMPLOYEE | SELF_EMPLOYED | BUSINESS_OWNER | UNEMPLOYED
  yearsWorking      Int?
  monthlySalary     Decimal? @db.Decimal(18,2)
  startDate         DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([customerId])
}

model CustomerIncome {
  id          String   @id @default(uuid())
  customerId  String
  customer    Customer @relation(fields: [customerId], references: [id])
  source      String   // SALARY | BUSINESS | RENT | COMMISSION | PENSION | OTHER
  amount      Decimal  @db.Decimal(18,2)
  frequency   String   @default("MONTHLY")  // MONTHLY | WEEKLY | ANNUAL
  verified    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([customerId])
}

model CustomerBankAccount {
  id            String  @id @default(uuid())
  customerId    String
  customer      Customer @relation(fields: [customerId], references: [id])
  bank          String   // Banco Unión, BCP, Mercantil, etc.
  accountType   String   @default("SAVINGS")  // SAVINGS | CHECKING
  accountNumber String
  holderName    String
  isPrimary     Boolean  @default(false)
  verified      Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([customerId])
}

model CustomerDocument {
  id          String   @id @default(uuid())
  customerId  String
  customer    Customer @relation(fields: [customerId], references: [id])
  type        String   // CI_FRONT | CI_BACK | SELFIE | PAYSLIP | BANK_STATEMENT | SERVICE_BILL
  fileName    String
  mimeType    String
  content     String?  // base64 (ponytail: S3 post-MVP)
  filePath    String?  // local file path alternative
  status      String   @default("PENDING")  // PENDING | VERIFIED | REJECTED
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([customerId])
  @@index([type])
}

model LoanSimulation {
  id              String  @id @default(uuid())
  customerId      String
  customer        Customer @relation(fields: [customerId], references: [id])
  amount          Decimal  @db.Decimal(18,2)
  termMonths      Int
  interestRate    Decimal  @db.Decimal(6,4)  // tasa efectiva mensual
  monthlyPayment  Decimal  @db.Decimal(18,2)  // cuota calculada
  totalPayment    Decimal  @db.Decimal(18,2)  // total a pagar
  createdAt       DateTime @default(now())

  @@index([customerId])
}

model PortalAction {
  id          String   @id @default(uuid())
  customerId  String
  customer    Customer @relation(fields: [customerId], references: [id])
  action      String   // VIEW_DASHBOARD | VIEW_PROFILE | VIEW_DOCUMENTS | VIEW_SIMULATOR | UPLOAD_DOCUMENT | RUN_SIMULATION | APPLY_CLICK
  metadata    Json?    // { "amount": 5000, "termMonths": 6 } etc.
  createdAt   DateTime @default(now())

  @@index([customerId])
  @@index([action])
}
```

### Migración User → Customer 1:1

En el handler de `RegisterUser`, después de crear el User en DB:
```ts
// apps/api/src/identity/application/register/register-user.handler.ts
const user = await this.userRepository.save(newUser);
await this.customerRepository.save(Customer.createFromUser(user));
// ponytail: Customer básico con firstName = user.name, userId = user.id
// El cliente completa el perfil después desde /portal/profile
```

---

## Module Breakdown

### 1. Customer Management (Create + Read + Update)

| Command | Description | Validations |
|---------|-------------|-------------|
| `POST /api/customers` | Crear Customer (auto desde register) | userId único, documento opcional |
| `GET /api/customers/me` | Obtener perfil del customer autenticado | JWT guard, lookup por userId |
| `PUT /api/customers/me` | Actualizar datos personales | Solo campos permitidos |
| `PUT /api/customers/me/addresses` | CRUD direcciones | 1 primary por tipo |
| `PUT /api/customers/me/phones` | CRUD teléfonos | 1 primary, validación formato |
| `PUT /api/customers/me/emails` | CRUD emails | 1 primary, validación formato |
| `PUT /api/customers/me/employment` | Actualizar empleo | 1 registro activo |
| `PUT /api/customers/me/incomes` | CRUD ingresos | Múltiples fuentes |
| `PUT /api/customers/me/bank-accounts` | CRUD cuentas bancarias | 1 primary |

### 2. Document Upload

| Endpoint | Description |
|----------|-------------|
| `POST /api/customers/me/documents` | Subir documento (multipart → base64) |
| `GET /api/customers/me/documents` | Listar documentos del cliente |
| `GET /api/customers/me/documents/:id` | Descargar documento (base64 → data URI) |
| `DELETE /api/customers/me/documents/:id` | Eliminar documento propio |

### 3. Loan Simulator

| Endpoint | Description |
|----------|-------------|
| `POST /api/customers/me/simulate` | Calcular cuota + guardar simulación |

Cálculo: método francés (cuota fija)
```
monthlyRate = annualRate / 12 / 100
payment = amount * (monthlyRate * (1 + monthlyRate)^termMonths) / ((1 + monthlyRate)^termMonths - 1)
totalPayment = payment * termMonths
```

### 4. Portal Frontend

| Route | Componentes | Descripción |
|-------|-------------|-------------|
| `/portal/dashboard` | Dashboard page | Resumen del perfil, docs pendientes, acciones rápidas |
| `/portal/profile` | CustomerForm | Editar datos personales, direcciones, empleo, ingresos, cuentas |
| `/portal/documents` | DocumentList, DocumentUploader | Subir/ver/eliminar documentos |
| `/portal/simulator` | SimulatorForm, AmortizationTable | Simular préstamo, ver tabla de amortización |

Layout: Sidebar con nav links + header con nombre del cliente + avatar. Auth guard redirect a /login si no hay sesión.

---

## DAD References

| Modelo | DAD Source | Simplificación MVP |
|--------|------------|-------------------|
| Customer | DAD-04 § customers | Sin campo `risk_level`, `nationality`, `lead_id` |
| CustomerAddress | DAD-04 § customer_addresses | Sin lat/lng |
| CustomerPhone | DAD-04 § customer_phones | Ídem |
| CustomerEmail | DAD-04 § customer_emails | Ídem |
| CustomerEmployment | DAD-04 § customer_employment | Sin campo `employer` requerido |
| CustomerIncome | DAD-04 § customer_income | Sin `verified` workflow |
| CustomerBankAccount | DAD-04 § customer_bank_accounts | Sin `verified` workflow |
| CustomerDocument | DAD-06 § documents + DAD-44 | Sin versionado ni OCR (base64) |
| LoanSimulation | DAD-44 § loan_simulations | Calculada en frontend |
| PortalAction | DAD-44 § portal_actions | Insert-only |

Tablas del DAD completo diferidas para Fase 4+:
- customer_references, customer_assets, customer_liabilities
- customer_dependents, customer_beneficiaries
- customer_risk_profiles, customer_credit_profiles
- customer_blacklist

---

## Risks & Rollback

| Risk | Mitigation |
|------|------------|
| Dirty Prisma migration (10 tablas nuevas) | `prisma migrate dev --create-only` + revisar SQL antes de aplicar |
| User sin Customer por error en register handler | Hook en AuthProvider: si GET /customers/me devuelve 404, auto-crear Customer |
| Perfil del cliente incompleto rompe portal | Todos los campos customer son opcionales excepto firstName + userId |
| Upload de imagen grande (base64) | Limitar a 5MB en el DTO; migrar a S3 después |

Rollback: `prisma migrate down` revierte las 10 tablas. Feature flag `FF_PROFILE` opcional en portal layout.
