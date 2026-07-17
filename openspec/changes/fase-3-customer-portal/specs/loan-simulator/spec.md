# Delta for Loan Simulator

## NEW Requirements

### Requirement: Simulate Loan (`POST /api/customers/me/simulate`)

El sistema DEBE exponer `POST /api/customers/me/simulate` protegido por JWT y CustomerGuard. Recibe `{ "amount": number, "termMonths": number, "annualRate": number }`. Calcula la cuota fija (método francés), total a pagar, y guarda el resultado en `LoanSimulation`. Responde con `{ "monthlyPayment", "totalPayment", "totalInterest", "schedule": [...] }` donde `schedule` es un array de `{ "month", "payment", "interest", "principal", "balance" }` para cada mes del plazo.

(Requirement nuevo)

#### Scenario: Successful simulation

- GIVEN an authenticated Customer
- WHEN `POST /api/customers/me/simulate` is called with `{ "amount": 5000, "termMonths": 12, "annualRate": 15 }`
- THEN response status is `201 Created`
- AND `monthlyPayment` is a positive decimal (cuota fija)
- AND `totalPayment` equals `monthlyPayment * 12`
- AND `totalInterest` equals `totalPayment - 5000`
- AND `schedule` has exactly 12 entries
- AND the first entry has `{ "month": 1, "payment": <monthlyPayment>, "interest": <calculated>, "principal": <payment - interest>, "balance": <5000 - principal> }`
- AND the last entry has `"balance": 0`
- AND the simulation is persisted in `LoanSimulation`

#### Scenario: Zero amount rejected

- GIVEN an authenticated Customer
- WHEN `POST /api/customers/me/simulate` is called with `{ "amount": 0, "termMonths": 12, "annualRate": 15 }`
- THEN response status is `400 Bad Request`
- AND error indicates amount must be greater than 0

#### Scenario: Negative term rejected

- GIVEN an authenticated Customer
- WHEN `POST /api/customers/me/simulate` is called with `{ "amount": 5000, "termMonths": -1, "annualRate": 15 }`
- THEN response status is `400 Bad Request`

#### Scenario: Simulation with zero rate (simple interest edge case)

- GIVEN an authenticated Customer
- WHEN `POST /api/customers/me/simulate` is called with `{ "amount": 5000, "termMonths": 12, "annualRate": 0 }`
- THEN response status is `201 Created`
- AND `monthlyPayment` equals `amount / termMonths` (416.67)
- AND `totalInterest` is 0
- AND each schedule entry has `interest: 0`

#### Scenario: Formula correctness check (known values)

- GIVEN an authenticated Customer
- WHEN `POST /api/customers/me/simulate` is called with `{ "amount": 10000, "termMonths": 24, "annualRate": 12 }`
- THEN `monthlyPayment` is approximately 470.73 (standard amortization formula)
- AND `totalPayment` is approximately 11297.52
- AND `totalInterest` is approximately 1297.52

---

### Requirement: Calculator — French Amortization (frontend)

El frontend DEBE implementar la misma fórmula de cálculo de cuota fija (método francés) para respuesta instantánea mientras el usuario ajusta los sliders. NO llama a la API hasta que el usuario hace clic en "Simular". La fórmula usada en frontend y backend DEBE ser idéntica:

```
monthlyRate = annualRate / 12 / 100
payment = round(amount * (monthlyRate * (1 + monthlyRate)^termMonths) / ((1 + monthlyRate)^termMonths - 1), 2)
```

Si `annualRate` es 0: `payment = round(amount / termMonths, 2)`

(Requirement nuevo)

#### Scenario: Calculator provides instant feedback

- GIVEN an authenticated Customer viewing `/portal/simulator`
- WHEN adjusting the amount slider from 1000 to 5000
- THEN the estimated monthly payment updates instantly on every change (no API call)

---

### Requirement: List My Simulations (`GET /api/customers/me/simulations`)

