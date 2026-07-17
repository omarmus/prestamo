import { ChatbotSession, type ChatbotIntent } from '../domain/chatbot-session.entity';
import type { AIServicePort } from './ports/ai-service.port';
import type { SessionStore } from '../domain/session-store.port';
import type { CheckStatusHandler } from './check-status.handler';

export interface IntentResult {
  intent: ChatbotIntent;
  reply: string;
}

const KEYWORD_MAP: Array<{ pattern: RegExp; intent: ChatbotIntent }> = [
  { pattern: /\b(registro|registrarme|registrar|nuevo|crear cuenta|1)\b/i, intent: 'REGISTER' },
  { pattern: /\b(pr[eé]stamo|solicitar|cr[eé]dito|plata|monto|2)\b/i, intent: 'APPLY_LOAN' },
  { pattern: /\b(estado|consulta|seguimiento|solicitud|mi pr[eé]stamo|3)\b/i, intent: 'CHECK_STATUS' },
];

const INTENT_REPLIES: Record<string, string> = {
  REGISTER:
    'Para registrarte, necesito tu nombre y correo electrónico.\n\n' +
    'Responde con tu nombre completo para empezar.',
  APPLY_LOAN:
    'Para solicitar un préstamo, primero necesitas estar registrado.\n\n' +
    '¿Quieres que te ayude con el registro? Responde "Sí" para empezar.',
  CHECK_STATUS:
    'Para consultar el estado de tu solicitud, necesito tu número de documento.\n\n' +
    'Por favor comparte tu número de identificación.',
  HELP:
    '¡Hola! Soy el asistente de Préstamos Bolivia. Puedo ayudarte con:\n\n' +
    '1️⃣ *Registrarme* — Crear una cuenta nueva\n' +
    '2️⃣ *Solicitar préstamo* — Iniciar una solicitud de crédito\n' +
    '3️⃣ *Consultar estado* — Ver el estado de mi solicitud\n' +
    '4️⃣ *Ayuda* — Ver este menú nuevamente\n\n' +
    'Responde con el número o describe lo que necesitas.',
};

const FLOW_STEPS: Record<string, Array<{ state: string; prompt: string; field: string }>> = {
  REGISTER: [
    { state: 'collecting_name', prompt: 'Por favor, escribe tu nombre completo:', field: 'name' },
    {
      state: 'collecting_email',
      prompt: 'Gracias. Ahora escribe tu correo electrónico (o escribe "saltar" si no tienes):',
      field: 'email',
    },
    {
      state: 'confirming',
      prompt: '¿Confirmas que los datos son correctos? Responde "Sí" para finalizar o "no" para corregir.',
      field: '',
    },
  ],
  APPLY_LOAN: [
    {
      state: 'collecting_amount',
      prompt: '¿Qué monto de préstamo necesitas? (Ej: 5000)',
      field: 'amount',
    },
    {
      state: 'collecting_term',
      prompt: '¿En cuántos meses deseas pagar? (Ej: 12)',
      field: 'termMonths',
    },
    {
      state: 'collecting_purpose',
      prompt: '¿Cuál es el propósito del préstamo? (Ej: Negocio, Educación, Salud)',
      field: 'purpose',
    },
    {
      state: 'confirming',
      prompt: '¿Confirmas que los datos son correctos? Responde "Sí" para finalizar o "no" para corregir.',
      field: '',
    },
  ],
  CHECK_STATUS: [],
  HELP: [],
};

export class RouteIntentHandler {
  constructor(
    private readonly aiService: AIServicePort,
    private readonly sessionStore: SessionStore,
    private readonly checkStatus?: CheckStatusHandler,
  ) {}

