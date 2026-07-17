# Proposal: Fase 2 — Captación: WhatsApp + Chatbot AI

## Intent

Canal de adquisición PRIMARIO del MVP. Sin WhatsApp no hay captación conversacional — solo formularios web fríos. El chatbot AI guía al cliente desde registro hasta solicitud de préstamo sin salir de WhatsApp, bajando la fricción de entrada. Meta Business API es el canal, Claude/GPT el cerebro conversacional.

## Scope

### In Scope
- Módulo `whatsapp` NestJS (webhook, envío de mensajes, verificación challenge, retry+backoff)
- Chatbot AI con 4 intents MVP: REGISTER, APPLY_LOAN, CHECK_STATUS, HELP
- Integración con AI API (Claude/GPT) con rate limiting + fallback a menú estructurado
- 4 tablas Prisma: `whatsapp_contacts`, `whatsapp_conversations`, `whatsapp_messages`, `chatbot_sessions`
- Sesiones de chatbot en Redis (reutiliza infra de refresh tokens)
- Botón flotante WhatsApp en layout de Landing Page
- Meta tags para compartir en web

### Out of Scope
- Notificaciones push proactivas (solo respuestas a mensajes entrantes)
- Email templates / OCR / biometría
- Dashboard de conversaciones (panel admin)
- Broadcast marketing masivo

## Capabilities

### New Capabilities
- `whatsapp-channel`: webhook, envío REST, verificación Meta, retry+backoff, template messages
- `chatbot-ai`: router de intents, integración AI API, fallback tree, manejo de sesiones
- `landing-widget`: botón flotante WhatsApp + meta tags OG/Twitter Card

### Modified Capabilities
- `user-auth`: registro vía WhatsApp permite crear User desde `whatsapp_contacts` (phone-first, sin email requerido inicialmente)

## Approach

Módulo NestJS propio en `apps/api/src/whatsapp/` siguiendo Clean Architecture: `domain/` (entities, ports), `application/` (commands/handlers para send, receive, route intent), `infrastructure/` (axios HTTP para Meta API, Redis session store), `presentation/` (controller webhook + challenge). Chatbot como servicio interno con router de intents: primero intenta AI API, si falla (timeout/error/rate limit) responde con menú fijo. Sesiones en Redis con TTL. Frontend: componente `WhatsAppFloat` en `components/molecules/` + metadata en layout.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `apps/api/src/whatsapp/` | New | Módulo completo (4 capas) |
| `apps/api/prisma/schema.prisma` | Modified | +4 tablas, FK opcional a User |
| `apps/web/app/layout.tsx` | Modified | Meta tags OG + Twitter |
| `apps/web/components/molecules/` | New | WhatsAppFloat widget |
| `apps/api/src/identity/` | Modified | Registration acepta phone como primary identifier |
| Redis | Used | Sesiones chatbot (ya configurado) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Meta rate limits en WhatsApp API | Med | Retry+backoff, cola de mensajes, throttle por contacto |
| Webhook requiere HTTPS (ngrok en dev) | Low | ngrok configurado, documentado en README |
| AI API costs no controlados | Med | Rate limiting por usuario/sesión, fallback tree sin AI |
| AI responde con alucinaciones financieras | Med | System prompt restrictivo + fallback tree + revisión humana en montos > umbral |

## Rollback Plan

1. Desactivar webhook en Meta Business Dashboard (inmediato, sin deploy)
2. Feature flag `landing.whatsapp_button` en `system_configurations` — apagar widget
3. `prisma migrate down` revierte las 4 tablas nuevas
4. `git revert <commits>` — cambio encapsulado por commit atómico

## Dependencies

- Cuenta Meta Business + App de WhatsApp Business API (credenciales: `WHATSAPP_PHONE_ID`, `WHATSAPP_TOKEN`)
- API key de AI provider (Claude/GPT) configurada en `.env`
- ngrok para desarrollo local

## Success Criteria

- [ ] Webhook recibe y responde mensajes de WhatsApp en <2s
- [ ] Chatbot AI guía registro completo vía WhatsApp (crea User en DB)
- [ ] Chatbot responde con menú estructurado cuando AI falla
- [ ] Botón flotante WhatsApp visible en Landing Page
- [ ] Sesión de chatbot persiste en Redis + se reanuda al reconectar
- [ ] `pnpm lint && pnpm type-check && pnpm build` pasan limpios
