import { Module } from '@nestjs/common';

import { CustomersModule } from '../customers/customers.module';
import { IdentityModule } from '../identity/identity.module';
import { LoansModule } from '../loans/loans.module';
import { WebhookController } from './presentation/webhook.controller';
import { MetaHttpService } from './infrastructure/meta-http.service';
import { PrismaContactRepository } from './infrastructure/persistence/prisma-contact.repository';
import { PrismaConversationRepository } from './infrastructure/persistence/prisma-conversation.repository';
import { PrismaMessageRepository } from './infrastructure/persistence/prisma-message.repository';
import { PrismaActiveLoanQueryImpl } from '../loans/infrastructure/active-loan-query/prisma-active-loan-query.impl';
import { PrismaInstallmentRepository } from '../loans/infrastructure/persistence/prisma-installment.repository';
import { PrismaService } from '../shared/prisma/prisma.service';
import { CompleteRegistrationHandler } from './application/complete-registration.handler';
import { ApplyLoanHandler } from './application/apply-loan.handler';
import { CheckStatusHandler } from './application/check-status.handler';
import { createMastra } from '../../mastra/index';
import {
  META_HTTP_SERVICE,
  CONTACT_REPOSITORY,
  CONVERSATION_REPOSITORY,
  MESSAGE_REPOSITORY,
} from './whatsapp.tokens';
import { USER_REPOSITORY } from '../identity/identity.tokens';
import { CUSTOMER_REPOSITORY } from '../customers/customers.tokens';
import { ACTIVE_LOAN_QUERY, INSTALLMENT_REPOSITORY } from '../loans/loans.tokens';
import type { ContactRepository } from './domain/contact-repository.port';
import type { UserRepository } from '../identity/domain/user.repository';
import type { CustomerRepository } from '../customers/domain/customer.repository';
import type { ActiveLoanQuery } from '../loans/application/ports/active-loan-query.port';
import type { InstallmentRepository } from '../loans/domain/loan.repository';

@Module({
  controllers: [WebhookController],
  imports: [
    CustomersModule,
    IdentityModule,
    LoansModule,
  ],
  providers: [
    { provide: META_HTTP_SERVICE, useClass: MetaHttpService },
    { provide: CONTACT_REPOSITORY, useClass: PrismaContactRepository },
    { provide: CONVERSATION_REPOSITORY, useClass: PrismaConversationRepository },
    { provide: MESSAGE_REPOSITORY, useClass: PrismaMessageRepository },
    { provide: ACTIVE_LOAN_QUERY, useClass: PrismaActiveLoanQueryImpl },
    { provide: INSTALLMENT_REPOSITORY, useClass: PrismaInstallmentRepository },
    CompleteRegistrationHandler,
    ApplyLoanHandler,
    CheckStatusHandler,
    // ponytail: Mastra instance provided directly, not via MastraModule.
    // We don't need MastraModule's API routes — WebhookController handles everything.
    {
      provide: 'MASTRA',
      useFactory: (
        completeRegistrationHandler: CompleteRegistrationHandler,
        contactRepository: ContactRepository,
        userRepository: UserRepository,
        prisma: PrismaService,
        customerRepository: CustomerRepository,
        activeLoanQuery: ActiveLoanQuery,
        installmentRepository: InstallmentRepository,
        applyLoanHandler: ApplyLoanHandler,
      ) => createMastra({
        completeRegistrationHandler,
        contactRepository,
        userRepository,
        queryLoanDraftByPhone: async (phone: string) => {
          const row = await prisma.whatsAppLoanDraft.findFirst({
            where: { phone },
            orderBy: { createdAt: 'desc' },
          });
          if (!row) return null;
          return { id: row.id, amount: Number(row.amount), status: row.status, createdAt: row.createdAt };
        },
        customerRepository,
        activeLoanQuery,
        installmentRepository,
        applyLoanHandler,
      }),
      inject: [
        CompleteRegistrationHandler,
        { token: CONTACT_REPOSITORY, optional: false },
        { token: USER_REPOSITORY, optional: false },
        PrismaService,
        { token: CUSTOMER_REPOSITORY, optional: false },
        { token: ACTIVE_LOAN_QUERY, optional: false },
        { token: INSTALLMENT_REPOSITORY, optional: false },
        ApplyLoanHandler,
      ],
    },
  ],
  exports: [
    CompleteRegistrationHandler,
    ApplyLoanHandler,
    CONTACT_REPOSITORY,
  ],
})
export class WhatsAppModule {}
