import { Module } from '@nestjs/common';

import { WebhookController } from './presentation/webhook.controller';
import { MetaHttpService } from './infrastructure/meta-http.service';
import { AIService } from './infrastructure/ai-http.service';
import { ChatbotSessionRedisStore } from './infrastructure/session-store.redis';
import { PrismaContactRepository } from './infrastructure/persistence/prisma-contact.repository';
import { PrismaConversationRepository } from './infrastructure/persistence/prisma-conversation.repository';
import { PrismaMessageRepository } from './infrastructure/persistence/prisma-message.repository';
import { RedisLoanApplicationRepository } from './infrastructure/redis-loan-application.repository';
import { CompleteRegistrationHandler } from './application/complete-registration.handler';
import { ApplyLoanHandler } from './application/apply-loan.handler';
import { CheckStatusHandler } from './application/check-status.handler';
import {
  META_HTTP_SERVICE,
  AI_SERVICE,
  SESSION_STORE,
  CONTACT_REPOSITORY,
  CONVERSATION_REPOSITORY,
  MESSAGE_REPOSITORY,
  LOAN_APPLICATION_REPOSITORY,
} from './whatsapp.tokens';

@Module({
  controllers: [WebhookController],
  providers: [
    { provide: META_HTTP_SERVICE, useClass: MetaHttpService },
    { provide: AI_SERVICE, useClass: AIService },
    { provide: SESSION_STORE, useClass: ChatbotSessionRedisStore },
    { provide: CONTACT_REPOSITORY, useClass: PrismaContactRepository },
    { provide: CONVERSATION_REPOSITORY, useClass: PrismaConversationRepository },
    { provide: MESSAGE_REPOSITORY, useClass: PrismaMessageRepository },
    { provide: LOAN_APPLICATION_REPOSITORY, useClass: RedisLoanApplicationRepository },
    CompleteRegistrationHandler,
    ApplyLoanHandler,
    CheckStatusHandler,
  ],
})
export class WhatsAppModule {}