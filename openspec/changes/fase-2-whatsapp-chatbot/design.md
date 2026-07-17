# Design: Fase 2 — WhatsApp + Chatbot AI

## 1. Technical Approach

Módulo `whatsapp` nuevo en `apps/api/src/whatsapp/` con Clean Architecture 4 capas. Reutiliza Redis provider existente para sesiones de chatbot y `SharedModule` (PrismaService). Axios via `@nestjs/axios` para Meta Business API v22.0 y AI API (Claude/GPT).

```
apps/api/src/whatsapp/
├── domain/             # WhatsAppContact, ChatbotSession (ports)
├── application/        # ReceiveMessageHandler, SendMessageHandler, RouteIntentHandler
├── infrastructure/     # MetaHttpService, AIService, ChatbotSessionRedisStore
└── presentation/       # WebhookController
```

## 2. Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Módulo propio | `whatsapp` | Canal distinto a identity. Identity ya maneja auth. Separación clara. |
| Session state | Redis | TTL 30m, alta frecuencia, ya existe `REDIS_CLIENT` en identity. DB solo para historial. |
| AI mode | Request/response con timeout 5s | Streaming no aporta en WhatsApp (mensajes discretos). Simplifica rate limiting. |
| Webhook security | Verify token + firma | Meta envía `X-Hub-Signature-256` para verificar payload. Verify token en challenge GET. |
| Rate limiting | Token bucket por contacto en Redis | 1 msg/s, 250 msg/24h por número. Contador atómico con TTL móvil. |
| Llamadas a AI | Rate-limit 10 req / 5 min por sesión | Evita abusos. Fallback a menú estructurado si se excede o hay timeout. |

## 3. File Changes

| File | Action | Purpose |
|------|--------|---------|
| `apps/api/prisma/schema.prisma` | **Modify** | +4 modelos: WhatsAppContact, WhatsAppConversation, WhatsAppMessage, ChatbotSession |
| `apps/api/src/whatsapp/` | **New dir** | Módulo completo 4 capas |
| `apps/api/src/whatsapp/whatsapp.module.ts` | New | Module definition, imports HttpModule + Redis |
| `apps/api/src/whatsapp/whatsapp.tokens.ts` | New | DI tokens: META_HTTP_SERVICE, AI_SERVICE, SESSION_STORE |
| `apps/api/src/whatsapp/domain/whatsapp-contact.entity.ts` | New | Value object para contacto WhatsApp |
| `apps/api/src/whatsapp/domain/chatbot-session.ts` | New | Session VO con intent, state, data_collected |
| `apps/api/src/whatsapp/domain/session-store.port.ts` | New | Puerto para Redis session store |
| `apps/api/src/whatsapp/application/send-message.handler.ts` | New | Envía msg a Meta API con retry+backoff |
| `apps/api/src/whatsapp/application/receive-message.handler.ts` | New | Procesa incoming webhook payload |
| `apps/api/src/whatsapp/application/route-intent.handler.ts` | New | Router: AI → keyword → menú HELP |
| `apps/api/src/whatsapp/infrastructure/meta-http.service.ts` | New | Axios calls a Meta Business API |
| `apps/api/src/whatsapp/infrastructure/ai-http.service.ts` | New | Axios calls a AI API (Claude/GPT) |
| `apps/api/src/whatsapp/infrastructure/session-store.redis.ts` | New | Implementación Redis de session store |
| `apps/api/src/whatsapp/presentation/webhook.controller.ts` | New | GET /api/whatsapp/webhook (challenge) + POST (incoming) |
| `apps/api/src/identity/application/register/register.handler.ts` | **Modify** | Acepta phone como único identifier, email opcional |
| `apps/api/src/identity/domain/phone.value-object.ts` | **Modify** | Validación +591, optional |
| `apps/api/src/identity/presentation/auth.controller.ts` | **Modify** | DTO registration acepta phone sin email |
| `apps/web/components/molecules/whatsapp-float.tsx` | New | Botón flotante WhatsApp |
| `apps/web/app/layout.tsx` | **Modify** | OG tags + Twitter Cards + WhatsAppFloat |
| `.env.example` | **Modify** | WHATSAPP_PHONE_ID, WHATSAPP_TOKEN, WHATSAPP_VERIFY_TOKEN, AI_API_KEY |

## 4. Data Flow

