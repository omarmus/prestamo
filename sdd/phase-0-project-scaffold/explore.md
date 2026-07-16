# Exploration: Phase 0 — Project Scaffold (primer cambio concreto)

## Current State

**Proyecto greenfield absoluto.** No existe una sola línea de código fuente.

Lo que sí existe:
- **7 documentos de análisis** en `docs/analysis/` — cubren negocio, funciones, arquitectura DDD, diseño UX/UI, IA, legal (Bolivia), y pagos QR BCB.
- **OpenSpec inicializado** en `openspec/` con configuración base.
- **Stack completamente definido:** Next.js + NestJS + PostgreSQL + Redis + S3 + Docker + AWS.
- **Arquitectura decidida:** Modular Monolith con DDD + Clean Architecture, 12 dominios, comunicación por eventos.
- **Roadmap:** Fase 0 (Diseño, Branding, Arquitectura, Landing) → MVP en ~4 meses.
- **No hay:** `package.json`, `tsconfig`, `docker-compose.yml`, ni ningún archivo de proyecto.

---

## Affected Areas

| Área | Impacto |
|------|---------|
| **Monorepo root** | Creación del workspace, `turbo.json`, configs compartidas |
| **`apps/api`** | Scaffold completo de NestJS con estructura de módulos DDD |
| **`apps/web`** | Scaffold de Next.js + TailwindCSS + Shadcn UI |
| **`packages/shared`** | Esquemas Zod compartidos, tipos TypeScript |
| **Infraestructura local** | Docker Compose (PostgreSQL, Redis), variables de entorno |
| **CI/CD** | GitHub Actions básico (lint + type-check) |
| **Primer dominio** | Identity/Auth — el módulo del que dependen todos los demás |

**NO se afectan en este cambio:**
- Dominios de negocio (Loan, Payment, Collection, etc.)
- Landing page (contenido visual/marketing)
- WhatsApp integration
- AI Service
- Despliegue en AWS (solo local dev)
- Página de aterrizaje con contenido real

---

## Approaches

### 1. Monorepo con Turborepo (RECOMENDADO)

**Qué implica:**
- `pnpm` workspaces + Turborepo para caché de builds y pipeline
- `apps/api` (NestJS) + `apps/web` (Next.js) + `packages/shared`
- Configs unificadas: TypeScript, ESLint, Prettier
- Primer módulo DDD: Identity (User, Role, Auth)

**Pros:**
- Tipos compartidos entre frontend y backend sin duplicación
- Un solo `pnpm install`, un solo CI
- Turborepo cachea builds → dev rápido
- La estructura refleja el Modular Monolith que define la arquitectura
- Escala naturalmente al agregar más `apps/` y `packages/`

**Contras:**
- Curva de aprendizaje inicial de Turborepo
- Overhead mínimo para un proyecto de un solo dev

**Costo estimado:** ~1-2 días (scaffolding + primer módulo funcional)

---

### 2. Nx Monorepo

**Qué implica:**
- Nx workspace con generadores para NestJS y Next.js
- Visualization de dependencias, affected commands, code generation

**Pros:**
- Generadores más potentes (crear módulos, librerías con un comando)
- `nx affected` — solo ejecuta tareas en lo que cambió
- Mejor soporte para múltiples apps grandes a futuro

**Contras:**
- **Mucho más pesado** para 2 apps — Nx agrega plugins, schemas, configs extras
- La complejidad de Nx no se justifica hasta tener 5+ apps o un equipo grande
- Mayor fricción para un equipo pequeño/startup
- Las migraciones de versión de Nx son notoriamente dolorosas

**Veredicto:** Overengineering para el contexto actual. Si el proyecto escala a 10+ microservicios, se reconsidera.

---

### 3. Repos separados (api + web)

**Qué implica:**
- Dos repositorios independientes
- `packages/shared` publicado como npm package interno
- CI/CD duplicado

**Pros:**
- Independencia total entre frontend y backend
- Cada equipo (si existiera) trabaja sin bloqueos

**Contras:**
- **No hay equipo separado** — es el mismo desarrollador
- Compartir tipos requiere publicar un paquete o copiar archivos
- Dos CI/CD que mantener
- Rompe el principio de Modular Monolith (cambios atómicos entre frontend/dominio)
- Mayor fricción en el desarrollo local

**Veredicto:** Más trabajo para cero beneficio en este contexto.

---

### 4. Scaffolding manual paso a paso (sin monorepo tool)

**Qué implica:**
- Crear `apps/` como carpetas independientes
- Scripts npm manuales para build/lint/test
- Sin herramienta de orchestación de pipelines

