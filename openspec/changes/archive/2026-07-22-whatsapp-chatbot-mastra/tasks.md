# Tasks: WhatsApp Chatbot — Mastra AI Migration

> **Change**: Reemplazar infraestructura del chatbot WhatsApp (FSM manual + AI HTTP raw + Redis session/loan store) por Mastra AI Framework.
> **PR slicing**: 3 PRs secuenciales.
> **Patrón clave**: DI Bridge — tools se definen como factory functions que reciben dependencias NestJS inyectadas vía `useFactory`.

---

## PR Boundaries

| PR | Nombre | Qué incluye | Depende de |
|----|--------|-------------|------------|
| 1 | Foundation | Deps + `mastra/index.ts` + agente + 2 tools + MODULE wiring (dormant) | — |
| 2 | Tools + Migración | 5 tools restantes + webhook POST rewrite + legacy delete + módulo cleanup | PR 1 |
| 3 | Workflows + Cleanup | Workflows + Redis loan repo → Prisma migration + final teardown + E2E tests | PR 2 |

---

## Task List

### PR 1 — Foundation

- [ ] `T1.1` — Instalar dependencias Mastra: `@mastra/core`, `@mastra/nestjs`, `@mastra/memory`, `@mastra/libsql`, `@libsql/client` en `apps/api/package.json` (#PR1)
- [ ] `T1.2` — Agregar `"mastra/**/*"` al array `include` en `apps/api/tsconfig.json` para que el compilador incluya el directorio `apps/api/mastra/` (#PR1, depende de: T1.1)
- [ ] `T1.3` — Crear `apps/api/mastra/index.ts`: factory `createMastra(deps: ToolDeps): Mastra` que construye el instance con agent + tools (#PR1, depende de: T1.1)
- [ ] `T1.4` — Crear `apps/api/mastra/agents/customer-support.ts`: define el agente Mastra con model config, instructions (español boliviano), tools reference, memory config con LibSQL (#PR1, depende de: T1.3)
- [ ] `T1.5` — Crear `apps/api/mastra/tools/register-customer.ts`: tool factory que wrappea `CompleteRegistrationHandler.execute(session)`. Input: `{ phone, name, email? }`. Output: `{ userId, success: true }` (#PR1, depende de: T1.4)
- [ ] `T1.6` — Crear `apps/api/mastra/tools/get-customer-by-phone.ts`: tool factory que wrappea `ContactRepository.findByPhone()` + navegación a User. Input: `{ phone }`. Output: `{ found, name?, email?, isRegistered }` (#PR1, depende de: T1.4)
- [ ] `T1.7` — Agregar a `.env.example`: `MEMORY_DB_URL=./data/memory.db`, `MASTRA_MODEL=<model>`, `MASTRA_API_KEY=<key>` (#PR1, depende de: T1.1)
- [ ] `T1.8` — Modificar `apps/api/src/whatsapp/whatsapp.module.ts`: agregar `MastraModule.registerAsync()` con `useFactory` que recibe handlers vía `@Inject()` y construye `createMastra()`. **Mantener todos los providers legacy** — Mastra está dormant en PR1 (#PR1, depende de: T1.3–T1.6)
- [ ] `T1.9` — **Tests PR1**: tests unitarios para `register-customer` tool y `get-customer-by-phone` tool con mocks de handlers; test para factory `createMastra()` que verifica agente + tools registrados (#PR1, depende de: T1.5, T1.6)

### PR 2 — Tools + Migración

- [ ] `T2.1` — Crear `apps/api/mastra/tools/check-loan-application.ts`: tool factory que wrappea `RedisLoanApplicationRepository.findByPhone()`. Input: `{ phone }`. Output: `{ hasApplication, status?, amount?, termMonths?, purpose? }` (#PR2, depende de: PR1)
- [ ] `T2.2` — Crear `apps/api/mastra/tools/check-loan-status.ts`: tool factory similar a T2.1 pero con mensaje formateado para el usuario. Input: `{ phone }`. Output: `{ hasApplication, status?, message }` (#PR2, depende de: PR1)
- [ ] `T2.3` — Crear `apps/api/mastra/tools/check-next-installment.ts`: tool factory que consulta loans module → `GetActiveLoansHandler` + `InstallmentRepository`. Input: `{ phone }`. Output: `{ hasActiveLoan, nextAmount?, nextDueDate?, remainingMonths? }` (#PR2, depende de: PR1)
- [ ] `T2.4` — Crear `apps/api/mastra/tools/create-loan-application.ts`: tool factory que wrappea `ApplyLoanHandler.execute(phone, data)`. Input: `{ phone, amount, termMonths, purpose }`. Output: `{ applicationId, status, message }` (#PR2, depende de: PR1)
- [ ] `T2.5` — Crear `apps/api/mastra/tools/simulate-loan.ts`: tool factory que wrappea loans module → `CreateSimulationHandler`. Input: `{ amount, termMonths }`. Output: `{ monthlyPayment, totalInterest, totalPayment }` (#PR2, depende de: PR1)
- [ ] `T2.6` — **Modificar** `apps/api/src/whatsapp/presentation/webhook.controller.ts`: rewrite del método `receive()` para que en lugar de instanciar `ReceiveMessageHandler` + `RouteIntentHandler`:
  1. Parsee payload manualmente (misma lógica de parsePayload, se mueve inline o se mantiene)
  2. Busque/creé Contact + Conversation + Message incoming (Prisma repos — igual que hoy)
  3. Llame a `agent.generate(threadId: phone, messages: [...])` en lugar de `routeIntent.execute()`
  4. Envíe reply via `MetaHttpService.sendMessage()`
  5. Log del mensaje outgoing vía `MessageRepository`
  6. Eliminar inyecciones de AI_SERVICE, SESSION_STORE; mantener META_HTTP_SERVICE, repos Prisma
  (#PR2, depende de: T2.1–T2.5)
- [ ] `T2.7` — **Modificar** `apps/api/src/whatsapp/whatsapp.module.ts`: remover providers `AIService`, `ChatbotSessionRedisStore`, `ReceiveMessageHandler` (si estaba registrado), `RouteIntentHandler` (si estaba registrado) del array de providers. Mantener `MetaHttpService`, repos Prisma, `CompleteRegistrationHandler`, `ApplyLoanHandler`, `CheckStatusHandler` (#PR2, depende de: T2.6)
- [ ] `T2.8` — **Eliminar** (`git rm`) archivos legacy reemplazados:
  - `apps/api/src/whatsapp/application/receive-message.handler.ts`
  - `apps/api/src/whatsapp/application/receive-message.handler.spec.ts`
  - `apps/api/src/whatsapp/application/route-intent.handler.ts`
  - `apps/api/src/whatsapp/application/route-intent.handler.spec.ts`
  - `apps/api/src/whatsapp/application/send-message.handler.ts`
  - `apps/api/src/whatsapp/infrastructure/ai-http.service.ts`
  - `apps/api/src/whatsapp/infrastructure/ai-http.service.spec.ts`
  - `apps/api/src/whatsapp/infrastructure/session-store.redis.ts`
  - `apps/api/src/whatsapp/infrastructure/session-store.redis.spec.ts`
  - `apps/api/src/whatsapp/application/ports/ai-service.port.ts`
  (#PR2, depende de: T2.7)
- [ ] `T2.9` — **Tests PR2**: tests unitarios para las 5 tools nuevas con mocks de handlers; test de integración para webhook controller (POST → Mastra agent → reply) (#PR2, depende de: T2.1–T2.6)

### PR 3 — Workflows + Limpieza Final

- [ ] `T3.1` — Crear `apps/api/mastra/workflows/customer-registration.ts`: workflow multi-step para registro completo: collect info → create user → create customer → link contact. Step functions con Mastra workflow API (#PR3, depende de: PR2)
- [ ] `T3.2` — Crear `apps/api/mastra/workflows/loan-application.ts`: workflow multi-step para solicitud de préstamo: collect amount → collect term → collect purpose → confirm → save application (#PR3, depende de: PR2)
- [ ] `T3.3` — **Migrar** loan application de Redis a Prisma:
  - Crear modelo Prisma `LoanApplication` en `apps/api/prisma/schema.prisma` (si no existe ya en módulo loans)
  - Crear `PrismaLoanApplicationRepository` que implementa `LoanApplicationRepository` port en el módulo loans
  - **O** modificar los tools `check-loan-application`, `check-loan-status`, `create-loan-application` para que apunten al nuevo repositorio Prisma (`create-loan-application` en particular, y `check-loan-status`/`check-loan-application` para consultas)
  - Migración de datos: script one-shot para migrar datos de Redis → Prisma, o drenaje natural (TTL 7d)
  (#PR3, depende de: PR2)
- [ ] `T3.4` — **Eliminar** (`git rm`) archivos Redis legacy:
  - `apps/api/src/whatsapp/infrastructure/redis-loan-application.repository.ts`
  - `apps/api/src/whatsapp/infrastructure/redis-loan-application.repository.spec.ts`
  - `apps/api/src/whatsapp/domain/loan-application.entity.ts`
  - `apps/api/src/whatsapp/domain/loan-application-repository.port.ts`
  (#PR3, depende de: T3.3)
- [ ] `T3.5` — **Modificar** `apps/api/src/whatsapp/whatsapp.module.ts`: remover provider `RedisLoanApplicationRepository` y `LOAN_APPLICATION_REPOSITORY` token. Si `CheckStatusHandler` ya no usa Redis (porque T3.3 lo migró), ajustar su DI (#PR3, depende de: T3.4)
- [ ] `T3.6` — **Modificar** `apps/api/src/whatsapp/whatsapp.tokens.ts`: eliminar `LOAN_APPLICATION_REPOSITORY` si ningún provider lo usa tras T3.5 (#PR3, depende de: T3.5)
- [ ] `T3.7` — **Tests PR3**: tests unitarios para los 2 workflows; test E2E de flujo completo (registro + solicitud + consulta) usando NestJS testing module + mocks de Mastra agent o modo test (#PR3, depende de: T3.1–T3.2)
- [ ] `T3.8` — Verificar que `pnpm type-check`, `pnpm build`, `pnpm test` pasan limpios en todo el monorepo (#PR3, depende de: T3.1–T3.7)
- [ ] `T3.9` — **Limpieza de spec files legacy**: eliminar spec files de handlers que ya no existen si quedaron huérfanos tras PR2 (#PR3, depende de: T3.4)

---

## Dependencies Graph

```
PR1 (Foundation)
  ├── T1.1 (deps)
  │   ├── T1.2 (tsconfig)
  │   └── T1.3 (mastra/index.ts)
  │       └── T1.4 (agent)
  │           ├── T1.5 (register-customer tool)
  │           ├── T1.6 (get-customer-by-phone tool)
  │           └── T1.7 (.env.example)
  └── T1.8 (whatsapp.module.ts +MastraModule)
      └── T1.9 (tests)

PR2 (Tools + Migration)
  ├── T2.1 (check-loan-application tool)
  ├── T2.2 (check-loan-status tool)        ← dependen de PR1
  ├── T2.3 (check-next-installment tool)   ← dependen de PR1
  ├── T2.4 (create-loan-application tool)  ← dependen de PR1
  ├── T2.5 (simulate-loan tool)            ← dependen de PR1
  ├── T2.6 (webhook controller rewrite)    ← depende de T2.1-T2.5
  ├── T2.7 (module cleanup)                ← depende de T2.6
  ├── T2.8 (legacy delete)                 ← depende de T2.7
  └── T2.9 (tests)

PR3 (Workflows + Cleanup)
  ├── T3.1 (registration workflow)
  ├── T3.2 (loan-application workflow)
  ├── T3.3 (Redis→Prisma migration)
  │   ├── T3.4 (Redis legacy delete)
  │   ├── T3.5 (module cleanup)
  │   └── T3.6 (tokens cleanup)
  ├── T3.7 (tests)
  ├── T3.8 (type-check + build + test)
  └── T3.9 (orphan spec cleanup)
```

### Cross-PR Dependencies

| PR | Depende de | Razón |
|----|-----------|-------|
| PR 2 | PR 1 | Tools requieren `mastra/index.ts` + agente existentes; module wiring debe estar en su lugar |
| PR 3 | PR 2 | Workflows requieren tools existentes; cleanup final requiere que PR2 haya eliminado los archivos migrados |
| PR 3 | PR 1 | Los workflows usan agent/tools de PR1 |

Todos los PRs son secuenciales — no hay paralelismo posible.

---

## File Manifest

### NEW Files

| File | PR | Ruta |
|------|----|------|
| Mastra factory | 1 | `apps/api/mastra/index.ts` |
| Agent definition | 1 | `apps/api/mastra/agents/customer-support.ts` |
| register-customer tool | 1 | `apps/api/mastra/tools/register-customer.ts` |
| get-customer-by-phone tool | 1 | `apps/api/mastra/tools/get-customer-by-phone.ts` |
| register-customer tool test | 1 | `apps/api/mastra/tools/register-customer.spec.ts` |
| get-customer-by-phone tool test | 1 | `apps/api/mastra/tools/get-customer-by-phone.spec.ts` |
| Mastra factory test | 1 | `apps/api/mastra/index.spec.ts` |
| check-loan-application tool | 2 | `apps/api/mastra/tools/check-loan-application.ts` |
| check-loan-status tool | 2 | `apps/api/mastra/tools/check-loan-status.ts` |
| check-next-installment tool | 2 | `apps/api/mastra/tools/check-next-installment.ts` |
| create-loan-application tool | 2 | `apps/api/mastra/tools/create-loan-application.ts` |
| simulate-loan tool | 2 | `apps/api/mastra/tools/simulate-loan.ts` |
| 5 tool test files | 2 | `apps/api/mastra/tools/*.spec.ts` (5 files) |
| Webhook integration test | 2 | `apps/api/test/whatsapp-webhook.integration.spec.ts` |
| Customer registration workflow | 3 | `apps/api/mastra/workflows/customer-registration.ts` |
| Loan application workflow | 3 | `apps/api/mastra/workflows/loan-application.ts` |
| 2 workflow test files | 3 | `apps/api/mastra/workflows/*.spec.ts` (2 files) |
| E2E test | 3 | `apps/api/test/whatsapp-e2e.spec.ts` |
| Prisma model + repository | 3 | `apps/api/prisma/schema.prisma` (add LoanApplication model), `apps/api/src/loans/...` |

### MODIFIED Files

| File | PR | Qué cambia |
|------|----|------------|
| `apps/api/package.json` | 1 | +5 dependencias Mastra/libSQL |
| `apps/api/tsconfig.json` | 1 | +`"mastra/**/*"` en `include` |
| `.env.example` | 1 | +`MEMORY_DB_URL`, `MASTRA_MODEL`, `MASTRA_API_KEY` |
| `apps/api/src/whatsapp/whatsapp.module.ts` | 1 | +MastraModule.registerAsync() (dormant) |
| `apps/api/src/whatsapp/whatsapp.module.ts` | 2 | −AIService, −ChatbotSessionRedisStore, −handlers legacy |
| `apps/api/src/whatsapp/presentation/webhook.controller.ts` | 2 | POST rewrite: Mastra agent en vez de RouteIntent |
| `apps/api/src/whatsapp/whatsapp.module.ts` | 3 | −RedisLoanApplicationRepository |
| `apps/api/src/whatsapp/whatsapp.tokens.ts` | 3 | −LOAN_APPLICATION_REPOSITORY |
| `apps/api/prisma/schema.prisma` | 3 | +LoanApplication model |

### DELETED Files

| File | PR | Razón |
|------|----|-------|
| `apps/api/src/whatsapp/application/receive-message.handler.ts` | 2 | Reemplazado por Mastra agent |
| `apps/api/src/whatsapp/application/receive-message.handler.spec.ts` | 2 | Test del handler eliminado |
| `apps/api/src/whatsapp/application/route-intent.handler.ts` | 2 | Reemplazado por Mastra agent + tools |
| `apps/api/src/whatsapp/application/route-intent.handler.spec.ts` | 2 | Test del handler eliminado |
| `apps/api/src/whatsapp/application/send-message.handler.ts` | 2 | Redundante: MetaHttpService directo |
| `apps/api/src/whatsapp/infrastructure/ai-http.service.ts` | 2 | Reemplazado por Mastra agent LLM |
| `apps/api/src/whatsapp/infrastructure/ai-http.service.spec.ts` | 2 | Test del servicio eliminado |
| `apps/api/src/whatsapp/infrastructure/session-store.redis.ts` | 2 | Reemplazado por Mastra Memory |
| `apps/api/src/whatsapp/infrastructure/session-store.redis.spec.ts` | 2 | Test del store eliminado |
| `apps/api/src/whatsapp/application/ports/ai-service.port.ts` | 2 | Port del servicio eliminado |
| `apps/api/src/whatsapp/infrastructure/redis-loan-application.repository.ts` | 3 | Migrado a Prisma |
| `apps/api/src/whatsapp/infrastructure/redis-loan-application.repository.spec.ts` | 3 | Test del repo eliminado |
| `apps/api/src/whatsapp/domain/loan-application.entity.ts` | 3 | Migrado a módulo loans + Prisma |
| `apps/api/src/whatsapp/domain/loan-application-repository.port.ts` | 3 | Port del repo eliminado |

### Files UNCHANGED (importante documentar qué NO se toca)

| File | Razón |
|------|-------|
| `apps/api/src/whatsapp/domain/whatsapp-contact.entity.ts` | Entidad de dominio, intacta |
| `apps/api/src/whatsapp/domain/whatsapp-conversation.entity.ts` | Entidad de dominio, intacta |
| `apps/api/src/whatsapp/domain/whatsapp-message.entity.ts` | Entidad de dominio, intacta |
| `apps/api/src/whatsapp/domain/chatbot-session.entity.ts` | Entidad de dominio, intacta (puede quedar huérfana post-PR2) |
| `apps/api/src/whatsapp/domain/contact-repository.port.ts` | Port Prisma, intacto |
| `apps/api/src/whatsapp/domain/conversation-repository.port.ts` | Port Prisma, intacto |
| `apps/api/src/whatsapp/domain/message-repository.port.ts` | Port Prisma, intacto |
| `apps/api/src/whatsapp/domain/session-store.port.ts` | Port que queda huérfano post-PR2 |
| `apps/api/src/whatsapp/infrastructure/meta-http.service.ts` | Se mantiene (envío de mensajes) |
| `apps/api/src/whatsapp/infrastructure/meta-http.service.spec.ts` | Test del servicio que se mantiene |
| `apps/api/src/whatsapp/infrastructure/persistence/` | Repos Prisma intactos |
| `apps/api/src/whatsapp/application/complete-registration.handler.ts` | Wrappeado por tool, se mantiene |
| `apps/api/src/whatsapp/application/apply-loan.handler.ts` | Wrappeado por tool, se mantiene |
| `apps/api/src/whatsapp/application/check-status.handler.ts` | Wrappeado por tool, se mantiene |
| `apps/api/src/whatsapp/application/ports/meta-http.port.ts` | Puerto que se mantiene |
| `apps/api/src/whatsapp/whatsapp.tokens.ts` | Parcial: solo se elimina LOAN_APPLICATION_REPOSITORY en PR3 |

---

## Verification Criteria

### PR 1 — Foundation

| Criterio | Cómo verificar |
|----------|----------------|
| Dependencias instaladas | `pnpm ls @mastra/core @mastra/nestjs @mastra/memory @mastra/libsql @libsql/client` existentes en `apps/api/node_modules` |
| Factory crea instancia | `createMastra(deps)` retorna `Mastra` instance con agente registrado |
| Agent tiene memory config | Agent instantiated con `Memory` que usa `LibSQLStore` + `LibSQLVector` |
| Tools registradas en agent | `agent.tools` contiene `registerCustomer` y `getCustomerByPhone` |
| DI Bridge funciona | Module factory resuelve handlers vía `@Inject()` y pasa `ToolDeps` a `createMastra()` |
| No rompe nada legacy | `pnpm type-check && pnpm build && pnpm test` pasan |
| Webhook legacy intacto | `GET /api/whatsapp/webhook` sigue respondiendo challenge; POST sigue usando RouteIntent |

### PR 2 — Tools + Migración

| Criterio | Cómo verificar |
|----------|----------------|
| 5 tools nuevas funcionan | Cada tool `execute()` con input válido retorna output esperado; con input inválido retorna error |
| Agent selecciona tool correcta | Test con `agent.generate()` y prompt de prueba verifica tool call |
| Webhook POST usa Mastra | POST /api/whatsapp/webhook → parsea payload → `agent.generate()` → envía reply |
| Handlers legacy eliminados | `git show HEAD --stat` no muestra los archivos eliminados |
| Prisma repos siguen intactos | `pnpm type-check && pnpm build` pasan |
| MetaHttpService se mantiene | `apps/api/src/whatsapp/infrastructure/meta-http.service.ts` existe y pasa tests |
| GET challenge intacto | Misma prueba de curl que antes: GET con token válido → 200, inválido → 403 |
| Timeout degrada a menú | Mock de LLM que no responde → se retorna menú estructurado |

### PR 3 — Workflows + Limpieza Final

| Criterio | Cómo verificar |
|----------|----------------|
| Workflows ejecutan pasos | `customer-registration` workflow completa `collect_info → create_user → create_customer → link_contact` |
| Redis loan repo eliminado | `redis-loan-application.repository.ts` no existe; `CheckStatusHandler` usa Prisma |
| LoanApplication migrado a Prisma | Modelo LoanApplication en schema.prisma, repositorio Prisma en módulo loans |
| Sesiones Redis legacy drenadas | No hay migración activa; TTL 30min expira naturalmente (confirmar que no hay reads) |
| E2E flujo completo | Script E2E envía: "Quiero registrarme" → collect name → "Juan" → collect email → "juan@test.com" → confirm → "Sí" → verifica reply de éxito |
| E2E flujo consulta | Script E2E envía: "¿Cómo va mi préstamo?" → agente llama check-loan-status → retorna estado |
| Full build | `pnpm type-check && pnpm build && pnpm test` pasan en todo el monorepo |

### Curls de verificación (todos los PRs)

```bash
# PR1 — GET challenge intacto
curl -s "http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=test123&hub.challenge=12345"
# → HTTP 200, body: 12345

curl -s "http://localhost:3000/api/whatsapp/webhook?hub.verify_token=wrong"
# → HTTP 403

# PR2+3 — POST con mensaje de texto
curl -s -X POST "http://localhost:3000/api/whatsapp/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": { "phone_number_id": "PHONE_NUMBER_ID" },
          "contacts": [{ "profile": { "name": "Juan" }, "wa_id": "59170000000" }],
          "messages": [{
            "from": "59170000000",
            "id": "wamid.test",
            "type": "text",
            "text": { "body": "Hola, quiero un préstamo" }
          }]
        },
        "field": "messages"
      }]
    }]
  }'
# → HTTP 200
# → Verificar logs: agent.generate() fue llamado, reply enviado
```

---

## Review Workload Forecast

### Estimación de líneas por PR

| PR | New | Modified | Deleted | **Total Δ** | Review effort |
|----|-----|----------|---------|-------------|---------------|
| 1 | ~300-400 | ~50-80 | 0 | **~350-480** | 🔵 Bajo (~20-30 min) |
| 2 | ~400-500 | ~100-200 | ~700-800 | **~1200-1500** | 🟡 Medio (~45-60 min) |
| 3 | ~200-300 | ~50-100 | ~200-300 | **~450-700** | 🔵 Bajo (~20-30 min) |

### Recomendación chained PRs

**PR 1**: < 500 líneas. PR individual normal. Sin chaining necesario.

**PR 2**: Es el PR más grande (~1200-1500 líneas Δ) por la combinación de 5 tools nuevas + webhook rewrite + delete de archivos. La mayoría son archivos eliminados (~700-800 líneas de DELETE), no código nuevo complejo. **No requiere chaining** — las eliminaciones son ruido de review, no carga cognitiva real.

**PR 3**: < 700 líneas. PR individual normal. Sin chaining necesario.

**Conclusión**: Los 3 PRs individuales son manejables tal como están diseñados. No se recomienda splitting adicional. El review más pesado es PR 2 (~45-60 min), pero la mayoría del diff son archivos eliminados que se revisan en segundos.
