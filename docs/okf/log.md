# Bundle Update Log

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
