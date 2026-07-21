import { Module } from '@nestjs/common';
import { CUSTOMER_REPOSITORY } from '../customers/customers.tokens';
import { PrismaCustomerRepository } from '../customers/infrastructure/persistence/prisma-customer.repository';
import { LOAN_APPLICATION_REPOSITORY } from './loans.tokens';
import { PrismaLoanApplicationRepository } from './infrastructure/persistence/prisma-loan-application.repository';
import { CreateApplicationHandler } from './application/create-application/create-application.handler';

@Module({
  controllers: [],
  providers: [
    { provide: LOAN_APPLICATION_REPOSITORY, useClass: PrismaLoanApplicationRepository },
    { provide: CUSTOMER_REPOSITORY, useClass: PrismaCustomerRepository },
    CreateApplicationHandler,
  ],
})
export class LoansModule {}
