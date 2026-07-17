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
