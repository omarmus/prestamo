# Archive Report: WhatsApp Chatbot — Mastra AI Migration

**Archived**: 2026-07-22
**Change**: `whatsapp-chatbot-mastra`
**Source**: `openspec/changes/whatsapp-chatbot-mastra/`
**Destination**: `openspec/changes/archive/2026-07-22-whatsapp-chatbot-mastra/`

---

## Summary

Reemplazó la infraestructura manual del chatbot WhatsApp (FSM con switch-case + OpenAI HTTP raw + Redis session/store + Redis loan repo) por el Mastra AI Framework con agente, 7 tools nativas, memoria conversacional LibSQL y 2 workflows opcionales. Se eliminaron ~14 archivos legacy. Las entidades de dominio y repositorios Prisma se mantienen intactos.

### PR Slicing

| PR | Nombre | Estado |
|----|--------|--------|
| PR 1 | Foundation — deps, mastra/index, agente, 2 tools, module wiring | ✅ Implementado |
| PR 2 | Tools completas (5) + webhook POST rewrite + limpieza handlers legacy | ✅ Implementado |
| PR 3 | Workflows (2) + limpieza final (Redis loan repo, tokens, specs) | ✅ Implementado |

### Verificación Final

| Check | Resultado |
|-------|-----------|
| `pnpm type-check` (API) | ✅ Pasa |
| `pnpm type-check` (Web) | ⚠️ Error pre-existente en `.next/types/validator.ts` (no relacionado) |
| `pnpm build` | ✅ Pasa |
| `pnpm test` (API) | 247/251 tests pasan; 4 fallos pre-existentes (2 integración DB, 2 meta-http timeout) |
| Servidor arranca | ✅ Verificado con fix de `API_PORT` |

Los 2 fallos en `meta-http.service.spec.ts` son pre-existentes (timeout en test de retry). Los 2 fallos en `prisma-user.repository.spec.ts` son de integración con base de datos local. **Ningún fallo está relacionado con el cambio Mastra**. El test del agente Mastra (`customer-support.spec.ts`) pasa correctamente.

---

## Archivos Creados (12 files, ~1200 lines)

### `apps/api/mastra/` (10 files)

| Archivo | Rol |
|---------|-----|
| `mastra/index.ts` | Factory `createMastra(deps)` que construye Mastra instance con agent + tools + workflows + memory |
| `mastra/agents/customer-support.ts` | Definición del agente: model config, instructions (español boliviano), tools reference, memory config |
| `mastra/tools/register-customer.ts` | Tool factory que wrappea `CompleteRegistrationHandler` |
| `mastra/tools/get-customer-by-phone.ts` | Tool factory: `ContactRepository.findByPhone()` + navegación User |
| `mastra/tools/check-loan-application.ts` | Tool factory: consulta loan drafts por teléfono |
| `mastra/tools/check-loan-status.ts` | Tool factory: préstamos activos vía `ActiveLoanQuery` |
| `mastra/tools/check-next-installment.ts` | Tool factory: próxima cuota vía `InstallmentRepository` |
| `mastra/tools/create-loan-application.ts` | Tool factory: wrappea `ApplyLoanHandler` |
| `mastra/tools/simulate-loan.ts` | Tool factory: cálculo de amortización French |
| `mastra/workflows/customer-registration.ts` | Workflow multi-step: collect → register → createCustomer → linkContact |
| `mastra/workflows/loan-application.ts` | Workflow multi-step: collect → validate → confirm → save |
| `mastra/__tests__/customer-support.spec.ts` | Test unitario: agente, 7 tools, DI bridge, edge cases (412 lines) |

### Otros

- `.env.example` — variables `MASTRA_MODEL`, `MASTRA_API_KEY`, `MEMORY_DB_URL`

---

## Archivos Modificados (6 files)