```
WhatsApp User
    │
    ▼  POST /api/whatsapp/webhook (payload JSON)
WebhookController
    │
    ▼  valida X-Hub-Signature-256
ReceiveMessageHandler
    │
    ├──▶ Log message a DB (WhatsAppMessage)
    │
    ▼  busca/crea session en Redis (phone → session)
RouteIntentHandler
    │
    ├──▶ (opcional) AI API → clasifica intent + genera respuesta
    │       Si timeout/error → keyword match → menú HELP
    │
    ▼  ejecuta handler del intent
    ├── REGISTER    → collect name, email, create User
    ├── APPLY_LOAN  → check registered, collect amount/term/purpose
    ├── CHECK_STATUS→ lookup loan_application, return status
    └── HELP        → menú numerado
    │
    ▼
SendMessageHandler → MetaHttpService.send(to, text)
    │               (retry 3x con backoff 1s/2s/4s)
    ▼
Meta Business API → WhatsApp User
```

## 5. Key Interfaces

```typescript
// WebhookController (presentation)
@Controller('api/whatsapp/webhook')
class WebhookController {
  @Get()  // challenge: ?hub.mode=subscribe&hub.verify_token=...&hub.challenge=12345
  verify(@Query('hub.verify_token') token: string, @Query('hub.challenge') challenge: string): number;

  @Post() // incoming message payload
  receive(@Body() payload: WebhookPayload): Promise<void>;
}

// MetaHttpService (infrastructure)
class MetaHttpService {
  async sendMessage(to: string, text: string): Promise<MessageResult>;
  // POST https://graph.facebook.com/v22.0/<phone_id>/messages
  // Retry 3x exponential backoff on non-2xx
}

// AIService (infrastructure)
class AIService {
  async classifyIntent(message: string, history: Message[]): Promise<IntentResult>;
  // Rate-limited per session (10 req / 5 min). Timeout 5s.
  // Fallback: return null → keyword matching
}

// SessionStore (port → Redis impl)
interface SessionStore {
  get(phone: string): Promise<ChatbotSession | null>;
  save(session: ChatbotSession): Promise<void>;
  delete(phone: string): Promise<void>;
}
// Redis impl: key="session:{phone}", TTL=1800s, field=JSON
```

## 6. Testing Strategy

| Layer | Type | What |
|-------|------|------|
| Services | Unit (Vitest) | MetaHttpService mock axios, AIService mock fetch, SessionStore mock Redis |
| RouteIntentHandler | Unit | Test cada intent route, AI fallback → keyword → HELP |
| WebhookController | Integration (Supertest) | GET challenge (valid/invalid token), POST incoming (valid/malformed payload) |
| End-to-end | Manual | Meta Business sandbox + ngrok + real WhatsApp number |
| Rate limiting | Unit | Token bucket excede límite → queue |

## 7. Migration — 4 nuevas tablas

```prisma
model WhatsAppContact {
  id            String   @id @default(uuid())
  phone         String   @unique
  name          String?
  userId        String?  @unique
  user          User?    @relation(fields: [userId], references: [id])
  conversations WhatsAppConversation[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model WhatsAppConversation {
  id        String   @id @default(uuid())
  contactId String
  contact   WhatsAppContact @relation(fields: [contactId], references: [id])
  messages  WhatsAppMessage[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model WhatsAppMessage {
  id             String   @id @default(uuid())
  conversationId String
  conversation   WhatsAppConversation @relation(fields: [conversationId], references: [id])
  direction      String   // incoming | outgoing
  messageType    String   // text | interactive | image
  content        String?
  metaId         String?  // Meta message ID for dedup
  status         String   @default("sent")  // sent | delivered | read | failed
  createdAt      DateTime @default(now())
}

model ChatbotSession {
  id        String   @id @default(uuid())
  phone     String   @unique
  intent    String   // REGISTER | APPLY_LOAN | CHECK_STATUS | HELP
  state     String   // collecting_name | collecting_email | confirming | etc
  data      Json?    // { name?, email?, amount?, termMonths?, purpose? }
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  // Active state lives in Redis (TTL 30m); DB row is audit/log
}
```

Pasos: `pnpm exec prisma migrate dev --name add_whatsapp_tables` desde `apps/api/`.

> **ponytail**: chatbot_sessions en DB es audit trail. Active session state vive SOLO en Redis con TTL 30m. DB row se escribe al finalizar o expirar la sesión. Si audit no es necesario en MVP, eliminar tabla — Redis da el historial activo.
