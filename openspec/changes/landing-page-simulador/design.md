# Design: Landing Page + Public Simulator

## Technical Approach

Minimal back-end surface (stateless controller, pure function extraction). Front-end reuses auth simulator components via props. Zero DB changes.

**Strategy**: Extract `calculateLoan()` to `apps/api/src/shared/` so both the auth'd handler and the public controller import from the same place. Landing page replaces the `/` redirect with static content + an embedded simulator section that reuses `SimulatorForm` and `AmortizationTable` unchanged.

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Public endpoint module | `apps/api/src/public/` with a thin controller | No handlers/repos needed. Controller calls `calculateLoan` directly. Minimal NestJS module: 1 controller + 1 module file |
| Calculator location | `apps/api/src/shared/loan-calculator.ts` | Pure function, reused by auth handler and public controller. Original file in `customers/` becomes a re-export barrel to avoid breaking existing imports |
| Zod schema | New `PublicSimulateSchema` in `packages/shared/src/schemas/simulation.schema.ts` | Spec requires tighter bounds (amount 100-500k, term 3-120, rate 5-36) than existing `CreateSimulationSchema` (1-120, positive amount, rate max 100). Separate schema keeps each validation context-correct |
| AmortizationTable reuse | Make `id`/`createdAt` optional in `SimulationResult` | Ponytail: one type change instead of wrapping or duplicating the component. Auth portal always provides them; public endpoint omits them |
| Landing page client model | Static page content, no SSR | Spec accepts client-only MVP. Replaces redirect in `page.tsx` with landing content. No Next.js SSR/ISR changes |
| Nav header | Inline in landing page, not in root layout | Auth pages have their own nav (sidebar). Adding a landing header to the root layout would affect login/register. Landing page component with its own header keeps concerns separate |
| AuthProvider impact | None | Redirect lives in `page.tsx` `useEffect`, not in `AuthProvider`. Removing the redirect effect and rendering landing content is the only change |

## File Changes

| File | Action | Purpose |
|------|--------|---------|
| `apps/api/src/shared/loan-calculator.ts` | **Create** | Extracted `calculateLoan()`, `LoanResult`, `AmortizationRow` from customers module |
| `apps/api/src/customers/application/simulation/loan-calculator.ts` | **Modify** | Re-export from `../../shared/loan-calculator` (preserves existing imports) |
| `apps/api/src/public/public.controller.ts` | **Create** | `POST /api/simulations/calculate` — stateless, no guards, calls `calculateLoan()` directly |
| `apps/api/src/public/public.module.ts` | **Create** | NestJS module registering `PublicController` |
| `apps/api/src/app.module.ts` | **Modify** | Import `PublicModule` |
| `packages/shared/src/schemas/simulation.schema.ts` | **Create** | `PublicSimulateSchema` with spec bounds + `SimulateLoanInput`/`PublicSimulationResult` types |
| `packages/shared/src/index.ts` | **Modify** | Export new simulation schema/types |
| `apps/web/app/page.tsx` | **Modify** | Replace redirect with `LandingPage` component |
| `apps/web/features/landing/components/landing-hero.tsx` | **Create** | Hero: value prop heading, subtitle, WhatsApp + Register CTAs |
| `apps/web/features/landing/components/landing-features.tsx` | **Create** | Features grid (3 cards: how it works) |
| `apps/web/features/landing/components/landing-header.tsx` | **Create** | Sticky header: logo, Registrarse, Iniciar sesión links |
| `apps/web/features/landing/components/landing-footer.tsx` | **Create** | Footer: brand, copyright |
| `apps/web/features/landing/components/public-simulator-section.tsx` | **Create** | Simulator section wrapping `SimulatorForm` + `AmortizationTable` |
| `apps/web/features/landing/hooks/use-public-simulator.ts` | **Create** | Hook calling `POST /api/simulations/calculate` via raw `fetch` (no auth) |
| `apps/web/features/portal/components/amortization-table.tsx` | **Modify** | Make `id`/`createdAt` optional in `SimulationResult` interface |
| `apps/api/src/customers/application/simulation/loan-calculator.spec.ts` | **Modify** | Change import path to `shared/loan-calculator` |

## Data Flow

