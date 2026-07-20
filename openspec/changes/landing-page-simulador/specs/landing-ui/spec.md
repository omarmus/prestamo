# Landing Page UI Specification

## Purpose

Especificar la estructura visual, layout responsivo y jerarquía de componentes de la landing page. Define cómo los componentes se organizan en secciones y cómo cambian entre viewports.

## Design Tokens

The landing page MUST use the existing shadcn/ui design tokens via Tailwind CSS. No custom colors or new token variables.

Token | CSS Variable | Usage
------|-------------|-------
Background | `--background` | Page background (`bg-background`)
Foreground | `--foreground` | Body text (`text-foreground`)
Primary | `--primary` | CTA buttons, headings, links
Primary-foreground | `--primary-foreground` | Text on primary buttons
Muted | `--muted` | Feature card backgrounds, secondary badges
Muted-foreground | `--muted-foreground` | Subtitle, secondary text
Accent | `--accent` | Simulator section background (diferente al del hero)
Border | `--border` | Card borders, dividers

## Layout Structure

### Section Hierarchy

```
Page (flex col, min-h-screen)
├── Header              → Fixed/top, logo + nav links (Registrarse, Iniciar sesión)
├── Hero                → Full-height, centered value prop + CTAs
├── Features            → 3-column grid on desktop, stacked on mobile
├── Simulator Section   → Full-width, form + amortization table
└── Footer              → Brand mark, copyright, links
```

### Spacing and Sizing

The page MUST use consistent spacing following the 8px grid.

- Section padding: `py-16` (mobile), `py-24` (desktop)
- Max container width: `max-w-6xl` centered with `px-4`
- Gap between feature cards: `gap-8`
- Inner card padding: `p-6`

### Requirement: Header

The page MUST have a sticky header with the brand logo on the left and navigation links on the right. On mobile (< 768px), navigation SHOULD collapse into a hamburger menu.

#### Scenario: Desktop header renders

- GIVEN a viewport wider than 768px
- WHEN the landing page loads
- THEN a header is visible at the top with logo left and "Registrarse" / "Iniciar sesión" links right
- AND the header has a subtle bottom border or shadow

#### Scenario: Mobile header collapses

- GIVEN a 375px-wide viewport
- WHEN the landing page loads
- THEN the header shows the logo and a hamburger menu icon
- AND navigation links are hidden until the hamburger is tapped

### Requirement: Hero Visual Hierarchy

The hero MUST use a centered layout: heading (largest), subtitle, then CTA buttons. Background SHOULD be the primary color or a gradient from primary to accent.

#### Scenario: Desktop hero layout

- GIVEN a 1280px viewport
- WHEN viewing the hero section
- THEN heading is `text-5xl` or equivalent, subtitle is `text-lg text-muted-foreground`
- AND CTAs are side by side with the primary WhatsApp CTA on the left
- AND the hero occupies at least 80vh in height

#### Scenario: Mobile hero layout

- GIVEN a 375px viewport
- WHEN viewing the hero section
- THEN heading is `text-3xl` or smaller to avoid overflow
- AND CTAs are stacked vertically, full-width
- AND the hero height is auto (content-driven) or a minimum of 60vh

### Requirement: Features Grid

Features MUST render in a responsive grid: 3 columns on desktop (`lg:grid-cols-3`), 2 on tablet (`md:grid-cols-2`), 1 on mobile (`grid-cols-1`).

#### Scenario: Desktop features grid

- GIVEN a viewport wider than 1024px
- WHEN viewing the features section
- THEN feature cards are arranged in a 3-column grid
- AND each card has the same height (equal-height columns)

#### Scenario: Mobile features stack

- GIVEN a 375px viewport
- WHEN viewing the features section
- THEN feature cards stack vertically in a single column
- AND each card spans full width of the container

### Requirement: Simulator Section Layout

The simulator section MUST have a distinct background from the hero (accent or muted). The form MUST be above the amortization table. On desktop, the form and summary MAY be side by side if space permits.

#### Scenario: Simulator section renders

- GIVEN a visitor scrolls to the simulator section
- THEN the section has a different background color from the hero (e.g., `bg-accent` or `bg-muted`)
- AND the SimulatorForm component is centered in the section
- AND after calculation, AmortizationTable renders below the form

### Requirement: State Visibility

Each section MUST be clearly visually separated from adjacent sections by padding or background changes.

#### Scenario: Sections are distinct

- GIVEN the full landing page is rendered
- THEN each section (header, hero, features, simulator, footer) is visually distinguishable by background, spacing, or both
- AND a visitor can scroll through and identify where one section ends and the next begins

### Requirement: Loading State (Simulator)

When the simulator is calculating, the submit button MUST show a loading state and form inputs MUST be disabled to prevent double submission.

#### Scenario: Loading indicator during calculation

- GIVEN a visitor clicks "Simular"
- WHEN the API request is in flight
- THEN the submit button shows a spinner or "Calculando..." text
- AND amount, term, and rate inputs are disabled
- AND after the response, inputs are re-enabled

### Requirement: Error State (Simulator)

If the simulator API returns an error, the page MUST display an inline error message without hiding the form or previous results.

#### Scenario: Error message displayed inline

- GIVEN a visitor submits invalid data to the simulator
- WHEN the API returns a 400 error
- THEN an error message appears near the submit button
- AND the form inputs remain editable for correction
