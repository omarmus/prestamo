# Customer Portal Specification

## Purpose

Define the authenticated customer portal: protected layout, dashboard with financial summary, profile management, and navigation.

## Requirements

### Requirement: Protected Portal Layout

Routes under `/portal/*` MUST require a valid JWT. Unauthenticated requests MUST redirect to `/login`. The layout MUST include a sidebar with navigation links and a top bar with the customer name.

#### Scenario: Unauthenticated redirect

- GIVEN a request to `/portal/dashboard` without a JWT
- WHEN the page loads
- THEN the user is redirected to `/login`

#### Scenario: Authenticated layout renders

- GIVEN an authenticated user with a linked customer
- WHEN `/portal/dashboard` is accessed
- THEN the sidebar and top bar render with navigation links

### Requirement: Dashboard Summary

The dashboard MUST show: customer name, profile completion percentage, document count, and the most recent simulation result (if any). Each section SHOULD link to its full page. An empty state MUST display for new customers.

#### Scenario: Dashboard with data

- GIVEN a customer with 3 documents and 1 simulation
- WHEN `/portal/dashboard` renders
- THEN it shows name, "3 documentos", and the last simulation amount

#### Scenario: Empty state

- GIVEN a newly registered customer with no documents or simulations
- WHEN `/portal/dashboard` renders
- THEN it shows a welcome message and prompts to upload documents

### Requirement: Profile Page

The portal MUST expose `/portal/profile` to view and edit personal data, employment, and bank accounts. Changes MUST persist via `PUT /api/customers/:id`.

#### Scenario: Update address

- GIVEN an authenticated customer at `/portal/profile`
- WHEN the user updates their address and saves
- THEN the customer record is updated
- AND the page shows a success toast

### Requirement: Sidebar Navigation

The sidebar MUST include links to: Dashboard, Profile, Documentos, and Simulador. The active route MUST be highlighted.

#### Scenario: Navigate to documents

- GIVEN an authenticated user on `/portal/dashboard`
- WHEN clicking "Documentos" in the sidebar
- THEN the browser navigates to `/portal/documents`
- AND "Documentos" is highlighted as active
