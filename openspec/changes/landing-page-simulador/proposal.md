# Proposal: Landing Page + Simulador Público

## Intent

El landing page actual (`/`) redirige a `/login` o `/portal/dashboard` — no hay cara pública del producto. Sin landing, el embudo de adquisición no existe: visitantes de WhatsApp/redes no encuentran valor propuesta ni pueden probar el simulador sin registrarse. Este cambio crea la puerta de entrada pública de la fintech.

## Scope

### In Scope
- Landing page en `/` con hero, value prop, features, CTA a WhatsApp
- Endpoint público `POST /api/simulations/calculate` (stateless, sin auth, sin DB)
- Sección de simulador embebido en la landing, reutilizando `SimulatorForm` + `AmortizationTable`
- Extraer `calculateLoan()` a `apps/api/src/shared/` para reuso
- Hook `usePublicSimulator` con `fetch` directo (sin auth headers)

### Out of Scope
- SEO server-side content (Next.js ISR/SSR para landing — client-only MVP)
- Analytics / pixel tracking
- A/B testing o experimentación
- Blog, testimonios, FAQ, pricing
- Versiones multi-idioma

## Capabilities

### New Capabilities
- `public-simulator`: Endpoint stateless de cálculo de amortización francesa, sin autenticación ni persistencia
- `landing-page`: Página pública con hero, features, CTA, y simulador embebido

### Modified Capabilities
- `loan-simulator`: El spec existente cubre solo simulación autenticada con persistencia. Se agrega el endpoint público `POST /api/simulations/calculate` como variante stateless
- `landing-widget`: El spec existente cubre WhatsApp float + meta tags. Se agrega contenido de landing page (hero, features, CTA)

## Approach

1. **Backend** — Mover `calculateLoan()` a `apps/api/src/shared/loan-calculator.ts`. Crear `SimulationController` público (sin `@UseGuards(JwtAuthGuard)`) en `POST /api/simulations/calculate`. El handler llama a `calculateLoan()` y devuelve resultado inline — sin tocar DB, sin repositorio.
2. **Frontend** — Reemplazar `apps/web/app/page.tsx` con contenido landing. Crear `features/landing/` con `LandingHero`, `LandingFeatures`, `LandingCTA` y `PublicSimulatorSection`. Esta última reusa `SimulatorForm` y `AmortizationTable` (prop-driven, auth-agnostic). Hook `usePublicSimulator` usa `fetch` directo a `/api/simulations/calculate`.
3. **No cambios a Prisma** — cero migraciones. El endpoint público es puramente computacional.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `apps/api/src/shared/loan-calculator.ts` | **New** | `calculateLoan()` extraído de `customers/application/simulation/` |
| `apps/api/src/customers/application/simulation/loan-calculator.ts` | **Removed** | Re-export desde shared; archivo original se elimina |
| `apps/api/src/public/` | **New** | Módulo NestJS mínimo con `SimulationController` (stateless) |
| `apps/api/src/app.module.ts` | **Modified** | Importar `PublicModule` |
| `apps/web/app/page.tsx` | **Modified** | Reemplazar redirect por landing page |
| `apps/web/features/landing/` | **New** | Componentes: `LandingHero`, `LandingFeatures`, `LandingCTA`, `PublicSimulatorSection` |
| `apps/web/features/landing/hooks/use-public-simulator.ts` | **New** | Hook con `fetch` directo al endpoint público |
| `apps/web/providers/auth-provider.tsx` | **Modified** | Ya no redirige desde `/` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| CORS si landing y API en distinto origen | Bajo | Mismo dominio en MVP; si no, agregar `@EnableCors` en el controller |
| Rate limiting en endpoint público | Med | NestJS `@nestjs/throttler` — agregar si hay abuso. Ponytail: omitir en MVP |
| SEO nulo (cliente-only) | Med | Aceptado para MVP. Migrar a SSR cuando haya contenido estable |

## Rollback Plan

- Revertir `apps/web/app/page.tsx` al redirect anterior
- Eliminar `PublicModule` de `app.module.ts`
- No hay migraciones de DB que revertir
- El `loan-calculator.ts` en shared es aditivo — no rompe nada

## Dependencies

- Ninguna externa. Todo el stack ya está instalado (Next.js, NestJS, Zod, shadcn/ui).

## Success Criteria

- [ ] `GET /` renderiza landing page con hero, features, y simulador — sin redirect
- [ ] `POST /api/simulations/calculate` devuelve cálculo correcto sin JWT
- [ ] `SimulatorForm` + `AmortizationTable` funcionan en la landing (mismos componentes que en `/portal/simulator`)
- [ ] WhatsAppFloat visible en landing
- [ ] El simulador autenticado en `/portal/simulator` sigue funcionando sin cambios
- [ ] No hay migraciones de DB nuevas
