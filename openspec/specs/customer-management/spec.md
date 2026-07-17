# Customer Management Specification

## Purpose

Define the customer bounded context: personal data, employment, income, bank accounts, and the 1:1 link to users.

## Requirements

### Requirement: Customer Entity

The system MUST store customers with: `id`, `userId` (unique FK → User), `ci`, `firstName`, `lastName`, `phone`, `email`, `dateOfBirth`, `gender`, `maritalStatus`, `nationality`, `city`, `address`, plus base fields (`createdAt`, `updatedAt`, `deletedAt`, `version`).

#### Scenario: Create customer with minimum fields

- GIVEN a valid `userId`, `ci`, `firstName`, `lastName`, and `phone`
- WHEN `POST /api/customers` is called
- THEN a customer record is created with the given data
- AND the response is `201 Created` with the customer ID

#### Scenario: Duplicate CI rejected

- GIVEN an active customer with CI `1234567`
- WHEN creating a customer with the same CI
- THEN the response is `409 Conflict`

### Requirement: Employment and Income

The system MUST store employment data per customer: `employer`, `position`, `startDate`, `monthlyIncome`, `incomeCurrency` (default BOB), `incomeType` (DEPENDENT/INDEPENDENT/PROFESSIONAL). Each customer SHALL have at most one active employment record.

#### Scenario: Upsert employment

- GIVEN an existing customer with no employment record
- WHEN `PUT /api/customers/:id/employment` is called
- THEN the employment record is created
- AND a second call with different data updates it

### Requirement: Bank Accounts

The system MUST store customer bank accounts: `bankName`, `accountType` (SAVINGS/CHECKING), `accountNumber`, `isDefault`. A customer MAY have multiple accounts. Only one account MAY be default at a time.

#### Scenario: Add default account

- GIVEN an existing customer with no accounts
- WHEN `POST /api/customers/:id/bank-accounts` is called with `isDefault=true`
- THEN a savings account is created as default

### Requirement: Customer CRUD

The system MUST expose `GET /api/customers/:id`, `PUT /api/customers/:id`, and `DELETE /api/customers/:id` (soft delete). GET by userId MUST be supported via `GET /api/customers/by-user/:userId`. Soft-deleted customers MUST return `404`.

#### Scenario: Get customer by userId

- GIVEN a customer linked to `userId=42`
- WHEN `GET /api/customers/by-user/42` is called
- THEN the response is `200` with full customer data

#### Scenario: Soft delete

- GIVEN an active customer
- WHEN `DELETE /api/customers/:id` is called
- THEN `deletedAt` is set
- AND subsequent `GET` returns `404`

### Requirement: Profile Completion

The system MUST compute a profile completion percentage based on: CI, address, employment, and at least one bank account. Each section counts 25%.

#### Scenario: Half-complete profile

- GIVEN a customer with CI and address but no employment or bank account
- WHEN checking completion
- THEN the score is 50%
