# Tasks: Landing Page + Public Simulator

## Review Workload Forecast

~620-720 líneas estimadas (backend: ~200, frontend: ~450). Sin migraciones de DB.
Decision needed before apply: No. Chained PRs: Yes (stacked-to-main).
Budget risk: Low.

**PR 1** — Backend: Public Simulator Endpoint (~200 lines) ✅
**PR 2** — Frontend: Landing Page + Public Simulator UI (~450 lines) ✅

---

## PR 1 — Backend: Public Simulator Endpoint

### Phase 1: Extract `calculateLoan()` to Shared

- [x] 1.1 Crear `apps/api/src/shared/loan-calculator.ts` — mover `calculateLoan()`, `LoanResult`, `AmortizationRow` desde `customers/application/simulation/loan-calculator.ts`. Sin cambios de lógica. Las interfaces y la función son idénticas al original:
  ```ts
  export interface AmortizationRow { period: number; payment: number; interest: number; principal: number; balance: number; }
  export interface LoanResult { monthlyPayment: number; totalInterest: number; totalPayment: number; schedule: AmortizationRow[]; }
  export function calculateLoan(amount: number, annualRate: number, termMonths: number): LoanResult { ... }
  ```
- [x] 1.2 Modificar `apps/api/src/customers/application/simulation/loan-calculator.ts` — reemplazar todo el contenido por un re-export:
  ```ts
  export { calculateLoan, LoanResult, AmortizationRow } from '../../../shared/loan-calculator';
  ```
  Esto preserva imports existentes en `create-simulation.handler.ts` y `loan-calculator.spec.ts`.
- [x] 1.3 Mover `apps/api/src/customers/application/simulation/loan-calculator.spec.ts` a `apps/api/src/shared/loan-calculator.spec.ts` — cambiar el import a `'./loan-calculator'` (apunta al nuevo shared). Mantener los 6 tests existentes idénticos.

### Phase 2: Shared Zod Schema for Public Simulator

- [x] 2.1 Crear `packages/shared/src/schemas/simulation.schema.ts` con el nuevo schema público y sus tipos inferidos:
  ```ts
  import { z } from 'zod';

  export const PublicSimulateSchema = z.object({
    amount: z.number().min(100).max(500000),
    termMonths: z.number().int().min(3).max(120),
    annualRate: z.number().min(5).max(36),
  });

  export type SimulateLoanInput = z.infer<typeof PublicSimulateSchema>;
  ```
  Nota: `annualRate` mínimo 5% (no 0) porque es el rango real del producto. El spec `public-simulator` escenario "zero rate" es un edge case del calculador subyacente, no del endpoint público.

### Phase 3: PublicModule + PublicController

- [x] 3.1 Crear `apps/api/src/public/public.module.ts` — módulo NestJS mínimo:
  ```ts
  import { Module } from '@nestjs/common';
  import { PublicController } from './public.controller';

  @Module({
    controllers: [PublicController],
  })
  export class PublicModule {}
  ```
- [x] 3.2 Crear `apps/api/src/public/public.controller.ts` — controller stateless sin guards:
  ```ts
  import { Controller, Post, Body, HttpCode, Inject } from '@nestjs/common';
  import { PublicSimulateSchema } from '@prestamos/shared';
  import type { SimulateLoanInput } from '@prestamos/shared';
  import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe';
  import { calculateLoan } from '../../shared/loan-calculator';
  import type { LoanResult } from '../../shared/loan-calculator';

  @Controller('api/simulations')
  export class PublicController {
    @Post('calculate')
    @HttpCode(200)
    calculate(
      @Body(new ZodValidationPipe(PublicSimulateSchema)) input: SimulateLoanInput,
    ): LoanResult {
      return calculateLoan(input.amount, input.annualRate, input.termMonths);
    }
  }
  ```
  - **Sin `ConfigurationService`** — no se necesita en MVP (ponytail: rate limiting se agrega si hay abuso).
  - **Sin auth guards** — endpoint público deliberadamente.
  - **Sin DB reads/writes** — puramente computacional.

### Phase 4: Wire PublicModule en AppModule

- [x] 4.1 Modificar `apps/api/src/app.module.ts` — agregar `PublicModule` a `imports`:
  ```ts
  import { PublicModule } from './public/public.module';
  // dentro de imports: ..., PublicModule,
  ```
  (Entre `WhatsAppModule` y el cierre del array.)

### Phase 5: Export Schema desde Shared Package

- [x] 5.1 Modificar `packages/shared/src/index.ts` — agregar:
  ```ts
  export * from './schemas/simulation.schema';
  ```

### Phase 6: Tests

- [x] 6.1 **Unit: shared/loan-calculator.spec.ts** — el spec movido en 1.3 ya cubre. Verificar que pasa con el nuevo import path.
- [x] 6.2 **Unit: PublicController spec** — crear `apps/api/src/public/public.controller.spec.ts`:
  ```ts
  // Mock del pipe de validación — enviar body ya validado
  // Test: input válido (amount=10000, termMonths=12, annualRate=12) → 200 + LoanResult shape
  // Test: input con monto 50 (inválido) → el pipe lanza BadRequest antes de llegar al handler
  // (ponytail: el pipe se testea separadamente; el controller spec verifica que el handler llama calculateLoan y devuelve el resultado correcto)
  ```
  - Test 1: `calculate()` llama a `calculateLoan()` y devuelve `LoanResult` con `monthlyPayment`, `totalInterest`, `totalPayment`, `schedule`.
  - Test 2: schedule tiene `termMonths` entradas, última con `balance: 0`.

