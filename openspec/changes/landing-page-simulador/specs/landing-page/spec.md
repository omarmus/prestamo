# Landing Page Specification

## Purpose

Define la landing page pública en `/` — la puerta de entrada principal para adquisición de prospects. Muestra la propuesta de valor, el funcionamiento del servicio y un simulador de préstamos embebido para engagement sin registro.

## Dependencies

Esta especificación depende de:
- `landing-widget` — WhatsApp float button y meta tags continúan funcionando según su spec
- `public-simulator` — el simulador embebido consume el endpoint público
- `public-simulator-frontend` — la integración del simulador sigue esa spec
- `landing-ui` — la estructura visual y responsiva sigue esa spec

## Requirements

### Requirement: Hero Section

The landing page MUST render a hero section at the top of `/` with a value proposition title, supporting subtitle, and two primary CTAs: "Solicitar por WhatsApp" and "Registrarse". The hero SHOULD be the first visible content above the fold.

#### Scenario: Hero renders with all elements

- GIVEN a visitor navigates to `/`
- WHEN the landing page loads
- THEN a hero section is visible with a heading (value prop), a subtitle paragraph, and two CTA buttons
- AND "Solicitar por WhatsApp" opens `https://wa.me/<phone>` in a new tab
- AND "Registrarse" navigates to `/auth/register`

#### Scenario: No redirect to login

- GIVEN an unauthenticated visitor
- WHEN navigating to `/`
- THEN the page renders the landing content
- AND the visitor is NOT redirected to `/login` or `/portal/dashboard`

### Requirement: Navigation Links

The landing page MUST include visible navigation links for "Registrarse" and "Iniciar sesión" in the page header.

#### Scenario: Register link navigates correctly

- GIVEN a visitor on the landing page
- WHEN clicking "Registrarse"
- THEN the browser navigates to `/auth/register`

#### Scenario: Login link navigates correctly

- GIVEN a visitor on the landing page
- WHEN clicking "Iniciar sesión"
- THEN the browser navigates to `/auth/login`

### Requirement: Features Section

The landing page SHOULD display a features section below the hero describing how the loan service works and its benefits.

#### Scenario: Features section is visible and structured

- GIVEN a visitor scrolls past the hero
- THEN a section titled "¿Cómo funciona?" or equivalent is visible
- AND at least three feature cards are rendered
- AND each card includes an icon or illustration, a title, and a description

### Requirement: Embedded Public Simulator

The landing page MUST include a simulator section where any visitor can calculate loan payments without authentication. The section MUST show the simulator form (with instant client-side feedback) and, after submission, the amortization table.

#### Scenario: Simulator calculates publicly

- GIVEN a visitor on the landing page simulator section
- WHEN setting amount=5000, term=12 meses, rate=15% and clicking "Simular"
- THEN a loading indicator appears while the request is in flight
- AND on success, an amortization table is displayed with 12 rows (Mes, Cuota, Interés, Capital, Saldo)
- AND the summary shows Total a Pagar and Total Intereses
- AND no authentication was required

### Requirement: Responsive Design

The landing page MUST be fully responsive. All sections MUST render and function correctly on mobile (375px) and desktop (1280px+).

#### Scenario: Mobile viewport renders correctly

- GIVEN a 375px-wide viewport
- WHEN the landing page renders
- THEN all sections (hero, features, simulator) are visible without horizontal overflow
- AND CTA buttons have minimum touch target size of 44px
- AND the WhatsApp float button is visible in the bottom-right corner

#### Scenario: Desktop viewport renders correctly

- GIVEN a 1280px-wide viewport
- WHEN the landing page renders
- THEN content is centered within a max-width container
- AND all sections have adequate whitespace between them

### Requirement: SEO Meta Tags

The landing page MUST render Open Graph and Twitter Card meta tags in `<head>` as specified in `landing-widget`.

#### Scenario: OG tags present

- GIVEN a visitor or crawler fetches the landing page
- WHEN inspecting `<head>`
- THEN `<meta property="og:title">` and `<meta property="og:description">` are present
- AND `<meta name="twitter:card">` is present