El sistema DEBE exponer `GET /api/customers/me/simulations` protegido por JWT y CustomerGuard que devuelva el historial de simulaciones del cliente ordenado por `createdAt` descendente. Cada item incluye `{ "id", "amount", "termMonths", "interestRate", "monthlyPayment", "totalPayment", "createdAt" }`. Sin el schedule completo para no sobrecargar la respuesta — el schedule solo se devuelve en el POST.

(Requirement nuevo)

#### Scenario: List simulations returns history

- GIVEN an authenticated Customer with 5 saved simulations
- WHEN `GET /api/customers/me/simulations` is called
- THEN response status is `200 OK`
- AND the response is an array of 5 simulations
- AND each simulation has `{ "id", "amount", "monthlyPayment", "totalPayment", "createdAt" }`
- AND no simulation includes a `schedule` field

#### Scenario: Empty history

- GIVEN an authenticated Customer with zero simulations
- WHEN `GET /api/customers/me/simulations` is called
- THEN response status is `200 OK`
- AND the response is an empty array `[]`

---

### Requirement: Simulator Page (`/portal/simulator`)

El sistema DEBE mostrar la ruta `/portal/simulator` con: sliders/inputs para **Monto** (100-50000, step 100), **Plazo** (1-60 meses, step 1), **Tasa anual** (0-50%, step 0.5). El cálculo de cuota se actualiza en tiempo real. Al hacer clic "Simular", se persiste la simulación vía `POST /api/customers/me/simulate` y se muestra la tabla de amortización completa con scroll y las columnas: Mes, Cuota, Interés, Capital, Saldo. Debajo de la tabla: resumen con Total a Pagar, Total Intereses. Historial de últimas 5 simulaciones en un acordeón "Simulaciones anteriores".

(Requirement nuevo)

#### Scenario: Simulator interactive form

- GIVEN an authenticated Customer viewing `/portal/simulator`
- THEN three sliders/inputs are visible: Monto (default 5000), Plazo (default 12), Tasa (default 15)
- AND the estimated monthly payment is displayed and updates as sliders move (no API call)
- AND a "Simular" button is visible

#### Scenario: Run simulation shows amortization table

- GIVEN an authenticated Customer viewing `/portal/simulator`
- WHEN setting Monto=5000, Plazo=12, Tasa=15 and clicking "Simular"
- THEN `POST /api/customers/me/simulate` is called
- AND a full amortization table is displayed below with 12 rows
- AND each row shows Month, Payment, Interest, Principal, Balance
- AND the last row has Balance=0
- AND the summary shows Total a Pagar and Total Intereses

#### Scenario: Simulation persisted to history

- GIVEN an authenticated Customer viewing `/portal/simulator`
- WHEN running a simulation
- THEN the "Simulaciones anteriores" accordion shows the new simulation at the top
- AND clicking the accordion lists the last 5 simulations with amount, term, date

#### Scenario: Rate validation

- GIVEN an authenticated Customer viewing `/portal/simulator`
- WHEN entering rate 60% (> 50 max)
- THEN the input shows validation error "Tasa máxima 50%"
- AND the "Simular" button is disabled

---

### Requirement: Shared Zod Schemas for Simulator

El sistema DEBE definir schemas Zod en `packages/shared/src/schemas/customer.schema.ts` para `simulateLoanSchema` (amount: number positive, termMonths: int 1-60, annualRate: number 0-50) y `simulationResponseSchema`. Estos schemas DEBEN ser consumidos tanto por el backend (NestJS ValidationPipe) como por el frontend (React Hook Form + Zod resolver).

(Requirement nuevo)

#### Scenario: Shared schema validates backend input

- GIVEN a `simulateLoanSchema` in shared package
- WHEN `POST /api/customers/me/simulate` receives `{ "amount": "not-a-number" }`
- THEN NestJS ValidationPipe rejects with `400 Bad Request`

#### Scenario: Shared schema validates frontend input

- GIVEN a `simulateLoanSchema` in shared package
- WHEN the simulator form receives `{ "amount": 100000 }` (> 50000)
- THEN the Zod schema rejects the input
- AND a frontend validation error is shown: "Monto máximo Bs 50.000"
