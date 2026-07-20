# Public Simulator Specification

## Purpose

Define un endpoint público y stateless de cálculo de amortización francesa. Cualquier visitante puede calcular cuotas sin autenticación. No se persiste ningún resultado.

## Requirements

### Requirement: Public Calculation Endpoint

The system MUST expose `POST /api/simulations/calculate` with no authentication guard. Accepts `{ amount: number, termMonths: number, annualRate: number }` and returns the French amortization breakdown.

#### Scenario: Standard calculation

- GIVEN no authentication token is provided
- WHEN `POST /api/simulations/calculate` with `{ "amount": 10000, "termMonths": 12, "annualRate": 12 }`
- THEN response status is `200 OK`
- AND body contains `monthlyPayment` (number), `totalInterest` (number), `totalPayment` (number), `schedule` (array)
- AND `schedule` has exactly 12 entries
- AND the last entry has `"balance": 0`

### Requirement: French Amortization Formula

The endpoint MUST compute using M = P × r(1+r)^n / ((1+r)^n − 1), where P = principal, r = monthly rate (annualRate/12/100), n = termMonths. When annualRate is 0, MUST compute as P/n with zero interest.

#### Scenario: Zero rate edge case

- GIVEN `POST /api/simulations/calculate`
- WHEN `{ "amount": 10000, "termMonths": 12, "annualRate": 0 }`
- THEN `monthlyPayment` equals 833.33 (10000 / 12)
- AND `totalInterest` equals 0
- AND each schedule entry has `"interest": 0`

#### Scenario: Formula correctness (known values)

- GIVEN `POST /api/simulations/calculate`
- WHEN `{ "amount": 10000, "termMonths": 24, "annualRate": 12 }`
- THEN `monthlyPayment` ≈ 470.73
- AND `totalPayment` ≈ 11297.52
- AND `totalInterest` ≈ 1297.52

### Requirement: Input Validation

Amount MUST be between 100 and 500,000 BOB. Term MUST be between 3 and 120 months. Annual rate MUST be between 5% and 36%. Validation MUST use a shared Zod schema defined in `packages/shared/`. Invalid inputs MUST return `400 Bad Request`.

#### Scenario: Amount below minimum

- GIVEN `POST /api/simulations/calculate`
- WHEN `{ "amount": 50, "termMonths": 12, "annualRate": 12 }`
- THEN response status is `400 Bad Request`
- AND error body indicates amount is below minimum (100)

#### Scenario: Amount exceeds maximum

- GIVEN `POST /api/simulations/calculate`
- WHEN `{ "amount": 600000, "termMonths": 12, "annualRate": 12 }`
- THEN response status is `400 Bad Request`

#### Scenario: Term exceeds maximum

- GIVEN `POST /api/simulations/calculate`
- WHEN `{ "amount": 10000, "termMonths": 180, "annualRate": 12 }`
- THEN response status is `400 Bad Request`

#### Scenario: Rate below minimum

- GIVEN `POST /api/simulations/calculate`
- WHEN `{ "amount": 10000, "termMonths": 12, "annualRate": 2 }`
- THEN response status is `400 Bad Request`

#### Scenario: Invalid JSON body

- GIVEN `POST /api/simulations/calculate`
- WHEN body is `{ "amount": "not-a-number", "termMonths": 12, "annualRate": 12 }`
- THEN response status is `400 Bad Request`

### Requirement: Stateless — No Persistence

The endpoint MUST NOT read or write any database table. It is purely computational.

#### Scenario: No DB write on calculation

- GIVEN `POST /api/simulations/calculate` with valid input
- WHEN the request completes
- THEN no row is inserted in `LoanSimulation` or any other table
- AND the response depends entirely on the input, not on any stored state

### Requirement: Shared Zod Schema

The input validation schema MUST live in `packages/shared/src/schemas/` for reuse between backend and frontend.

#### Scenario: Schema enforces same ranges on frontend

- GIVEN the Zod schema exported from `packages/shared`
- WHEN validated with `{ amount: 50, termMonths: 12, annualRate: 12 }` on the frontend
- THEN validation fails with amount below minimum