| Archivo | Cambio | PR |
|---------|--------|----|
| `apps/api/package.json` | +5 dependencias: `@mastra/core`, `@mastra/nestjs`, `@mastra/memory`, `@mastra/libsql`, `@mastra/loggers` (+`@libsql/client` transitivo) | PR1 |
| `apps/api/tsconfig.json` | +`"mastra/**/*"` en `include` | PR1 |
| `apps/api/src/whatsapp/whatsapp.module.ts` | +`MastraModule.registerAsync()` con DI Bridge factory; removidos providers legacy (AIService, ChatbotSessionRedisStore, RouteIntentHandler, ReceiveMessageHandler) | PR1+2+3 |
| `apps/api/src/whatsapp/presentation/webhook.controller.ts` | POST rewrite: `MastraService.getAgent().generate()` reemplaza pipeline RouteIntentHandler; MetaHttpService.sendMessage() se mantiene | PR2 |
| `apps/api/src/whatsapp/whatsapp.tokens.ts` | Eliminado `LOAN_APPLICATION_REPOSITORY` | PR3 |
| `apps/api/prisma/schema.prisma` | Modelo `LoanApplication` añadido | PR3 |

---

## Archivos Eliminados (14 files, ~800 lines)

| Archivo | Razón |
|---------|-------|
| `application/receive-message.handler.ts` | Reemplazado por Mastra agent (webhook routing) |
| `application/receive-message.handler.spec.ts` | Test del handler eliminado |
| `application/route-intent.handler.ts` | Reemplazado por Mastra agent + tools (intent routing) |
| `application/route-intent.handler.spec.ts` | Test del handler eliminado |
| `application/send-message.handler.ts` | Redundante: MetaHttpService directo |
| `infrastructure/ai-http.service.ts` | Reemplazado por Mastra agent LLM |
| `infrastructure/ai-http.service.spec.ts` | Test del servicio eliminado |
| `infrastructure/session-store.redis.ts` | Reemplazado por Mastra Memory (LibSQL) |
| `infrastructure/session-store.redis.spec.ts` | Test del store eliminado |
| `application/ports/ai-service.port.ts` | Port del servicio eliminado |
| `infrastructure/redis-loan-application.repository.ts` | Migrado a Prisma (módulo loans) |
| `infrastructure/redis-loan-application.repository.spec.ts` | Test del repo eliminado |
| `domain/loan-application.entity.ts` | Migrado a módulo loans + Prisma |
| `domain/loan-application-repository.port.ts` | Port del repo eliminado |

### Archivos Preservados (sin cambios)

- `domain/whatsapp-contact.entity.ts`
- `domain/whatsapp-conversation.entity.ts`
- `domain/whatsapp-message.entity.ts`
- `domain/contact-repository.port.ts` / `conversation-repository.port.ts` / `message-repository.port.ts`
- `infrastructure/meta-http.service.ts` + `meta-http.service.spec.ts`
- `infrastructure/persistence/` (Prisma repos)
- `application/complete-registration.handler.ts`
- `application/apply-loan.handler.ts` + `apply-loan.handler.spec.ts`
- `application/check-status.handler.ts` + `check-status.handler.spec.ts`
- `application/ports/meta-http.port.ts`
- `whatsapp.tokens.ts` (parcial: solo se eliminó `LOAN_APPLICATION_REPOSITORY`)

---

## Delta Specs Merge

### `chatbot-ai` → Nueva Spec

**Estado**: ✅ Creada como spec completa en `openspec/specs/chatbot-ai/spec.md`

El delta spec describe correctamente las nuevas capacidades (5 intents, 7 tools, DI Bridge, conversacional memory). Merge directo como spec completa de dominio nuevo.

### `whatsapp-channel` → Merge en Spec Existente

**Estado**: ✅ Actualizada en `openspec/specs/whatsapp-channel/spec.md`

**⚠️ Discrepancia documentada**: Los delta specs fueron escritos *antes* de la implementación y describen el uso de `@chat-adapter/whatsapp` para parsing y envío de mensajes. Sin embargo, durante la implementación se decidió mantener `MetaHttpService` existente (ver ADR en design.md). Las correcciones aplicadas:

