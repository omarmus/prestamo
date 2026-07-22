# Design: WhatsApp Chatbot — Mastra AI Migration

## Technical Approach

Reemplazar la infraestructura del chatbot WhatsApp (FSM manual + AI HTTP raw + Redis session/loan store) por Mastra AI Framework. Las entidades de dominio y repositorios Prisma (contact, conversation, message) se mantienen intactos. Los handlers NestJS existentes (`CompleteRegistrationHandler`, `ApplyLoanHandler`, `CheckStatusHandler`) se wrappean como Mastra tools vía un DI bridge pattern.

**Patrón clave — DI Bridge**: Los tools de Mastra se definen como factory functions que reciben las dependencias NestJS. Un `useFactory` en el módulo WhatsApp construye el agente Mastra con los servicios DI ya resueltos, evitando cualquier acceso global o mutable.

## Architecture Overview

```
                    ┌─────────────────────────────────────┐
                    │         Meta WhatsApp Cloud API      │
                    └──────────────┬──────────────────────┘
                                   │ POST /api/whatsapp/webhook
                                   ▼
┌──────────────────────────────────────────────────────────────────┐
│  NestJS App                                                      │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  WebhookController (GET challenge + POST proxy)             │  │
│  │  - GET  → challenge verification (sin cambios)              │  │
│  │  - POST → parse payload → contact/conversation/message     │  │
│  │           logging (se mantiene) → agent.generate(stream)   │  │
│  │           → send reply via MetaHttpService → log outgoing   │  │
│  └────────────────────────┬───────────────────────────────────┘  │
│                           │ agent.generate()                     │
│                           ▼                                      │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Mastra Agent — customer-support                           │  │
│  │  ┌──────────┐  ┌───────────────────────────────────────┐   │  │
│  │  │ Memory   │  │  Tools (factory-created con DI)        │   │  │
│  │  │ LibSQL   │  │  ┌─────────────────────────────────┐  │   │  │
│  │  │ working  │  │  │ register-customer               │  │   │  │
│  │  │ memory   │  │  │ get-customer-by-phone            │  │   │  │
│  │  │ + hist.  │  │  │ check-loan-application           │  │   │  │
│  │  └──────────┘  │  │ check-loan-status                │  │   │  │
│  │                │  │ check-next-installment           │  │   │  │
│  │                │  │ create-loan-application          │  │   │  │
│  │                │  │ simulate-loan                    │  │   │  │
│  │                │  └─────────────────────────────────┘  │   │  │
│  │                └───────────────────────────────────────┘   │  │
│  └────────────────────────────────────────────────────────────┘  │
│                           │                                      │
│                           ▼                                      │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  NestJS Services (inyectados vía factory en tools)         │  │
│  │                                                           │  │
│  │  CompleteRegistrationHandler → RegisterHandler → Identity │  │
│  │  ApplyLoanHandler → LoanApplication entity → Prisma       │  │
│  │  CheckStatusHandler → RedisLoanApplicationRepository      │  │
│  │  ContactRepository → PrismaContactRepository              │  │
│  │  MetaHttpService → send message via Meta API              │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

## Architecture Decisions

### Decision: DI Bridge pattern instead of requestContext

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `requestContext` en tools | Requiere setear context por request. El agent tool calling de Mastra no expone requestContext desde el NestJS adapter de forma directa. | ❌ |
| Módulo mutable global (singleton) | Funciona pero es frágil — orden de init importa, tests se complican | ❌ |
| **Factory con `useFactory`** | Tools reciben handlers ya resueltos por NestJS DI. El agente se construye en el factory del módulo. Clean + testable. | ✅ |

### Decision: WebhookController como proxy, no delegar ruta a Mastra

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Usar catch-all de `MastraModule.register()` | Mastra genera ruta `/api/agents/.../channels/whatsapp/webhook`. Habría que cambiar URL en Meta dashboard durante migración. | ❌ |
| **Mantener WebhookController** | GET challenge sin cambios. POST parsea + log + llama `agent.generate()` + envía respuesta. Meta URL no cambia. Migración más segura. | ✅ |

El catch-all controller de MastraModule NO se registra. Solo usamos MastraModule para conectar Mastra al lifecycle de NestJS (sin serve HTTP routes propias). WebhookController sigue siendo el entry point.

### Decision: MetaHttpService se mantiene

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `@chat-adapter/whatsapp` channel en Mastra | Agrega dependencia externa con madurez media. Requiere cambiar URL webhook. | ❌ (diferir) |
| **`MetaHttpService` existente** | Ya probado en producción. Retry/backup, timeout, error handling funcionando. | ✅ |

`@chat-adapter/whatsapp` se excluye del scope. MetaHttpService se mantiene como infraestructura para enviar mensajes.

### Decision: No shared Zod schemas nuevas

Los schemas de input/output de los tools son tipos primitivos (`string`, `number`, `boolean`). Se definen inline en cada tool. No se crean schemas en `packages/shared/`.

## Data Flow

```
1. Meta envía POST /api/whatsapp/webhook { entry: [...] }
2. WebhookController.receive() parsea payload
3. Busca/crea Contact + Conversation + Message (incoming) via repos Prisma
4. Recupera sesión previa de Mastra Memory (threadId = phone)
5. Si no hay thread, crea nuevo mensaje al agente Mastra
6. Agent evalúa mensaje + working memory + tools disponibles
7. Agent decide qué tool llamar según el input del usuario
8. Tool ejecuta handler NestJS correspondiente
9. Agent genera respuesta basada en resultado del tool
10. WebhookController envía reply via MetaHttpService.sendMessage()
11. Log del mensaje outgoing vía MessageRepository
```

```
WebhookController                  Agent Mastra              Tool                     NestJS Handler
      │                               │                       │                           │
      │  POST payload                  │                       │                           │
      ├── parse + log incoming ───────►│                       │                           │
      │                               │  evalúa intent         │                           │
      │                               ├──► ¿tool needed? ────►│                           │
      │                               │                       ├──► execute() ───────────►│
      │                               │                       │◄── result ───────────────┤
      │                               │◄── tool result ──────┤                           │
      │                               │  genera reply          │                           │
      │◄── response text ────────────┤                       │                           │
      ├── send via MetaHttpService    │                       │                           │
      ├── log outgoing message        │                       │                           │
      │                               │                       │                           │