```
Visitor → GET /
  └─ LandingPage renders (server → client)
       ├── LandingHeader (logo, nav links)
       ├── LandingHero (title, subtitle, CTAs)
       ├── LandingFeatures (3× cards)
       ├── PublicSimulatorSection
       │    ├── SimulatorForm (client-side instant calc via calculateLoan copy in component)
       │    │    └── User clicks "Simular"
       │    │         └── usePublicSimulator.calculate(input)
       │    │              └── fetch POST /api/simulations/calculate (no auth headers)
       │    │                   └── PublicController.calculate()
       │    │                        └── calculateLoan(amount, rate, term)  [pure function]
       │    │                             └── JSON response { monthlyPayment, totalPayment, totalInterest, schedule }
       │    └── AmortizationTable (renders schedule + summary)
       └── LandingFooter
└── WhatsAppFloat (from root layout — always visible)
```

## Key Interfaces

### Backend — PublicController

```ts
// apps/api/src/public/public.controller.ts
@Controller('api/simulations')
export class PublicController {
  constructor(
    @Inject(ConfigurationService) private readonly config: ConfigurationService,
  ) {}

  @Post('calculate')
  @HttpCode(200)
  calculate(
    @Body(new ZodValidationPipe(PublicSimulateSchema)) input: SimulateLoanInput,
  ): PublicSimulationResult {
    return calculateLoan(input.amount, input.annualRate, input.termMonths);
  }
}
```

### Shared — Simulation Schema

```ts
// packages/shared/src/schemas/simulation.schema.ts
export const PublicSimulateSchema = z.object({
  amount: z.number().min(100).max(500000),
  termMonths: z.number().int().min(3).max(120),
  annualRate: z.number().min(5).max(36),
});

export interface PublicSimulationResult {
  monthlyPayment: number;
  totalInterest: number;
  totalPayment: number;
  schedule: AmortizationRow[];
}

// AmortizationRow is already defined and shared via loan-calculator
```

### Frontend — usePublicSimulator

```ts
// apps/web/features/landing/hooks/use-public-simulator.ts
export function usePublicSimulator() {
  const [result, setResult] = useState<PublicSimulationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculate = useCallback(async (input: SimulateLoanInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/simulations/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? 'Error al calcular');
      }
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al calcular');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { result, isLoading, error, calculate };
}
```

### Frontend — AmortizationTable (modified)

```ts
// id and createdAt become optional for public use
export interface SimulationResult {
  id?: string;          // ← was required
  amount: number;
  termMonths: number;
  annualRate: number;
  monthlyPayment: number;
  totalInterest: number;
  totalPayment: number;
  schedule: AmortizationRow[];
  createdAt?: string;   // ← was required
}
```

## Component Tree

```
Page (/)
├── LandingHeader
│   ├── Logo (text/brand)
│   └── Nav
│       ├── "Registrarse" → /auth/register
│       └── "Iniciar sesión" → /auth/login
├── LandingHero
│   ├── h1 (value proposition)
│   ├── p (subtitle)
│   └── CTAs
│       ├── Button "Solicitar por WhatsApp" → wa.me/<phone>
│       └── Button "Registrarse" → /auth/register
├── LandingFeatures
│   └── FeatureCard × 3 (icon, title, description)
├── PublicSimulatorSection
│   ├── SectionTitle + Description
│   ├── SimulatorForm (reused, props: onSimulate, isLoading)
│   └── AmortizationTable (reused, props: result | null)
├── LandingFooter
│   ├── Brand text
│   └── Copyright
└── WhatsAppFloat (from root layout, always mounted)
```

## Testing Strategy

| Layer | What | How |
|-------|------|-----|
| Unit | `calculateLoan` in shared | Move existing `loan-calculator.spec.ts` to `apps/api/src/shared/` — same tests, new import path |
| Unit | `PublicController` | NestJS controller spec: valid input → 200 + correct shape; invalid input → 400; zero rate → correct edge case |
| Integration | Public endpoint | `curl POST /api/simulations/calculate` — verify no auth, correct response, 400 on bad input |
| Unit | `usePublicSimulator` | Hook test: verify `fetch` called with correct URL/body/headers, no auth header, error handling |
| E2E | Landing page renders | Manual: load `/`, verify hero, features, simulator form visible, WhatsAppFloat present |
| E2E | Full simulation flow | Manual: fill simulator, submit, verify amortization table renders, summary values correct |
| Regression | Auth simulator | Verify `POST /api/customers/me/simulations` still works (uses same `calculateLoan`) |

## Migration / Rollout

**No DB migration required.** The endpoint is purely computational.

**No feature flags needed.** This is additive — the old redirect path is replaced entirely.

**Rollback**: Revert `page.tsx` to redirect, remove `PublicModule` from `app.module.ts`. Calculator extraction is additive — reverting not required for safety.
