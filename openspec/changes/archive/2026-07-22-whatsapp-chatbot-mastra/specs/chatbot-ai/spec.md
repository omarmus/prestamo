# Delta for chatbot-ai

## ADDED Requirements

### Requirement: ACTIVE_LOAN Intent

The system MUST respond to `ACTIVE_LOAN` by looking up the user's current active loan and returning details (amount, remaining balance, next payment, status). If no active loan exists, MUST inform the user and offer CHECK_STATUS.

#### Scenario: Active loan found
- GIVEN a registered user with a loan in `disbursed` status
- WHEN the Mastra agent selects the ACTIVE_LOAN tool
- THEN it returns principal, remaining balance, next payment date, and loan status

#### Scenario: No active loan
- GIVEN a registered user with no active loans
- WHEN the agent selects ACTIVE_LOAN tool
- THEN it responds "no tienes un préstamo activo" and offers to check past applications

### Requirement: Agent Tools

A Mastra agent MUST expose 5 tools — `registerCustomer`, `applyLoan`, `checkLoanStatus`, `checkActiveLoan`, and `showHelp` — each invoking its corresponding NestJS service via dependency injection. Tools MUST NOT duplicate domain logic; they SHALL delegate to existing module services (customers, loans).

#### Scenario: Tool delegates to NestJS service
- GIVEN a user with valid registration data
- WHEN `registerCustomer` tool executes
- THEN it calls CustomersService.register() and returns the result

#### Scenario: Tool returns error from service
- GIVEN a service throws `EmailAlreadyExists`
- WHEN a tool calls the service
- THEN the tool returns the error message to the agent
- AND the agent generates a user-friendly response

## MODIFIED Requirements

### Requirement: Intent Routing

The system MUST classify messages into one of five intents: `REGISTER`, `APPLY_LOAN`, `CHECK_STATUS`, `ACTIVE_LOAN`, or `HELP`. The Mastra agent SHALL select the appropriate tool based on LLM classification of conversation context.
(Previously: 4 intents via AI API + keyword fallback; now: 5 intents via Mastra agent tool selection)

#### Scenario: Agent selects REGISTER tool
- GIVEN a message "Quiero registrarme"
- WHEN the Mastra agent processes it
- THEN the agent selects the `registerCustomer` tool and advances to `collecting_name`

#### Scenario: Agent selects ACTIVE_LOAN tool
- GIVEN a message "¿Cómo va mi préstamo actual?"
- WHEN the Mastra agent processes it
- THEN the agent selects the `checkActiveLoan` tool

#### Scenario: Unrecognized message
- GIVEN the agent cannot determine intent with confidence
- WHEN processing a message
- THEN it responds with the numbered menu, intent remains `HELP`

### Requirement: AI Integration

The Mastra agent SHALL use its LLM for intent classification and response generation. Tool calls MUST have a configurable timeout (default 10s). Timeouts or LLM errors MUST degrade to rule-based menu responses.
(Previously: OpenAI HTTP raw with fixed 5s timeout and per-session rate limit 10/5min; now: Mastra agent LLM with configurable timeout and built-in rate limiting)

#### Scenario: Tool call succeeds
- GIVEN a user message
- WHEN the agent calls a tool within timeout
- THEN the agent uses the tool's structured response to reply

#### Scenario: Agent timeout
- GIVEN the agent LLM does not respond within the configured timeout
- WHEN processing the message
- THEN a structured menu is returned and the error is logged

## User Stories

- **Como usuario**, quiero consultar mi préstamo activo por WhatsApp, para saber cuánto debo y cuándo vence mi próxima cuota.
- **Como  administrador**, quiero que el chatbot delegue a servicios NestJS existentes, para no duplicar lógica de negocio.

## Acceptance Criteria

- [ ] Mastra agent responde a los 5 intents correctamente con sus tools
- [ ] ACTIVE_LOAN muestra datos reales del préstamo desde LoansService
- [ ] Timeout de 10s degrada a menú sin crashear
- [ ] Cada tool invoca su servicio NestJS sin duplicar lógica
- [ ] `pnpm type-check` y `pnpm build` pasan limpios

## Out of Scope

- Cambios en entidades de dominio (Contact, Conversation, Message)
- Repositorios Prisma de chatbots/contactos
- Dashboard admin de conversaciones
- Lógica de negocio de customers o loans modules
