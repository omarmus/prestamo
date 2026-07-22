# Proposal: WhatsApp Chatbot — Mastra AI Migration

## Intent

Reemplazar infraestructura manual del chatbot WhatsApp (FSM con switch-case + OpenAI HTTP raw + Redis session/store + Redis loan repo) por Mastra AI Framework con agente, tools nativas y memoria conversacional. Entidades de dominio y repositorios Prisma se mantienen; capas application/infrastructure se migran a Mastra.

## Scope

### In Scope
- Agente Mastra con 7 tools que reemplazan RouteIntentHandler y handlers de flujo (REGISTER, APPLY_LOAN, CHECK_STATUS)
- Webhook WhatsApp via `@chat-adapter/whatsapp` (reemplaza MetaHttpService + ReceiveMessageHandler)
- Memoria conversacional via `@mastra/memory` con LibSQL (reemplaza ChatbotSessionRedisStore)
- Workflows Mastra opcionales para registro y solicitud de préstamo (reemplazan FSM manual con step functions)
- Limpieza: ~10-13 archivos eliminados (handlers, Redis stores, AI/Meta HTTP services, ports obsoletos, loan-application.entity.ts duplicado)

### Out of Scope
- Entidades de dominio (intactas)
- Repositorios Prisma (contact, conversation, message — se mantienen)
- Módulos identity, customers, loans (sin cambios)
- Dashboard de conversaciones admin

## Capabilities

### New Capabilities
- None (reemplazo de infraestructura, no nuevas capacidades)

### Modified Capabilities
- `chatbot-ai`: Migración de FSM manual + AI HTTP raw a agente Mastra con tools + workflows + memoria. Comportamiento externo (intents, sesiones, flujos) se preserva; implementación cambia completamente
- `whatsapp-channel`: Webhook POST delegado a Mastra `createWhatsAppAdapter()`. Retry/backoff y rate limiting pasan a Mastra. GET challenge permanece igual

## Approach

1. **Agente** en `apps/api/mastra/agents/customer-support.ts` con 7 tools que invocan servicios de módulos customers/loans
2. **Tools** son funciones puras sin lógica de negocio duplicada — llaman a servicios NestJS via DI
3. **NestJS adapter** `@mastra/nestjs` registra Mastra como módulo en AppModule
4. **Workflows** opcionales como step functions para flujos multi-paso
5. **Webhook** Mastra expone `/api/agents/<agent>/channels/whatsapp/webhook` — WebhookController se simplifica a solo GET challenge + proxy a Mastra en POST

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `apps/api/mastra/` | **New** | Agent + 7 tools + 2 workflows (opcionales) |
| `apps/api/package.json` | **Modified** | +`@mastra/core`, `@mastra/nestjs`, `@mastra/memory`, `@chat-adapter/whatsapp`, `@libsql/client` |
| `apps/api/src/app.module.ts` | **Modified** | +MastraModule.register() |
| `apps/api/src/whatsapp/whatsapp.module.ts` | **Modified** | Quitar providers reemplazados por Mastra |
| `apps/api/src/whatsapp/presentation/webhook.controller.ts` | **Modified** | GET challenge se mantiene, POST delega a Mastra |
| ~10-13 archivos | **Removed** | handlers, Redis stores, AI/Meta HTTP, ports, loan-application.entity.ts |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Madurez de `@chat-adapter/whatsapp` | Med | Fallback manteniendo MetaHttpService hasta estabilizar |
| Latencia tool calling vs keyword matching | Med | Timeout por tool configurable, medir en producción |
| Migración sesiones Redis activas | Bajo | Coexistencia temporal: Mastra memory + Redis legacy hasta drenar |
| Regresión en flujos conversacionales | Med | Tests E2E escenarios clave antes de eliminar handlers legacy |

## Rollback Plan

1. Remover `MastraModule.register()` de AppModule y restaurar WhatsAppModule original
2. `git revert` en package.json y archivos modificados
3. Restaurar archivos eliminados desde git (handlers legacy preservados en history)
4. Reconectar webhook legacy en Meta Business Dashboard, desconectar endpoint Mastra

## Dependencies

- `@mastra/core`, `@mastra/nestjs`, `@mastra/memory` — Mastra framework v1.x
- `@chat-adapter/whatsapp` — Adaptador WhatsApp oficial Mastra
- `@libsql/client` — Backend para Mastra memory (sesiones + embeddings)

## Success Criteria

- [ ] Agente Mastra responde los 5 intents (REGISTER, APPLY_LOAN, CHECK_STATUS, ACTIVE_LOAN, HELP)
- [ ] Webhook Mastra recibe y procesa mensajes con mismo comportamiento que endpoint legacy
- [ ] Memoria conversacional mantiene contexto entre mensajes de una misma sesión
- [ ] Tools consultan módulos customers/loans sin duplicar lógica de negocio
- [ ] Redis session store se elimina — sesiones migradas a Mastra memory
- [ ] `pnpm lint && pnpm type-check && pnpm build` pasan limpios
