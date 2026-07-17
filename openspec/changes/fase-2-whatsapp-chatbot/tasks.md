# Tasks: Fase 2 — WhatsApp + Chatbot AI

## Review Workload Forecast

~850-1100 líneas. Decision needed before apply: No. Chained PRs: Yes. Chain: stacked-to-main. Budget risk: High.

3 PRs: Schema+Módulo → Chatbot+Registro → Frontend Widget. Todos a main.

## PR 1 — Schema + Módulo WhatsApp Base

### Phase 1: Schema + Migración

- [x] 1.1 4 modelos en `schema.prisma`: WhatsAppContact (FK User), WhatsAppConversation, WhatsAppMessage, ChatbotSession.
- [x] 1.2 `prisma migrate dev --name add_whatsapp_tables` desde apps/api.
- [x] 1.3 Verificar: `prisma migrate status` — database schema is up to date.

### Phase 2: Módulo WhatsApp (4 capas)

- [x] 2.1 `whatsapp.tokens.ts`: META_HTTP_SERVICE, AI_SERVICE, SESSION_STORE, CONTACT_REPOSITORY, CONVERSATION_REPOSITORY, MESSAGE_REPOSITORY.
- [x] 2.2 Domain: `whatsapp-contact.entity.ts`, `chatbot-session.entity.ts` (intent/state/data), `session-store.port.ts`. Also: contact/conversation/message repository ports, domain errors.
- [x] 2.3 Infra: `meta-http.service.ts` implements MetaHttpPort (fetch+native, retry 3x), `session-store.redis.ts` implements SessionStore (TTL 1800s), `ai-http.service.ts` implements AIServicePort (stub→null). Prisma repos via SharedModule.
- [x] 2.4 Application: `send-message.handler.ts`, `receive-message.handler.ts` (parse payload + log DB + route + respond), `route-intent.handler.ts` (skeletal: AI→keyword→HELP). Ports in `application/ports/`.
- [x] 2.5 Presentation: `webhook.controller.ts` — GET challenge (verify token), POST incoming (200 siempre).
- [x] 2.6 `whatsapp.module.ts` — providers con tokens. Wire en app.module.ts. REDIS_CLIENT exportado desde IdentityModule.
- [x] 2.7 `.env.example`: WHATSAPP_PHONE_ID, WHATSAPP_TOKEN, WHATSAPP_VERIFY_TOKEN.

### Phase 3: Tests

- [x] 3.1 Unit: MetaHttpService (success, retry 3x, timeout), SessionStore (CRUD+TTL), parsePayload (text/interactive/malformed), RouteIntentHandler (4 intents + AI fallback).
- [x] 3.2 Integration: GET /api/whatsapp/webhook — token válido 200, inválido 403. POST valid+empty 200.
- [x] Verify: `pnpm lint`, `pnpm type-check`, `pnpm build` — all pass.

## PR 2 — Chatbot AI + Registro vía WhatsApp

### Phase 1: ChatbotService + AI

- [x] 1.1 `ai-http.service.ts`: POST AI API timeout 5s, rate limit 10 req/5min por sesión (token bucket Redis).
- [x] 1.2 `route-intent.handler.ts`: classifyIntent via AI, fallback keyword (registro→REGISTER, préstamo→APPLY_LOAN, estado→CHECK_STATUS).
- [x] 1.3 4 intents: REGISTER (name→email→confirm), APPLY_LOAN (amount→term→purpose, redirect si no registrado), CHECK_STATUS (lookup application), HELP (menú).
- [x] 1.4 CheckStatusHandler inyectado en RouteIntentHandler para replies dinámicas en CHECK_STATUS.

### Phase 2: Redis Sessions

- [x] 2.1 session-store.redis: get/save/delete TTL 30m, JSON `{phone,intent,state,data,step,createdAt}`. Nueva descarta anterior expirada.
- [x] 2.2 DB write al completar sesión (ponytail: audit trail opcional MVP).

### Phase 3: Registration from Chatbot

- [x] 3.1 RegisterCommand: email opcional, phone primary. Auto-password `crypto.randomBytes(32)`.
- [x] 3.2 `findByPhone()` en UserRepository + PrismaUserRepository.
- [x] 3.3 RegisterHandler: si phone existe+activo→error+re-login prompt.
- [x] 3.4 Schema: User.email nullable, User.phone unique. Phone VO formato +591.
- [x] 3.5 Link WhatsAppContact.userId al nuevo User.
- [x] 3.6 ApplyLoanHandler + CheckStatusHandler creados en whatssapp.application.
- [x] 3.7 `LoanApplication` entity + `RedisLoanApplicationRepository` (Redis TTL 7d).
- [x] 3.8 WebhookController: APPLY_LOAN completion → ApplyLoanHandler (ya no llama a completeRegistration).

### Phase 4: Tests

- [x] 4.1 RouteIntentHandler: cada intent routea correcto, timeout→keyword→HELP, CHECK_STATUS dinámico con CheckStatusHandler.
- [x] 4.2 AIService: rate limit excede→null, timeout→null, éxito→IntentResult.
- [x] 4.3 SessionStore: creación, TTL, overwrite, delete.
- [x] 4.4 RegisterHandler: phone sin email, duplicate phone error.
- [x] 4.5 ApplyLoanHandler: crea loan application, confirmation message, linking con User.
- [x] 4.6 CheckStatusHandler: existing loan returns status, no loan offers APPLY_LOAN.
- [x] 4.7 RedisLoanApplicationRepository: persistencia, TTL, findById, overwrite.
- [x] Verify: `pnpm lint` (0 errors), `pnpm type-check` (pass), `pnpm test` (95 tests pass).

## PR 3 — Frontend Landing Widget

### Phase 1: WhatsApp Float Button

- [x] 1.1 `apps/web/components/molecules/whatsapp-float.tsx`: fixed bottom-right, icono WhatsApp SVG, link `wa.me/{NEXT_PUBLIC_WHATSAPP_PHONE}`, no renderiza sin env var. z-50, margin 24px, animación bounce.
- [x] 1.2 Responsive: visible 375px+, no solapa nav/CTA (bottom-6 right-6).

### Phase 2: Meta Tags + Layout

- [x] 2.1 `layout.tsx`: metadata export con og:title, description, url, type=website, twitter:card, twitter:title.
- [x] 2.2 WhatsAppFloat en layout (renderiza en todas las rutas, control interno por env var).

### Phase 3: Tests

- [x] 3.1 Component: renderiza con env var, no sin env var, link correcto (10 tests vitest + stories).
- [x] 3.2 Snapshot: layout metadata incluye OG+Twitter (7 assertions vitest).
- [ ] 3.3 Manual: ngrok + Meta sandbox + WhatsApp real.