  async execute(session: ChatbotSession, messageText: string): Promise<IntentResult> {
    // 1. If session has an active flow, continue it
    if (session.state !== 'init' && session.state !== 'initial') {
      return this.continueFlow(session, messageText);
    }

    // 2. Try AI classification
    const aiResult = await this.aiService.classifyIntent(messageText, []);

    if (aiResult) {
      const intent = aiResult.intent as ChatbotIntent;
      session.intent = intent;
      session.transition('init');

      // Dynamic CHECK_STATUS lookup when available
      if (intent === 'CHECK_STATUS' && this.checkStatus) {
        const result = await this.checkStatus.execute(session.phone);
        return { intent, reply: result.message };
      }

      return { intent, reply: aiResult.reply };
    }

    // 3. Fallback: keyword matching
    const intent = this.matchKeyword(messageText);
    session.intent = intent;
    session.transition('init');

    // Dynamic CHECK_STATUS lookup when available
    if (intent === 'CHECK_STATUS' && this.checkStatus) {
      const result = await this.checkStatus.execute(session.phone);
      return { intent, reply: result.message };
    }

    return { intent, reply: INTENT_REPLIES[intent] ?? INTENT_REPLIES.HELP };
  }

  private continueFlow(session: ChatbotSession, messageText: string): IntentResult {
    const steps = FLOW_STEPS[session.intent];
    if (!steps) {
      session.transition('init');
      return { intent: session.intent, reply: INTENT_REPLIES[session.intent] ?? INTENT_REPLIES.HELP };
    }

    const currentStepIndex = steps.findIndex((s) => s.state === session.state);
    const currentStep = steps[currentStepIndex];

    if (!currentStep) {
      session.transition('init');
      return { intent: session.intent, reply: INTENT_REPLIES[session.intent] ?? INTENT_REPLIES.HELP };
    }

    // Validate input for the current step
    if (currentStep.field === 'name' && (!messageText.trim() || messageText.trim().length < 2)) {
      return { intent: session.intent, reply: 'Por favor, escribe un nombre válido (al menos 2 caracteres).' };
    }

    if (currentStep.field === 'email' && messageText.trim().toLowerCase() !== 'saltar') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(messageText.trim())) {
        return { intent: session.intent, reply: 'Ese correo no parece válido. Intenta de nuevo o escribe "saltar".' };
      }
    }

    if (currentStep.field === 'amount') {
      const amount = Number(messageText.trim());
      if (isNaN(amount) || amount <= 0) {
        return { intent: session.intent, reply: 'Por favor, escribe un monto válido (solo números).' };
      }
    }

    if (currentStep.field === 'termMonths') {
      const term = Number(messageText.trim());
      if (isNaN(term) || term <= 0 || term > 120) {
        return { intent: session.intent, reply: 'Por favor, escribe un número de meses válido (1-120).' };
      }
    }

    // Save collected data
    if (currentStep.field) {
      const value =
        currentStep.field === 'email' && messageText.trim().toLowerCase() === 'saltar'
          ? null
          : currentStep.field === 'amount' || currentStep.field === 'termMonths'
            ? Number(messageText.trim())
            : messageText.trim();
      session.transition(currentStep.state, { [currentStep.field]: value });
    }

    // Advance to next step
    const nextIndex = currentStepIndex + 1;
    if (nextIndex >= steps.length) {
      session.transition('completed');
      return {
        intent: session.intent,
        reply: this.getCompletionReply(session),
      };
    }

    const nextStep = steps[nextIndex];
    session.transition(nextStep.state);
    return { intent: session.intent, reply: nextStep.prompt };
  }

  private getCompletionReply(session: ChatbotSession): string {
    if (session.intent === 'REGISTER') {
      return (
        '¡Gracias! Tus datos han sido registrados:\n\n' +
        `*Nombre:* ${session.data.name ?? ''}\n` +
        `*Email:* ${session.data.email ?? '(no proporcionado)'}\n` +
        `*Teléfono:* ${session.phone}\n\n` +
        'En breve recibirás un mensaje con los detalles de tu cuenta.'
      );
    }

    if (session.intent === 'APPLY_LOAN') {
      return (
        '¡Gracias! Tu solicitud de préstamo ha sido registrada:\n\n' +
        `*Monto:* Bs. ${session.data.amount ?? ''}\n` +
        `*Plazo:* ${session.data.termMonths ?? ''} meses\n` +
        `*Propósito:* ${session.data.purpose ?? ''}\n\n` +
        'Un asesor revisará tu solicitud y te contactará pronto.'
      );
    }

    return 'Gracias por tu información. Un asesor te contactará pronto.';
  }

  private matchKeyword(text: string): ChatbotIntent {
    for (const { pattern, intent } of KEYWORD_MAP) {
      if (pattern.test(text)) return intent;
    }
    return 'HELP';
  }
}