import { Module } from '@nestjs/common';
import { CUSTOMER_REPOSITORY } from '../customers/customers.tokens';
import { PrismaCustomerRepository } from '../customers/infrastructure/persistence/prisma-customer.repository';
import {
  LOAN_APPLICATION_REPOSITORY,
  LOAN_REPOSITORY,
  INSTALLMENT_REPOSITORY,
  ACTIVE_LOAN_QUERY,
  ADMIN_ACTIVE_LOAN_QUERY,
  GENERATED_DOCUMENT_REPOSITORY,
  CONTRACT_STORAGE_SERVICE,
} from './loans.tokens';
import { ADMIN_QUERY } from './application/ports/admin-query.port';
import { PrismaLoanApplicationRepository } from './infrastructure/persistence/prisma-loan-application.repository';
import { PrismaAdminQueryImpl } from './infrastructure/admin-query/prisma-admin-query.impl';
import { PrismaLoanRepository } from './infrastructure/persistence/prisma-loan.repository';
import { PrismaInstallmentRepository } from './infrastructure/persistence/prisma-installment.repository';
import { PrismaGeneratedDocumentRepository } from './infrastructure/persistence/prisma-generated-document.repository';
import { ContractStorageService } from './infrastructure/storage/contract-storage.service';
import { PrismaActiveLoanQueryImpl } from './infrastructure/active-loan-query/prisma-active-loan-query.impl';
import { PrismaAdminActiveLoanQueryImpl } from './infrastructure/active-loan-query/prisma-admin-active-loan-query.impl';
import { CreateApplicationHandler } from './application/create-application/create-application.handler';
import { ListApplicationsHandler } from './application/get-applications/get-applications.handler';
import { GetApplicationHandler } from './application/get-application/get-application.handler';
import { CancelApplicationHandler } from './application/cancel-application/cancel-application.handler';
import { ReviewApplicationHandler } from './application/review-application/review-application.handler';
import { ListPendingApplicationsHandler } from './application/list-pending-applications/list-pending-applications.handler';
import { DisburseLoanHandler } from './application/disburse-loan/disburse-loan.handler';
import { RegisterPaymentHandler } from './application/register-payment/register-payment.handler';
import { GetActiveLoansHandler } from './application/get-active-loans/get-active-loans.handler';
import { GetActiveLoanDetailHandler } from './application/get-active-loan-detail/get-active-loan-detail.handler';
import { ListActiveLoansHandler } from './application/list-active-loans/list-active-loans.handler';
import { LoanApplicationController } from './presentation/loan-application.controller';
import { AdminLoanApplicationController } from './presentation/admin-loan-application.controller';
import { ActiveLoanController } from './presentation/active-loan.controller';
import { AdminPaymentController } from './presentation/admin-payment.controller';
import { AdminGuard } from './presentation/admin.guard';

@Module({
  controllers: [
    LoanApplicationController,
    AdminLoanApplicationController,
    ActiveLoanController,
    AdminPaymentController,
  ],
  providers: [
    { provide: LOAN_APPLICATION_REPOSITORY, useClass: PrismaLoanApplicationRepository },
    { provide: LOAN_REPOSITORY, useClass: PrismaLoanRepository },
    { provide: INSTALLMENT_REPOSITORY, useClass: PrismaInstallmentRepository },
    { provide: ACTIVE_LOAN_QUERY, useClass: PrismaActiveLoanQueryImpl },
    { provide: ADMIN_ACTIVE_LOAN_QUERY, useClass: PrismaAdminActiveLoanQueryImpl },
    { provide: ADMIN_QUERY, useClass: PrismaAdminQueryImpl },
    { provide: CUSTOMER_REPOSITORY, useClass: PrismaCustomerRepository },
    { provide: GENERATED_DOCUMENT_REPOSITORY, useClass: PrismaGeneratedDocumentRepository },
    { provide: CONTRACT_STORAGE_SERVICE, useClass: ContractStorageService },
    CreateApplicationHandler,
    ListApplicationsHandler,
    GetApplicationHandler,
    CancelApplicationHandler,
    ReviewApplicationHandler,
    ListPendingApplicationsHandler,
    DisburseLoanHandler,
    RegisterPaymentHandler,
    GetActiveLoansHandler,
    GetActiveLoanDetailHandler,
    ListActiveLoansHandler,
    AdminGuard,
  ],
})
export class LoansModule {}
