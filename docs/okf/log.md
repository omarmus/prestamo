# Bundle Update Log

## 2026-07-16

### Phase 1 — Auth Frontend
- **AuthProvider**: contexto React con user state, tokens en localStorage, refresh automático
- **API Client**: fetch wrapper con inyección de JWT, refresh en 401, sin dependencias externas
- **LoginForm**: email + password, validación Zod, shadcn/ui components, story en Storybook
- **RegisterForm**: nombre + email + teléfono + contraseña, validación Zod, story
- **Páginas**: /login y /register con redirect post-autenticación
- **Auth guard**: home page redirige a /login si no hay sesión
- **Proxy API**: Next.js rewrites /api/* → localhost:3001/api/*

## 2026-07-16

### Creación Inicial
- **OKF bundle** inicial con arquitectura, módulos, dominio y decisiones.
- **Proyecto greenfield** — Phase 0 scaffold completado.
- **Identity module** implementado (register, login, refresh, me).
- **Web scaffold** con Next.js 16 + Tailwind v4.

### shadcn/ui + Storybook
- **shadcn/ui**: inicializado en `apps/web/`, 8 componentes instalados (Button, Card, Input, Label, Dialog, Select, Badge, Avatar).
- **components.json**: alias corregido a `@/components/atoms/ui` para Atomic Design.
- **Storybook v10.5**: configurado con `@storybook/nextjs-vite`. 4 stories creadas.
- **tw-animate-css**: import con ruta relativa para compatibilidad Turbopack.

### Frontend DDD Lite + Atomic Design
- **Estructura**: components/{atoms,molecules,organisms}/ + features/{auth,loans}/{components,hooks}/ + providers/.
- **@/ duplicado**: limpiado (creado por shadcn init incorrectamente).
- **AGENTS.md**: actualizado con frontend architecture section.

### Branding & Design System
- **SDD Parte VIII**: guardado en `docs/analysis/branding-sdd.md`.
- **Color tokens**: primario #1D4ED8, secundario #06B6D4, accent #F97316. Dark mode completo.
- **Colores funcionales**: success, warning, info, overdue, whatsapp.
- **Radius**: 0.75rem (12px) — cards 16px, inputs 10px, buttons 12px.

### Reglas Mandatory
- **AGENTS.md**: sección mandatory rules con DDD Clean Architecture, shadcn/ui único, CodeGraph sync, OKF wiki updates.

## 2026-07-17

### Data Models + MVP Roadmap
- **data-models.md**: extraídas todas las secciones Modelo de Datos de DAD 01-49 (48 secciones, 6,460 líneas)
- **roadmap.md**: MVP roadmap reestructurado con el Customer Portal como eje central del flujo
- **tables-mvp.md**: listado completo de 30 tablas MVP con referencias cruzadas al DAD y al portal
- **index.md**: actualizado con links a roadmap, tables-mvp y data-models

### WhatsApp como canal primario de adquisición
- **roadmap.md**: WhatsApp movido de Fase 7 a Fase 2 — es el canal de adquisición PRIMARIO del MVP
- **tables-mvp.md**: fases reordenadas: WhatsApp (F2) → Portal Core (F3) → Solicitud (F4) → Préstamos (F5) → Documentos (F6) → Admin (F7)
- Flujo completo documentado: Landing → WhatsApp Bot → Registro/Solicitud → Portal → Gestión

## 2026-07-17

### Data Models + MVP Roadmap
- **data-models.md**: extraídas todas las secciones Modelo de Datos de DAD 01-49 (48 secciones, 6,460 líneas)
- **roadmap.md**: MVP roadmap actualizado con 6 fases, basado en DAD-50 y estado actual del proyecto
- **tables-mvp.md**: listado completo de las 28 tablas MVP con referencia al DAD de origen y estado de implementación
- **index.md**: actualizado con links a roadmap, tables-mvp y data-models

## 2026-07-17

### Phase 1 — Infraestructura Compartida
- **Prisma schema**: campos base agregados a todos los modelos (`organizationId`, soft delete, `version`, auditoría)
- **AuditLog + SystemConfiguration**: modelos agregados al schema
- **@Inject() en todos los constructores NestJS**: decorador explícito para compatibilidad con tsx/esbuild
- **Turborepo DI tokens**: naming consistente con prefijo de módulo

### Phase 2 — WhatsApp + Chatbot AI
- **Prisma schema completo**: WhatsAppContact, WhatsAppConversation, WhatsAppMessage, ChatbotSession (4 tablas)
- **Schema-only**: endpoints de WhatsApp Cloud API y chatbot AI pendientes para fase dedicada

## 2026-07-18

### Phase 2 — Customer Module (Backend + Frontend)
- **Customer domain**: entidad con status/kycStatus, value objects, repositorio
- **Customer application**: create (auto al registrarse), complete profile, upload documents
- **Customer infrastructure**: Prisma repositorio, auto-creación en AuthRegisterHandler
- **Portal Frontend**: dashboard, profile, documents (subir/ver), simulator con tabla de amortización
- **Customer CRUD**: endpoints GET/me, PATCH/profile, document upload

## 2026-07-19

### Phase 3 — Loan Application Module (3 PRs encadenados)

**PR 1 — Domain + Create:**
- LoanApplication entity con state machine (DRAFT → PENDING → IN_REVIEW → APPROVED/REJECTED/CANCELLED)
- LoanStatus value object con valid transitions lookup
- CreateApplicationHandler con validación de dominio (amount, termMonths, annualRate)
- Zod schemas compartidos: CreateLoanApplicationSchema, ReviewApplicationSchema
- Prisma schema: loan_applications ya existente

**PR 2 — Backend CRUD + Admin Review:**
- GetApplicationQuery, GetApplicationsQuery, CancelApplicationCommand
- Admin: ListPendingApplicationsQuery, ReviewApplicationCommand (assign/review/approve/reject/requestInfo)
- PrismaLoanApplicationRepository con updateStatus atómico (optimistic locking via status match)
- AdminGuard + CustomerGuard para separación de roles
- LoanApplicationController (portal) + AdminLoanApplicationController (admin)

**PR 3 — Frontend Portal + Admin UI:**
- Portal: `/portal/loans` — listar solicitudes, `/portal/loans/new` — formulario de aplicación con monto/plazo/propósito, `/portal/loans/[id]` — tracking con timeline de estados
- Admin: `/admin/loans` — bandeja con tabla de solicitudes pendientes, `/admin/loans/[id]` — detalle + acciones (assign, review, approve, reject)
- Feature hooks: use-loans.ts (portal), use-admin-loans.ts (admin)
- AdminGuard en frontend

### Bug Fixes (commiteados a develop)
- **Customer controller**: list/get/cancel usaban `user.sub` (userId) en vez de `req.customer.id` (customerId) — CustomerGuard ya adjunta req.customer
- **Admin route prefix**: controller en `/api/admin/loans` (antes `/api/admin/loans/applications`) — coincidía con llamadas del frontend
- **Register**: comando acepta `role` opcional para crear admins
- **Frontend admin hook**: ruta `/assign` → `/review` (endpoint correcto del backend)
- **Frontend response unwrap**: hook extraía `{ data }` de la respuesta axios

## 2026-07-21

### PR 2 — Admin Layout + Dashboard
- **AdminSidebar**: componente de navegación lateral con 5 items (Dashboard, Solicitudes, Préstamos Activos, Clientes, Usuarios). Desktop sidebar + mobile sheet drawer. Sigue patrón de PortalSidebar.
- **AdminLayout**: layout server component + client wrapper con auth guard, sidebar y Toaster. `<main>` wrapper centralizado — páginas ya no tienen su propio `<main>`.
- **MetricCard**: componente reutilizable con icono, valor, label y variante skeleton. Grid responsive (2 cols desktop, 1 mobile).
- **Dashboard page**: hook use-admin-stats (fetch GET /api/admin/stats), DashboardMetrics component con 5 tarjetas (Solicitudes, Pendientes, Activos, Desembolsado, Clientes).
- **Nested <main> fix**: 4 páginas admin existentes convertidas de `<main>` a `<div>` para evitar anidación.

## 2026-07-22

### CI obligatorio al registrarse
- **documentType + documentNumber**: ahora son campos requeridos al registrar un cliente
- **Prisma schema**: `documentType String @default("CI")`, `documentNumber String NOT NULL`
- **Customer entity**: `createFromUser(user, documentType, documentNumber)` — validación de documentNumber no vacío
- **RegisterSchema (shared)**: agrega `documentNumber` (required) y `documentType` con default `'CI'`
- **RegisterForm (frontend)**: nuevo campo "Cédula de Identidad" entre teléfono y contraseña
- **Mastra tools**: `register-customer` tool y `customer-registration` workflow requieren `documentNumber`
- **Agente customer-support**: instrucciones actualizadas para pedir CI durante registro
- **Fallback**: `prisma-customer.repository.ts` toDomain usa `?? 'CI'`/`?? ''` para registros legacy con NULL
- **Tests**: 241 unit tests pasando, solo fallan 3 de integración (DB/Redis no disponible)

### Migración Chatbot WhatsApp a Mastra AI Framework
- **3 PRs completados**: Foundation → Tools + Migration → Workflows + Cleanup
- **Nuevo**: `apps/api/mastra/` con agente "Asistente de Préstamos" + 7 tools + 2 workflows
  - Tools: register-customer, get-customer-by-phone, check-loan-application, check-loan-status, check-next-installment, create-loan-application, simulate-loan
  - Workflows: customer-registration, loan-application (single-step, orquestación)
  - Memory: Mastra Memory con LibSQL + working memory template en español
  - NestJS integration via `@mastra/nestjs`
- **Eliminados**: ~12 archivos legacy (FSM manual, handlers, Redis stores, AI HTTP service)
- **Preservados**: entidades de dominio (WhatsAppContact, WhatsAppConversation, WhatsAppMessage), MetaHttpService legacy
- **Bug fix**: Symbol() duplication de ACTIVE_LOAN_QUERY en loans module
- **Tests**: 249 pasando, 2 pre-existing DB integration failures
- **Stack**: @mastra/core@1.51.0, @mastra/nestjs@0.2.7, @mastra/memory@1.23.0, @mastra/libsql@1.16.0

### Fase 6 — Documentos Legales (completada)
- Generación de contratos PDF con pdfkit
- Descarga desde portal y admin
- SDD archive completado

### Fase 7 — Admin Backoffice (completada)
- Dashboard, customer browser, notas internas, user management
- Todos los endpoints verificados con curl

## 2026-07-20

### OKF Wiki — Actualización completa
- **project.md**: fases actualizadas con las 3 nuevas fases completadas
- **modules/loans.md**: nuevo — documentación del módulo Loans
- **domain/loans.md**: nuevo — dominio de Loan Application con state machine
- **roadmap.md**: mark Fases 1-4 como ✅, tabla de estado actualizada
- **tables-mvp.md**: 20/30 tablas marcadas como implementadas
- **index.md**: quick links actualizados con Loans y Customers