**Pros:**
- Cero dependencias extra
- Control total

**Contras:**
- Terminas reinventando Turborepo mal
- Sin caché de builds, sin paralelización
- Las configs se desincronizan entre apps
- Más trabajo que instalar Turborepo

**Veredicto:** Turborepo YA hace esto mejor. No reinventarlo.

---

## Recommendation

**El primer cambio concreto debe ser: Scaffolding del monorepo con Turborepo + módulo Identity (Auth) funcional.**

### ¿Por qué este y no otro?

1. **Sin monorepo no se puede empezar a escribir código.** Es el prerequisito blockeante.
2. **Turborepo sobre Nx:** La regla del skill `clean-ddd-hexagonal` dice *"Start simple. Evolve complexity only when needed."* Nx es complejidad diferida.
3. **Identity/Auth como primer módulo:** El dominio más simple (User, Role, Permission, JWT) y del que TODOS los demás dependen. No podemos construir Loan, Payment, ni nada sin saber quién es el usuario.
4. **Landing page se construye DESPUÉS** del scaffold — necesitas el proyecto funcionando primero.
5. **Se incluye Docker Compose** para que el equipo (y la IA) puedan levantar el stack localmente y probar.

### Lo que incluye el cambio

```
prestamos-app/
├── .github/workflows/ci.yml     # Lint + type-check básico
├── .vscode/extensions.json       # Plugins recomendados
├── apps/
│   ├── api/                      # NestJS + Prisma
│   │   └── src/
│   │       ├── identity/         # Primer módulo DDD
│   │       │   ├── domain/       # User entity, Value Objects, Repository port
│   │       │   ├── application/  # Commands: RegisterUser, LoginUser
│   │       │   ├── infrastructure/ # Prisma adapter, JWT strategy
│   │       │   └── presentation/ # AuthController, dtos
│   │       ├── shared/           # Base DDD classes, guards, decorators
│   │       └── main.ts
│   └── web/                      # Next.js (página placeholder)
│       ├── app/page.tsx
│       └── components/
├── docker-compose.yml            # PostgreSQL + Redis
├── packages/
│   └── shared/                   # Zod schemas + TS types
├── package.json                  # pnpm workspace root
├── turbo.json
├── tsconfig.base.json
├── .eslintrc.js
└── .prettierrc
```

### Lo que NO incluye (explícitamente fuera de scope)

- Landing page con diseño visual → Fase 0b
- Los otros 11 dominios DDD → Fases 1-6 del roadmap
- WhatsApp integration → Fase 1
- OCR / Evaluación / Motor de reglas → Fase 2
- Pagos → Fase 3
- AI Service → Fase 4
- Portal del cliente → Fase 5
- Multi-tenant SaaS → Fase 6

---

## Risks

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| **Análisis-parálisis** — querer diseñar TODO antes de codear | Alta | Medio | Primer cambio enfocado en lo MÍNIMO para desbloquear desarrollo |
| **Overengineering del scaffold** — crear estructura para 12 dominios que quizás nunca existan | Media | Alto | Solo se crea el módulo Identity. Los demás se agregan cuando se necesiten (YAGNI) |
| **Lock-in de versión de Turborepo** — cambios breaking en actualizaciones | Baja | Bajo | Turborepo es estable. Si duele, se reemplaza con pnpm workspaces solos |
| **Elección incorrecta de monorepo tool** | Baja | Bajo | Cambiar de Turborepo a otra cosa es trivial comparado con cambiar de base de datos |
| **Prisma schema mal diseñado desde el inicio** | Media | Alto | Usar migraciones desde el día 1. El schema de Identity es simple (User, Role) y fácil de cambiar |
| **Dependencia de servicios externos para dev local** | Baja | Medio | Docker Compose evita depender de servicios cloud para desarrollo |
| **El equipo no conoce DDD + Clean Architecture** | Alta | Medio | El scaffold incluye la estructura pero la implementación real del patrón se hará en el siguiente cambio (diseño) |

---

## Ready for Proposal

**Yes.** Este cambio está listo para pasar a propuesta porque:

1. **No hay ambigüedad en el alcance** — monorepo + scaffold + Identity module + Docker
2. **No depende de decisiones externas** — el stack ya está definido en los documentos de análisis
3. **Es el prerequisito blockeante** — sin esto no se puede escribir código
4. **Tiene un límite claro** — 1-2 días de trabajo, no se expande

### Siguiente paso recomendado

Si se aprueba este cambio, el siguiente cambio debería ser **Phase 0b: Landing Page + Branding** (el diseño visual y contenido de la landing), que puede correr en paralelo con la implementación del scaffold.
