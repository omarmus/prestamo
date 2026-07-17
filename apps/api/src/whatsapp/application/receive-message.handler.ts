import { WhatsAppContact } from '../domain/whatsapp-contact.entity';
import { WhatsAppConversation } from '../domain/whatsapp-conversation.entity';
import { WhatsAppMessage } from '../domain/whatsapp-message.entity';
import { ChatbotSession } from '../domain/chatbot-session.entity';
import type { ContactRepository } from '../domain/contact-repository.port';
import type { ConversationRepository } from '../domain/conversation-repository.port';
import type { MessageRepository } from '../domain/message-repository.port';
import type { SessionStore } from '../domain/session-store.port';
import type { MetaHttpPort } from './ports/meta-http.port';
import { RouteIntentHandler } from './route-intent.handler';

interface ParsedMessage {
  phone: string;
  text: string;
  messageId?: string;
  messageType: string;
}

export interface ProcessedResult {
  phone: string;
  sessionCompleted: boolean;
}

export class ReceiveMessageHandler {
  constructor(
    private readonly contactRepo: ContactRepository,
    private readonly conversationRepo: ConversationRepository,
    private readonly messageRepo: MessageRepository,
    private readonly sessionStore: SessionStore,
    private readonly metaHttp: MetaHttpPort,
    private readonly routeIntent: RouteIntentHandler,
  ) {}

  async execute(payload: unknown): Promise<ProcessedResult | void> {
    const parsed = this.parsePayload(payload);
    if (!parsed) return;

    const { phone, text, messageId, messageType } = parsed;

    // 1. Find or create contact
    let contact = await this.contactRepo.findByPhone(phone);
    if (!contact) {
      contact = WhatsAppContact.create({ phone });
      contact = await this.contactRepo.save(contact);
    }

    // 2. Find or create conversation
    let conversation = await this.conversationRepo.findActiveByContact(contact.id);
    if (!conversation) {
      conversation = WhatsAppConversation.create({ contactId: contact.id });
      conversation = await this.conversationRepo.save(conversation);
    }

    // 3. Log incoming message
    await this.messageRepo.save(
      WhatsAppMessage.createIncoming({
        conversationId: conversation.id,
        messageType,
        content: text,
        metaId: messageId,
      }),
    );

    // 4. Route intent and respond
    let session = await this.sessionStore.get(phone);
    if (!session) {
      session = ChatbotSession.create(phone, 'HELP');
    }

    const { intent, reply } = await this.routeIntent.execute(session, text);
    session.intent = intent;
    const sessionCompleted = session.state === 'completed';
    await this.sessionStore.save(session);

    const result = await this.metaHttp.sendMessage(phone, reply);

    // 5. Log outgoing message
    await this.messageRepo.save(
      WhatsAppMessage.createOutgoing({
        conversationId: conversation.id,
        messageType: 'text',
        content: reply,
        metaId: result.metaId,
      }),
    );

    return { phone, sessionCompleted };
  }

  /** Parse Meta webhook payload into a normalised message. */
  parsePayload(payload: unknown): ParsedMessage | null {
    try {
      const body = payload as Record<string, unknown>;
      const entry = (body.entry as Array<Record<string, unknown>> | undefined)?.[0];
      const change = (entry?.changes as Array<Record<string, unknown>> | undefined)?.[0];
      const value = change?.value as Record<string, unknown> | undefined;
      const messages = value?.messages as Array<Record<string, unknown>> | undefined;
      const msg = messages?.[0];

      if (!msg) return null;

      const contacts = value?.contacts as Array<Record<string, unknown>> | undefined;
      const phone: string | undefined =
        (msg.from as string) ?? (contacts?.[0]?.wa_id as string);
      if (!phone) return null;

      const msgType = (msg.type as string) ?? 'text';
      let text = '';

      if (msgType === 'text') {
        text = ((msg.text as Record<string, string>)?.body ?? '') as string;
      } else if (msgType === 'interactive') {
        const interactive = msg.interactive as Record<string, Record<string, string>> | undefined;
        text =
          interactive?.button_reply?.title ??
          interactive?.list_reply?.title ??
          '';
      }

      return {
        phone,
        text,
        messageId: msg.id as string | undefined,
        messageType: msgType,
      };
    } catch {
      return null;
    }
  }
}