```

## Component Structure

### `apps/api/mastra/index.ts`
Factory que construye el Mastra instance con agent + tools. Exporta función `createMastra(deps: ToolDeps): Mastra`.

```typescript
export function createMastra(deps: ToolDeps): Mastra {
  const tools = createTools(deps);
  const agent = createCustomerSupportAgent(tools);
  return new Mastra({ agents: { 'customer-support': agent } });
}
```

### `apps/api/mastra/agents/customer-support.ts`
Define el agente Mastra: model, instructions, tools, memory.

### `apps/api/mastra/tools/*.ts` (7 files)
Cada tool es una factory function `createXTool(deps: { ... }) => Tool`. El `execute` llama al handler NestJS correspondiente. Sin lógica de negocio duplicada.

### `apps/api/mastra/workflows/customer-registration.ts` (opcional, PR3)
Workflow multi-step para registro completo: collect info → create user → create customer → link contact.

### `apps/api/mastra/workflows/loan-application.ts` (opcional, PR3)
Workflow para solicitud: collect amount → collect term → collect purpose → confirm → save application.

## Module Organization — Estructura Final

```
apps/api/src/whatsapp/
├── whatsapp.module.ts          ← MODIFIED: +MastraModule, -providers reemplazados
├── whatsapp.tokens.ts          ← SIN CAMBIOS
├── presentation/
│   └── webhook.controller.ts   ← MODIFIED: POST simplificado, llama a Mastra agent
├── application/
│   ├── apply-loan.handler.ts   ← SE MANTIENE (wrappead por tool)
│   ├── check-status.handler.ts ← SE MANTIENE (wrappead por tool)
│   ├── complete-registration.handler.ts ← SE MANTIENE (wrappead por tool)
│   ├── receive-message.handler.ts ← DELETE (reemplazado por agent)
│   ├── route-intent.handler.ts  ← DELETE (reemplazado por agent)
│   └── send-message.handler.ts  ← DELETE (redundante, MetaHttpService directo)
├── domain/                     ← SIN CAMBIOS (entities, ports)
└── infrastructure/
    ├── meta-http.service.ts     ← SE MANTIENE (envío de mensajes)
    ├── ai-http.service.ts       ← DELETE (reemplazado por agent Mastra)
    ├── session-store.redis.ts   ← DELETE (reemplazado por Mastra Memory)
    ├── redis-loan-application.repository.ts ← DELETE (migrar a Prisma)
    └── persistence/             ← SIN CAMBIOS (Prisma repos)

apps/api/mastra/
├── index.ts                    ← NEW
├── agents/
│   └── customer-support.ts     ← NEW
├── tools/
│   ├── register-customer.ts    ← NEW
│   ├── get-customer-by-phone.ts ← NEW
│   ├── check-loan-application.ts ← NEW
│   ├── check-loan-status.ts    ← NEW
│   ├── check-next-installment.ts ← NEW
│   ├── create-loan-application.ts ← NEW
│   └── simulate-loan.ts        ← NEW
└── workflows/                  ← PR3
    ├── customer-registration.ts ← NEW
    └── loan-application.ts     ← NEW
```

## Tool Design

Cada tool wrappea un handler NestJS existente. Schemas inline con Zod.

### `register-customer.ts`

| Campo | Valor |
|-------|-------|
| **Handler wrappeado** | `CompleteRegistrationHandler.execute(session)` |
| **Input schema** | `{ phone: string, name: string, email?: string }` |
| **Output schema** | `{ userId: string, success: true }` |
| **Notas** | Crea `ChatbotSession` temporal, la pasa al handler, retorna userId |

### `get-customer-by-phone.ts`

| Campo | Valor |
|-------|-------|
| **Handler wrappeado** | `ContactRepository.findByPhone()` + navegación a User |
| **Input schema** | `{ phone: string }` |
| **Output schema** | `{ found: boolean, name?: string, email?: string, isRegistered: boolean }` |
| **Notas** | Consulta contacto + si tiene userId, busca el User. Sirve para que el agent sepa si el cliente ya está registrado |

### `check-loan-application.ts`

| Campo | Valor |
|-------|-------|
| **Handler wrappeado** | `RedisLoanApplicationRepository.findByPhone()` (o futuro Prisma) |
| **Input schema** | `{ phone: string }` |
| **Output schema** | `{ hasApplication: boolean, status?: string, amount?: number, termMonths?: number, purpose?: string }` |
| **Notas** | Wrappeo directo, misma lógica que CheckStatusHandler |

### `check-loan-status.ts`

| Campo | Valor |
|-------|-------|
| **Handler wrappeado** | Mismo `RedisLoanApplicationRepository.findByPhone()` que CheckStatusHandler |
| **Input schema** | `{ phone: string }` |
| **Output schema** | `{ hasApplication: boolean, status?: string, message: string }` |
| **Notas** | Similar a check-loan-application pero con mensaje formateado para el usuario |

### `check-next-installment.ts`

| Campo | Valor |
|-------|-------|
| **Handler wrappeado** | Loans module → `GetActiveLoansHandler` + `InstallmentRepository` |
| **Input schema** | `{ phone: string }` |
| **Output schema** | `{ hasActiveLoan: boolean, nextAmount?: number, nextDueDate?: string, remainingMonths?: number }` |
| **Notas** | Consulta préstamos activos vinculados al usuario del contacto |

### `create-loan-application.ts`

| Campo | Valor |
|-------|-------|
| **Handler wrappeado** | `ApplyLoanHandler.execute(phone, data)` |
| **Input schema** | `{ phone: string, amount: number, termMonths: number, purpose: string }` |
| **Output schema** | `{ applicationId: string, status: string, message: string }` |
| **Notas** | Wrappeo directo. Los datos ya fueron recolectados por el agent en la conversación |

### `simulate-loan.ts`

| Campo | Valor |
|-------|-------|
| **Handler wrappeado** | Loans module → `CreateSimulationHandler` |
| **Input schema** | `{ amount: number, termMonths: number }` |
| **Output schema** | `{ monthlyPayment: number, totalInterest: number, totalPayment: number }` |
| **Notas** | Simulación de cuota mensual. No requiere userId porque es pre-registro |

## Memory Strategy

```typescript
import { Memory } from '@mastra/memory';
import { LibSQLStore, LibSQLVector } from '@mastra/libsql';

const memory = new Memory({
  storage: new LibSQLStore({
    id: 'whatsapp-memory-storage',
    url: `file:${MEMORY_DB_PATH}`,
  }),
  vector: new LibSQLVector({
    id: 'whatsapp-memory-vector',
    url: `file:${MEMORY_DB_PATH}`,
  }),
  options: {
    lastMessages: 20,
    semanticRecall: {
      topK: 3,
      messageRange: { before: 2, after: 1 },
      scope: 'resource', // scope por thread (teléfono)
    },
    workingMemory: {
      enabled: true,
      template: `# Perfil del Cliente

## Datos Personales
- Nombre:
- Teléfono:
- Email:
- ¿Registrado?: No

## Sesión Actual
- Intento:
- Paso del flujo:
- Datos recolectados:
  - Monto solicitado:
  - Plazo (meses):
  - Propósito:

## Préstamo Activo
- ¿Tiene préstamo activo?:
- Monto:
- Próxima cuota:
- Fecha vencimiento:

## Notas
-`,
    },
  },
});
```

- `MEMORY_DB_PATH` via `MEMORY_DB_URL` env var (default: `./data/memory.db`)
- Cada thread se identifica por el número de teléfono del contacto
- `semanticRecall` permite que el agent recuerde conversaciones anteriores relevantes
- `workingMemory` mantiene el estado de la sesión actual (reemplaza `ChatbotSession`)
- El agent actualiza el working memory en cada interacción

## Agent Instructions

```
Eres un asistente de atención al cliente para Préstamos Bolivia, una
fintech digital que otorga préstamos personales en Bolivia.

IDIOMA: Siempre respondes en español boliviano, con un tono amable,
cálido y profesional. Usa "vos" o "tú" de forma natural.

PERSONALIDAD: Eres empático, paciente y claro. NO inventas información.
Si no sabes algo, dile al usuario que lo consultarás con un asesor.

CAPACIDADES:
1. REGISTRO: Ayudas a nuevos clientes a registrarse. Pides nombre
   completo y email (opcional). Usas la herramienta register-customer
   para crear la cuenta.
2. CONSULTAR ESTADO: Verificas si el cliente tiene una solicitud de
   préstamo activa usando check-loan-status.
3. SOLICITAR PRÉSTAMO: Guías al cliente para solicitar un préstamo:
   monto, plazo (meses), propósito. Usas create-loan-application
   al finalizar.
4. SIMULAR: Calculas cuotas mensuales con simulate-loan antes de
   que el cliente decida solicitarlo.
5. PRÓXIMO PAGO: Consultas la próxima cuota de un préstamo activo
   con check-next-installment.
6. AYUDA: Si el cliente no sabe qué hacer, explicas las opciones
   disponibles.

REGLAS:
- SIEMPRE revisa el working memory antes de preguntar algo que el
  cliente ya compartió.
- Si el cliente ya está registrado (working memory indica
  "¿Registrado?: Sí"), NO le ofrezcas registro. Pregúntale si
  quiere solicitar un préstamo o consultar su estado.
- Valida datos básicos (email con @, montos positivos, plazos
  1-120 meses) ANTES de llamar a las herramientas.
- Si una herramienta falla, dile al usuario que hubo un error
  y que intente de nuevo más tarde o contacte a un asesor.
- Si el cliente se desvía del flujo, guíalo amablemente de vuelta.
- Para solicitudes complejas o quejas, ofrece derivar a un asesor
  humano.
- Actualiza el working memory después de CADA interacción relevante.

HERRAMIENTAS DISPONIBLES:
- register-customer: Crea cuenta de usuario (phone, name, email?)
- get-customer-by-phone: Busca si el teléfono ya tiene cuenta
- check-loan-status: Consulta solicitud activa
- check-next-installment: Consulta próxima cuota de préstamo activo
- create-loan-application: Guarda solicitud de préstamo
- simulate-loan: Calcula simulación de cuota
```

## Migration Plan

### PR 1 — Foundation (delivery slice 1)

| Qué | Detalle |
|-----|---------|
| `pnpm add @mastra/core @mastra/nestjs @mastra/memory @mastra/libsql @libsql/client` | Dependencias base |
| Crear `apps/api/mastra/index.ts` | Factory `createMastra(deps)` |
| Crear `apps/api/mastra/agents/customer-support.ts` | Agent con instructions + memory config |
| Crear `apps/api/mastra/tools/register-customer.ts` + `get-customer-by-phone.ts` | 2 tools básicas |
| Modificar `whatsapp.module.ts` | +MastraModule.registerAsync con factory que inyecta handlers y crea mastra |
| Modificar `app.module.ts` | WhatsAppModule sigue importado normalmente |
| **No romper nada legacy** | Legacy handlers siguen registrados |

WebhookController sin cambios en PR1 — Mastra se integra pero no se activa aún.

### PR 2 — Tools + Migración

| Qué | Detalle |
|-----|---------|
| Crear `tools/check-loan-application.ts`, `check-loan-status.ts`, `check-next-installment.ts`, `create-loan-application.ts`, `simulate-loan.ts` | 5 tools restantes |
| Modificar `webhook.controller.ts` | POST: agent.generate() reemplaza routeIntent pipeline |
| `git rm` `receive-message.handler.ts`, `route-intent.handler.ts`, `send-message.handler.ts`, `ai-http.service.ts`, `session-store.redis.ts` | Archivos legacy eliminados |
| Limpiar `whatsapp.module.ts` providers | Quitar AIService, ChatbotSessionRedisStore, handlers eliminados |
| Sesiones Redis legacy → drenaje natural (TTL 30min) | No migración activa de sesiones |

### PR 3 — Workflows + Limpieza Final

| Qué | Detalle |
|-----|---------|
| Crear `mastra/workflows/customer-registration.ts` | Workflow multi-step |
| Crear `mastra/workflows/loan-application.ts` | Workflow multi-step |
| `git rm` `redis-loan-application.repository.ts` + `loan-application.entity.ts` (en whatsapp/domain) | Migrar a módulo loans + Prisma |
| Tests E2E de los 3 PRs combinados | Validar flujos completos |

## Dependencies

```json
{
  "dependencies": {
    "@mastra/core": "^1.0.0",
    "@mastra/nestjs": "^1.0.0",
    "@mastra/memory": "^1.0.0",
    "@mastra/libsql": "^1.0.0",
    "@libsql/client": "^0.14.0"
  }
}
```

Se retira `@chat-adapter/whatsapp` del scope — MetaHttpService legacy se mantiene.

Total: **5 nuevas dependencias** (4 Mastra + 1 libSQL client).

## Testing Strategy

| Layer | Qué testear | Cómo |
|-------|-------------|------|
| **Unit — Tools** | Cada tool con input válido/inválido; mock de handlers | Test unitario con factory: `createXTool({ handler: mock })` y llamar `execute()` directamente |
| **Unit — Agent** | Agent instructions + tool selection | Mastra `agent.generate()` con prompts de prueba, verificar que selecciona tool correcta según input |
| **Unit — Memory** | Working memory template parseo/actualización | Verificar que el template de working memory se renderiza correctamente |
| **Integration — Webhook** | POST /api/whatsapp/webhook → todo el pipeline | Supertest + NestJS testing module con módulos reales (Prisma testcontainer o SQLite) |
| **E2E — Flujos completos** | ChatbotSession → Agent → Tool → Handler → Reply | Script E2E que envía mensajes secuenciales (registro completo, solicitud, consulta) y verifica respuestas |

### Mocking strategy para tools

```typescript
// register-customer.spec.ts
const mockHandler = { execute: vi.fn().mockResolvedValue('user-123') };
const tool = createRegisterCustomerTool({ registerHandler: mockHandler });
const result = await tool.execute({ phone: '+59170000000', name: 'Juan Perez' });
expect(mockHandler.execute).toHaveBeenCalled();
expect(result.userId).toBe('user-123');
```

### Model provider en tests

Usar `model: '__GATEWAY_OPENAI_MODEL__'` o mockear el LLM con una implementación que siempre retorne tool calls específicas para tests de agent.
