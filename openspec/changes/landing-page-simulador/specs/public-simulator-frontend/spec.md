# Public Simulator Frontend Specification

## Purpose

Define la integración frontend del simulador público en la landing page. Reutiliza componentes existentes del portal (`SimulatorForm`, `AmortizationTable`) y agrega un hook específico para el endpoint público sin autenticación.

## Requirements

### Requirement: Reuse SimulatorForm

The landing page simulator section MUST import and render `SimulatorForm` from `features/portal/simulator/`. The component MUST work identically to the portal version: sliders for amount, term, rate; instant client-side payment estimate; submit button.

#### Scenario: Form renders on landing page

- GIVEN a visitor on the landing page
- WHEN scrolling to the simulator section
- THEN `SimulatorForm` is rendered with amount slider (default 5000, step 100), term slider (default 12, step 1), rate slider (default 15, step 0.5)
- AND the estimated monthly payment updates instantly as sliders move
- AND a "Simular" button is visible

#### Scenario: Form submission calls public API

- GIVEN a visitor on the landing page
- WHEN setting amount=5000, term=12, rate=15 and clicking "Simular"
- THEN a request is sent to `POST /api/simulations/calculate`
- AND no `Authorization` header is included

### Requirement: Reuse AmortizationTable

After a successful calculation, the landing page MUST display `AmortizationTable` from `features/portal/simulator/` with the same column structure: Mes, Cuota, Interés, Capital, Saldo.

#### Scenario: Amortization table renders after submit

- GIVEN a visitor submits the simulator with amount=5000, term=12, rate=15
- WHEN the API returns a successful response
- THEN `AmortizationTable` renders below the form
- AND the table has 12 rows corresponding to each month
- AND columns are: Mes, Cuota, Interés, Capital, Saldo
- AND the last row has Saldo = 0
- AND a summary below the table shows "Total a Pagar" and "Total Intereses"

### Requirement: Public Hook (usePublicSimulator)

The system MUST provide `usePublicSimulator` hook at `features/landing/hooks/use-public-simulator.ts`. It MUST use `fetch` directly (not TanStack Query) and MUST NOT attach auth headers.

Signature:

```
usePublicSimulator(): {
  calculate: (input: SimulateLoanInput) => Promise<SimulationResult>;
  isLoading: boolean;
  error: string | null;
  result: SimulationResult | null;
}
```

#### Scenario: Hook calls public endpoint without auth

- GIVEN `usePublicSimulator` is initialized
- WHEN `calculate({ amount: 5000, termMonths: 12, annualRate: 15 })` is called
- THEN a `POST` request is sent to `/api/simulations/calculate`
- AND no `Authorization` header is present in the request
- AND `isLoading` becomes `true` then `false` after the response
- AND `result` contains `monthlyPayment`, `totalInterest`, `totalPayment`, and `schedule`

#### Scenario: Hook handles API error

- GIVEN `usePublicSimulator` is initialized
- WHEN `calculate({ amount: 50, termMonths: 12, annualRate: 15 })` is called (invalid amount)
- THEN `error` contains the error message from the API response
- AND `result` remains `null`
- AND `isLoading` transitions back to `false`

### Requirement: Client-Side Instant Calculation

The landing page simulator MUST include the same client-side French amortization formula used in the portal for instant feedback. The formula MUST be identical to the backend to ensure consistency.

#### Scenario: Instant feedback on slider change

- GIVEN a visitor on the landing page simulator
- WHEN changing the amount slider from 5000 to 10000
- THEN the estimated monthly payment updates immediately
- AND no network request is made during slider adjustment

#### Scenario: Client-side calc matches backend

- GIVEN a visitor sees an estimated payment of 470.73 for 10000/24/12%
- WHEN clicking "Simular" with the same values
- THEN the API returns `monthlyPayment: 470.73` (matching the client estimate)
- AND the client-side and server-side values match to 2 decimal places

### Requirement: No Simulation History

The public simulator MUST NOT display simulation history. Stateless by design — no "Simulaciones anteriores" accordion.

#### Scenario: History is absent

- GIVEN a visitor on the landing page simulator
- WHEN running one or more simulations
- THEN no history list or accordion is displayed below the table
- AND no "Simulaciones anteriores" section exists on the landing page
