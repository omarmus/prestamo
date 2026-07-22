# Delta for whatsapp-channel

## ADDED Requirements

### Requirement: GET Webhook Verification Unchanged

The GET endpoint for Meta webhook verification MUST remain unchanged. The existing `WebhookController` implementation for `GET /api/whatsapp/webhook` SHALL NOT be modified.

#### Scenario: Successful verification
- GIVEN a GET with `hub.mode=subscribe`, `hub.verify_token=<token>`, `hub.challenge=12345`
- WHEN the existing GET handler receives it
- THEN response is HTTP 200 with body `12345`

#### Scenario: Invalid verify token
- GIVEN a GET with `hub.verify_token=<wrong_token>`
- WHEN the existing GET handler receives it
- THEN response is HTTP 403

## MODIFIED Requirements

### Requirement: Receive Incoming Message

The system MUST accept WhatsApp Business API webhook `POST` payloads. Parsing SHALL delegate to `@chat-adapter/whatsapp` instead of manual MetaHttpService parsing. Malformed payloads MUST be acknowledged with HTTP 200 to prevent Meta retries.
(Previously: manual payload parsing via MetaHttpService + ReceiveMessageHandler; now: @chat-adapter/whatsapp with Mastra agent routing)

#### Scenario: Valid text message received
- GIVEN a valid webhook payload with `messages[0].text.body`
- WHEN `POST /api/whatsapp/webhook` receives it
- THEN `@chat-adapter/whatsapp` parses the payload
- AND forwards the message to the Mastra agent
- AND the endpoint responds HTTP 200

#### Scenario: Malformed payload
- GIVEN a webhook payload missing required fields
- WHEN `POST` receives it
- THEN the endpoint responds HTTP 200 (acknowledge, no processing)

### Requirement: Send Message

The system MUST send messages via Mastra's WhatsApp channel. Retry and backoff SHALL be handled by `@chat-adapter/whatsapp` (3 retries with exponential backoff: 1s, 2s, 4s). Delivery status MUST be logged.
(Previously: MetaHttpService.sendMessage() with manual retry logic; now: Mastra adapter with built-in retry)

#### Scenario: Message sent successfully
- GIVEN a valid recipient phone and message body
- WHEN the Mastra agent sends a reply
- THEN `@chat-adapter/whatsapp` delivers it via Meta API
- AND the message is logged with status `sent`

#### Scenario: Send failure after retries
- GIVEN Meta API returns HTTP 500 persistently
- WHEN Mastra adapter attempts delivery
- THEN it retries with exponential backoff (1s, 2s, 4s)
- AND after exhausting retries, the message is logged with status `failed`

### Requirement: Rate Limiting

The system MUST throttle outbound messages per contact. `@chat-adapter/whatsapp` SHALL enforce 1 msg/s per contact and 250 msg/24h per phone number (Meta limits). Exceeding limits MUST queue the message for delayed delivery.
(Previously: custom throttling in MetaHttpService; now: Mastra adapter built-in rate limiting)

#### Scenario: Rate limit hit
- GIVEN a contact has reached the per-second rate limit
- WHEN Mastra adapter tries to send another message
- THEN the message is queued with delay
- AND delivered once the rate window resets

## User Stories

- **Como usuario**, quiero enviar y recibir mensajes WhatsApp sin cambios en la experiencia, para que la migración sea transparente.
- **Como operador**, quiero que los retry y rate limits los maneje Mastra, para eliminar código de infraestructura manual.

## Acceptance Criteria

- [ ] GET webhook verification funciona idéntico al actual (HTTP 200/403)
- [ ] POST webhook procesa mensajes entrantes vía Mastra adapter
- [ ] Mensajes salientes se envían con retry 3 intentos y backoff
- [ ] Rate limiting 1 msg/s por contacto se respeta
- [ ] Archivos legacy eliminados: MetaHttpService, ReceiveMessageHandler
- [ ] `pnpm type-check && pnpm build` pasan limpios

## Out of Scope

- GET webhook verification (no se modifica)
- Mensajes template (comportamiento preservado, no cambia)
- Dashboard de conversaciones admin
- Entidades de dominio (Contact, Message)