### Verify PR 1

```bash
pnpm --filter @prestamos/api exec npx tsc --noEmit
pnpm lint
pnpm build
pnpm --filter @prestamos/api exec vitest run apps/api/src/shared/loan-calculator.spec.ts
pnpm --filter @prestamos/api exec vitest run apps/api/src/public/public.controller.spec.ts
pnpm --filter @prestamos/api exec vitest run apps/api/src/customers/application/simulation/create-simulation.handler.spec.ts
```

---

## PR 2 — Frontend: Landing Page + Public Simulator UI

### Phase 0: Make `id`/`createdAt` Optional in AmortizationTable

- [x] 0.1 Modificar `apps/web/features/portal/components/amortization-table.tsx` — cambiar `SimulationResult.id` y `SimulationResult.createdAt` a optional:
  ```ts
  export interface SimulationResult {
    id?: string;
    ...
    createdAt?: string;
  }
  ```
  Esto permite que el mismo componente funcione con datos del portal (con id/createdAt) y del simulador público (sin ellos). La interfaz se usa solo en `AmortizationTableProps` — no afecta al portal porque el portal siempre provee ambos campos.

### Phase 1: Landing Components

- [x] 1.1 Crear `apps/web/features/landing/components/landing-header.tsx`:
  - Sticky header con fondo `bg-background/95 backdrop-blur` y borde inferior
  - Logo "Préstamos App" a la izquierda (texto o brand mark)
  - Nav links a la derecha: "Registrarse" → `/register`, "Iniciar sesión" → `/login`
  - Mobile (<768px): hamburger menu (Sheet) con los mismos links
  - Usar `max-w-6xl mx-auto px-4` para contener el contenido
  - Ponytail: sin logo image — solo texto. Agregar cuando haya identidad visual definida.

- [x] 1.2 Crear `apps/web/features/landing/components/landing-hero.tsx`:
  - Centered layout, fondo con gradient `bg-gradient-to-b from-primary/10 via-background to-background`
  - Heading: "Préstamos rápidos, seguros y sin papeleo"
  - Subtitle: value prop explicativo
  - Dos CTAs: "Solicitar por WhatsApp" (whatsapp link, condicional) y "Crear Cuenta" → `/register`
  - `min-h-[80vh]`

- [x] 1.3 Crear `apps/web/features/landing/components/landing-features.tsx`:
  - Section title "¿Cómo funciona?" centered
  - Grid responsivo: `grid grid-cols-1 md:grid-cols-3 gap-8`
  - 3 feature cards: Solicitud Online, Aprobación Rápida, Sin Garante
  - Iconos lucide, `py-16 md:py-24`

- [x] 1.4 Crear `apps/web/features/landing/components/landing-footer.tsx`:
  - Footer simple con borde superior y copyright

### Phase 2: Public Simulator Hook

- [x] 2.1 Crear `apps/web/features/landing/hooks/use-public-simulator.ts`:
  - Hook con `useCallback` y `useState`
  - fetch directo a `/api/simulations/calculate` sin auth headers
  - Sin TanStack Query — ponytail

### Phase 3: Public Simulator Section

- [x] 3.1 Crear `apps/web/features/landing/components/public-simulator-section.tsx`:
  - Section con fondo `bg-muted/50`
  - Título: "Simulá tu préstamo"
  - Importa `SimulatorForm` y `AmortizationTable`
  - Usa `usePublicSimulator` hook
  - Muestra error inline y amortization table condicionalmente

### Phase 4: Rewrite Landing Page

- [x] 4.1 Modificar `apps/web/app/page.tsx` — reemplazar redirect por landing page:
  - Sin `useAuth`, sin `useEffect`, sin `useRouter`
  - Layout simple con Header, Hero, Features, Simulator, Footer

### Phase 5: Stories

- [x] 5.1 Crear `apps/web/stories/LandingHeader.stories.tsx` — Default
- [x] 5.2 Crear `apps/web/stories/LandingHero.stories.tsx` — Default
- [x] 5.3 Crear `apps/web/stories/LandingFeatures.stories.tsx` — Default
- [x] 5.4 Crear `apps/web/stories/LandingFooter.stories.tsx` — Default
- [x] 5.5 Crear `apps/web/stories/PublicSimulatorSection.stories.tsx` — Default

### Phase 6: Tests

- [x] 6.1 **Unit: usePublicSimulator hook** — crear `apps/web/features/landing/hooks/__tests__/use-public-simulator.test.ts`:
  - Test 1: POST request to `/api/simulations/calculate` with correct body
  - Test 2: API error handling
  - Test 3: No Authorization header
  - Test 4: reset() clears state

### Verify PR 2

```bash
pnpm --filter @prestamos/web exec npx tsc --noEmit
pnpm lint
pnpm build
pnpm --filter @prestamos/web exec vitest run apps/web/features/landing/hooks/__tests__/use-public-simulator.test.ts
```