| Delta spec | Realidad | Acción en merge |
|------------|----------|-----------------|
| ADD: GET verification unchanged | Correcto — no se modificó | Añadido como nota en Webhook Verification |
| MODIFY: Receive via @chat-adapter | POST ahora usa Mastra agent, parsing sigue manual | Descripción corregida a "forwarded to Mastra agent" |
| MODIFY: Send via @chat-adapter | MetaHttpService se mantiene | Sin cambios — no hubo modificación real |
| MODIFY: Rate limiting via @chat-adapter | MetaHttpService se mantiene | Sin cambios — no hubo modificación real |

---

## Arquitectura Final

```
                    ┌──────────────────────────────────────┐
                    │        Meta WhatsApp Cloud API        │
                    └──────────────┬───────────────────────┘
                                   │ POST /api/whatsapp/webhook
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│ NestJS App                                                      │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ WebhookController (GET challenge + POST proxy)             │   │
│ │  - GET  → challenge verification (sin cambios)             │   │
│ │  - POST → parse payload → log → agent.generate()           │   │
│ │           → send reply via MetaHttpService → log outgoing   │   │
│ └──────────────────────┬────────────────────────────────────┘   │
│                        │ agent.generate()                       │
│                        ▼                                        │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │  Mastra Agent — customerSupport                            │   │
│ │  ┌──────────┐  ┌────────────────────────────────────────┐  │   │
│ │  │ Memory   │  │ 7 Tools (factory-created con DI)        │  │   │
│ │  │ LibSQL   │  │ register-customer, get-customer-by-phone │  │   │
│ │  │ working  │  │ check-loan-application/status,           │  │   │
│ │  │ memory   │  │ check-next-installment,                  │  │   │
│ │  │ hist.    │  │ create-loan-application, simulate-loan   │  │   │
│ │  └──────────┘  └────────────────────────────────────────┘  │   │
│ │  ┌────────────────────────────────────────────────────────┐  │   │
│ │  │ Workflows: customerRegistration, loanApplication       │  │   │
│ │  └────────────────────────────────────────────────────────┘  │   │
│ └───────────────────────────────────────────────────────────┘   │
│                        │                                        │
│                        ▼                                        │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ NestJS Services (inyectados vía factory en tools)          │   │
│ │ CompleteRegistrationHandler, ApplyLoanHandler,             │   │
│ │ ContactRepository, UserRepository, CustomerRepository,     │   │
│ │ ActiveLoanQuery, InstallmentRepository, MetaHttpService    │   │
│ └───────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Decisiones de Arquitectura Confirmadas

1. ✅ **DI Bridge pattern**: Tools reciben handlers vía `useFactory` con `@Inject()`. No global state, no requestContext.
2. ✅ **WebhookController como proxy**: No se delegó la ruta a Mastra. GET/Meta URL no cambiaron durante migración.
3. ✅ **MetaHttpService se mantiene**: `@chat-adapter/whatsapp` se excluyó del scope. Madurez media, riesgo innecesario.
4. ✅ **Sin shared Zod schemas**: Tools usan tipos primitivos inline. No se crearon schemas en `packages/shared/`.
5. ✅ **Memory via LibSQL**: `threadId = phone`. Working memory con template de perfil de cliente.

## Próximos Pasos Sugeridos

| Prioridad | Sugerencia |
|-----------|------------|
| 🟡 Media | Dashboard admin de conversaciones — visualizar historial de chats, herramientas usadas, respuestas del agente |
| 🟢 Baja | Tests E2E reales con mock de Meta API (usando webhook simulator o testcontainer) |
| 🟢 Baja | Medir latencia de tool calling vs keyword matching en producción |
| 🔵 Info | `ChatbotSession` entity y `session-store.port` quedaron huérfanos (sin referencias activas). Evaluar limpieza futura. |
| 🔵 Info | Migración de sesiones Redis activas: TTL 30min expira naturalmente (no hay migración activa) |
