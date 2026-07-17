# Landing Widget Specification

## Purpose

Specify the frontend landing page components: floating WhatsApp button, configurable phone number, and social sharing meta tags for web visibility.

## Requirements

### Requirement: Floating WhatsApp Button

The system MUST render a fixed-position floating button on the landing page (`/`) that opens a WhatsApp chat in a new tab when clicked. The button MUST display the WhatsApp icon and SHOULD be visible on mobile and desktop viewports. It MUST NOT overlap primary navigation or call-to-action elements.

#### Scenario: Button renders and opens chat

- GIVEN a user visits the landing page
- WHEN the page loads
- THEN a WhatsApp icon button is visible in the bottom-right corner
- AND clicking it opens `https://wa.me/<configured_phone>` in a new tab

#### Scenario: Mobile viewport

- GIVEN a user on a 375px-wide viewport
- WHEN the landing page renders
- THEN the floating button is fully visible and tappable
- AND it does not obstruct the main content at scroll position 0

### Requirement: Configurable Phone Number

The phone number for the WhatsApp link MUST be configurable via an environment variable (`NEXT_PUBLIC_WHATSAPP_PHONE`). If the variable is not set, the button MUST NOT render.

#### Scenario: Phone configured

- GIVEN `NEXT_PUBLIC_WHATSAPP_PHONE=59171234567`
- WHEN the landing page renders
- THEN the button links to `https://wa.me/59171234567`

#### Scenario: Phone not configured

- GIVEN no `NEXT_PUBLIC_WHATSAPP_PHONE` is set
- WHEN the landing page renders
- THEN the floating button is not rendered

### Requirement: Meta Tags for Sharing

The system MUST include Open Graph and Twitter Card meta tags in the root layout (`<head>`). Tags MUST include `og:title`, `og:description`, `og:url`, `og:type` (website), `twitter:card`, and `twitter:title`. Values SHOULD be configurable via layout metadata export.

#### Scenario: Meta tags present in HTML

- GIVEN any page of the web app
- WHEN the HTML is rendered
- THEN `<meta property="og:title">` and `<meta name="twitter:card">` are present in `<head>`

#### Scenario: Social preview renders correctly

- GIVEN a URL is shared on Facebook or Twitter
- WHEN the platform fetches the page
- THEN it displays the title, description, and URL from OG tags
