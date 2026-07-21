import { Module } from '@nestjs/common';
import { CUSTOMER_REPOSITORY } from '../customers/customers.tokens';
import { PrismaCustomerRepository } from '../customers/infrastructure/persistence/prisma-customer.repository';
import { LOAN_APPLICATION_REPOSITORY } from './loans.tokens';
import { ADMIN_QUERY } from './application/ports/admin-query.port';
import { PrismaLoanApplicationRepository } from './infrastructure/persistence/prisma-loan-application.repository';
import { PrismaAdminQueryImpl } from './infrastructure/admin-query/prisma-admin-query.impl';
import { CreateApplicationHandler } from './application/create-application/create-application.handler';
import { ListApplicationsHandler } from './application/get-applications/get-applications.handler';
import { GetApplicationHandler } from './application/get-application/get-application.handler';
import { CancelApplicationHandler } from './application/cancel-application/cancel-application.handler';
import { ReviewApplicationHandler } from './application/review-application/review-application.handler';
import { ListPendingApplicationsHandler } from './application/list-pending-applications/list-pending-applications.handler';
import { LoanApplicationController } from './presentation/loan-application.controller';
import { AdminLoanApplicationController } from './presentation/admin-loan-application.controller';
import { AdminGuard } from './presentation/admin.guard';

@Module({
  controllers: [
    LoanApplicationController,
    AdminLoanApplicationController,
  ],
  providers: [
    { provide: LOAN_APPLICATION_REPOSITORY, useClass: PrismaLoanApplicationRepository },
    { provide: ADMIN_QUERY, useClass: PrismaAdminQueryImpl },
    { provide: CUSTOMER_REPOSITORY, useClass: PrismaCustomerRepository },
    CreateApplicationHandler,
    ListApplicationsHandler,
    GetApplicationHandler,
    CancelApplicationHandler,
    ReviewApplicationHandler,
    ListPendingApplicationsHandler,
    AdminGuard,
  ],
})
export class LoansModule {}
