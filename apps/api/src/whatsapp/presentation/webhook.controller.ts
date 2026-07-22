import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Mastra } from '@mastra/core/mastra';

import type { ContactRepository } from '../domain/contact-repository.port';
import type { ConversationRepository } from '../domain/conversation-repository.port';
import type { MessageRepository } from '../domain/message-repository.port';
import type { MetaHttpPort } from '../application/ports/meta-http.port';
import { WhatsAppContact } from '../domain/whatsapp-contact.entity';
import { WhatsAppConversation } from '../domain/whatsapp-conversation.entity';
import { WhatsAppMessage } from '../domain/whatsapp-message.entity';
import {
  META_HTTP_SERVICE,
  CONTACT_REPOSITORY,
  CONVERSATION_REPOSITORY,
  MESSAGE_REPOSITORY,
} from '../whatsapp.tokens';

interface ParsedMessage {
  phone: string;
  text: string;
  messageId?: string;
  messageType: string;
}

@Controller('api/whatsapp/webhook')
export class WebhookController {
  constructor(
    @Inject(META_HTTP_SERVICE) private readonly metaHttp: MetaHttpPort,
    @Inject(CONTACT_REPOSITORY) private readonly contactRepo: ContactRepository,
    @Inject(CONVERSATION_REPOSITORY)
    private readonly conversationRepo: ConversationRepository,
    @Inject(MESSAGE_REPOSITORY) private readonly messageRepo: MessageRepository,
    @Inject('MASTRA') private readonly mastra: Mastra,
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {}

  /**
   * Meta webhook verification challenge.
   * GET ?hub.mode=subscribe&hub.verify_token=<token>&hub.challenge=<challenge>
   */
  @Get()
  verify(
    @Query('hub.verify_token') verifyToken: string,
    @Query('hub.challenge') challenge: string,
  ): number {
    const expected = this.configService.get<string>('WHATSAPP_VERIFY_TOKEN');

    if (!verifyToken || verifyToken !== expected) {
      throw new ForbiddenException('Invalid verify token');
    }

    return Number(challenge);
  }

  /**
   * Incoming message from Meta webhook.
   * Always returns 200 to prevent Meta retries (even on malformed payloads).
   */
  @Post()
  @HttpCode(200)
  async receive(@Body() payload: unknown): Promise<void> {
    const parsed = this.parsePayload(payload);
    if (!parsed) return;

    const { phone, text, messageId, messageType } = parsed;

    try {
      // 1. Find or create contact
      let contact = await this.contactRepo.findByPhone(phone);
      if (!contact) {
        contact = WhatsAppContact.create({ phone });
        contact = await this.contactRepo.save(contact);
      }

      // 2. Find or create conversation
      let conversation = await this.conversationRepo.findActiveByContact(
        contact.id,
      );
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

      // 4. Call Mastra agent
      const agent = this.mastra.getAgent('customer-support');
      const result = await agent.generate([
        { role: 'user', content: text },
      ]);
      const reply = result.text;

      // 5. Send reply via MetaHttpService
      const sendResult = await this.metaHttp.sendMessage(phone, reply);

      // 6. Log outgoing message
      await this.messageRepo.save(
        WhatsAppMessage.createOutgoing({
          conversationId: conversation.id,
          messageType: 'text',
          content: reply,
          metaId: sendResult.metaId,
        }),
      );
    } catch {
      // ponytail: ack any error with 200 to prevent Meta retries
    }
  }

  /** Parse Meta webhook payload into a normalised message. */
  private parsePayload(payload: unknown): ParsedMessage | null {
    try {
      const body = payload as Record<string, unknown>;
      const entry = (
        body.entry as Array<Record<string, unknown>> | undefined
      )?.[0];
      const change = (
        entry?.changes as Array<Record<string, unknown>> | undefined
      )?.[0];
      const value = change?.value as Record<string, unknown> | undefined;
      const messages = (
        value?.messages as Array<Record<string, unknown>> | undefined
      )?.[0];

      if (!messages) return null;

      const contacts = (
        value?.contacts as Array<Record<string, unknown>> | undefined
      )?.[0];
      const phone: string | undefined =
        (messages.from as string) ?? (contacts?.wa_id as string);
      if (!phone) return null;

      const msgType = (messages.type as string) ?? 'text';
      let text = '';

      if (msgType === 'text') {
        text =
          ((messages.text as Record<string, string>)?.body ?? '') as string;
      } else if (msgType === 'interactive') {
        const interactive = messages.interactive as
          | Record<string, Record<string, string>>
          | undefined;
        text =
          interactive?.button_reply?.title ??
          interactive?.list_reply?.title ??
          '';
      }

      return {
        phone,
        text,
        messageId: messages.id as string | undefined,
        messageType: msgType,
      };
    } catch {
      return null;
    }
  }
}
