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

import { ReceiveMessageHandler } from '../application/receive-message.handler';
import { RouteIntentHandler } from '../application/route-intent.handler';
import { CompleteRegistrationHandler } from '../application/complete-registration.handler';
import { ApplyLoanHandler } from '../application/apply-loan.handler';
import { CheckStatusHandler } from '../application/check-status.handler';
import type { ContactRepository } from '../domain/contact-repository.port';
import type { ConversationRepository } from '../domain/conversation-repository.port';
import type { MessageRepository } from '../domain/message-repository.port';
import type { SessionStore } from '../domain/session-store.port';
import type { MetaHttpPort } from '../application/ports/meta-http.port';
import type { AIServicePort } from '../application/ports/ai-service.port';
import type { LoanApplicationRepository } from '../domain/loan-application-repository.port';
import {
  META_HTTP_SERVICE,
  AI_SERVICE,
  SESSION_STORE,
  CONTACT_REPOSITORY,
  CONVERSATION_REPOSITORY,
  MESSAGE_REPOSITORY,
  LOAN_APPLICATION_REPOSITORY,
} from '../whatsapp.tokens';

@Controller('api/whatsapp/webhook')
export class WebhookController {
  constructor(
    @Inject(META_HTTP_SERVICE) private readonly metaHttp: MetaHttpPort,
    @Inject(AI_SERVICE) private readonly aiService: AIServicePort,
    @Inject(SESSION_STORE) private readonly sessionStore: SessionStore,
    @Inject(CONTACT_REPOSITORY) private readonly contactRepo: ContactRepository,
    @Inject(CONVERSATION_REPOSITORY)
    private readonly conversationRepo: ConversationRepository,
    @Inject(MESSAGE_REPOSITORY) private readonly messageRepo: MessageRepository,
    private readonly completeRegistration: CompleteRegistrationHandler,
    private readonly applyLoan: ApplyLoanHandler,
    @Inject(LOAN_APPLICATION_REPOSITORY)
    private readonly loanRepo: LoanApplicationRepository,
    private readonly configService: ConfigService,
  ) {}

  private getRouteIntent(): RouteIntentHandler {
    return new RouteIntentHandler(this.aiService, this.sessionStore, new CheckStatusHandler(this.loanRepo));
  }

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
    const routeIntent = this.getRouteIntent();
    const handler = new ReceiveMessageHandler(
      this.contactRepo,
      this.conversationRepo,
      this.messageRepo,
      this.sessionStore,
      this.metaHttp,
      routeIntent,
    );

    const result = await handler.execute(payload);

    // If the chatbot session completed, handle post-completion actions
    if (result?.sessionCompleted) {
      const session = await this.sessionStore.get(result.phone);
      if (!session) return;

      if (session.intent === 'REGISTER') {
        try {
          await this.completeRegistration.execute(session);
          // ponytail: session persisted in Redis; DB audit write on session completion
        } catch {
          // registration failed — session already saved in Redis, user can retry
        }
      } else if (session.intent === 'APPLY_LOAN') {
        try {
          await this.applyLoan.execute(session.phone, session.data);
        } catch {
          // loan creation failed — user can retry
        }
      }
    }
  }
}
