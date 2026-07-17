# Chatbot AI Specification

## Purpose

Specify the conversational AI chatbot for WhatsApp: intent detection, session management, AI integration, and structured fallback to menus.

## Requirements

### Requirement: Session Management

Every incoming message MUST map to a chatbot session keyed by sender phone. Each session MUST track `intent`, `state`, and `data_collected`. Sessions MUST expire after 30 minutes of inactivity.

#### Scenario: New conversation

- GIVEN a first message from `+59171234567`
- WHEN the chatbot processes it
- THEN a new session is created with `intent=HELP`, `state=initial`

#### Scenario: Session timeout

- GIVEN a session idle for 30+ minutes
- WHEN a new message arrives
- THEN the old session is discarded and a new one starts

### Requirement: Intent Routing

The system MUST classify messages into one of four intents: `REGISTER`, `APPLY_LOAN`, `CHECK_STATUS`, or `HELP`. Classification SHOULD use the AI API first, with keyword matching as fallback.

#### Scenario: AI classifies intent

- GIVEN a message "Quiero registrarme"
- WHEN classified by AI
- THEN intent is `REGISTER`, state advances to `collecting_name`

#### Scenario: Keyword fallback

- GIVEN the AI API is unavailable
- WHEN a message contains "registro"
- THEN keyword matching classifies as `REGISTER`

#### Scenario: Unrecognized message

- GIVEN no intent matched and AI is unavailable
- WHEN the chatbot processes it
- THEN it responds with a numbered menu, intent remains `HELP`

### Requirement: REGISTER Intent

REGISTER MUST collect `name`, optional `email`, and `phone` (from WhatsApp), then create a customer record. Each step MUST validate before advancing.

#### Scenario: Complete flow

- GIVEN intent `REGISTER`, empty `data_collected`
- WHEN the user provides name, then email (or skip)
- THEN `data_collected` is populated stepwise
- AND the chatbot confirms before creating the customer

#### Scenario: Invalid input rejected

- GIVEN the chatbot expects a name
- WHEN the user sends a blank response
- THEN the chatbot asks again, state does not advance

### Requirement: APPLY_LOAN Intent

APPLY_LOAN MUST collect `amount`, `term_months`, and `purpose` then create a `loan_application` with status `draft`. Unregistered users MUST be redirected to REGISTER first.

#### Scenario: Registered user applies

- GIVEN a registered user with intent `APPLY_LOAN`
- WHEN they provide amount, term, and purpose
- THEN a `loan_application` is created as `draft`

#### Scenario: Unregistered user redirected

- GIVEN an unregistered user selecting APPLY_LOAN
- THEN intent changes to `REGISTER` with a notification

### Requirement: CHECK_STATUS Intent

CHECK_STATUS MUST look up the user's latest `loan_application` and return its status. If none exists, the chatbot MUST offer APPLY_LOAN.

#### Scenario: Application found

- GIVEN a registered user with a `loan_application` in `review`
- WHEN they select CHECK_STATUS
- THEN the chatbot returns the status and estimated time

#### Scenario: No application

- GIVEN a registered user with no loan applications
- WHEN they select CHECK_STATUS
- THEN the chatbot offers to start a new application

### Requirement: AI Integration

AI API (Claude/GPT) MAY classify intents and generate responses. Calls MUST be rate-limited per session (max 10 per 5 min). Timeout (5s) or errors MUST degrade to rule-based menu responses.

#### Scenario: AI call succeeds

- GIVEN a user message
- WHEN the AI responds within 5s
- THEN the chatbot uses the AI response

#### Scenario: AI timeout

- GIVEN the AI does not respond within 5s
- WHEN the chatbot processes the message
- THEN a structured menu is returned, error is logged

### Requirement: HELP Intent

HELP MUST display a numbered menu of available options: registration, loan application, and status check.

#### Scenario: Help menu displayed

- GIVEN a user in `HELP` intent
- WHEN the chatbot processes any message
- THEN it replies with a numbered menu and waits for selection
