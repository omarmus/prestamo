# Loan Simulator Specification

## Purpose

Define the loan simulation feature: calculate estimated monthly payments via French amortization, with input validation and persistent history.

## Requirements

### Requirement: Loan Calculation

The system MUST calculate the fixed monthly payment using French amortization: `M = P * (r(1+r)^n) / ((1+r)^n - 1)`, where P = principal, r = monthly rate, n = months. The response MUST include `monthlyPayment`, `totalInterest`, `totalPayment`, and an amortization table (per-period breakdown).

#### Scenario: Standard calculation

- GIVEN amount=10000, term=12 months, annual rate=12%
- WHEN `POST /api/simulations/calculate` is called
- THEN the response includes `monthlyPayment`, `totalInterest`, `totalPayment`, and 12 amortization rows

#### Scenario: Zero rate edge case

- GIVEN amount=10000, term=12 months, annual rate=0%
- WHEN the calculation runs
- THEN monthlyPayment = 833.33 (10000/12) and totalInterest = 0

### Requirement: Input Validation

Amount MUST be between 1,000 and 500,000 BOB. Term MUST be between 3 and 120 months. Annual rate MUST be between 5% and 36%. Invalid inputs MUST return `400 Bad Request`.

#### Scenario: Amount below minimum

- GIVEN amount=500 BOB
- WHEN `POST /api/simulations/calculate` is called
- THEN the response is `400 Bad Request`

#### Scenario: Term exceeds maximum

- GIVEN term=180 months
- WHEN the calculation runs
- THEN the response is `400 Bad Request`

### Requirement: Simulation History

Each calculation MUST be saved linked to the customer. Saved fields: `amount`, `term`, `annualRate`, `monthlyPayment`, `totalInterest`, `totalPayment`. The system MUST expose `GET /api/simulations` (list, newest first) and `DELETE /api/simulations/:id`.

#### Scenario: History listing

- GIVEN a customer with 3 saved simulations
- WHEN `GET /api/simulations` is called
- THEN 3 results are returned, sorted by `createdAt` descending

#### Scenario: Delete simulation

- GIVEN a saved simulation owned by the customer
- WHEN `DELETE /api/simulations/:id` is called
- THEN it is soft-deleted and excluded from listings
