import { Module } from '@nestjs/common';
import { PrismaCustomerRepository } from './infrastructure/persistence/prisma-customer.repository';
import { PrismaCustomerCreator } from './infrastructure/persistence/prisma-customer-creator.impl';
import { CustomerRegisterHandler } from './application/register/customer-register.handler';
import { CUSTOMER_REPOSITORY, CUSTOMER_CREATOR } from './customers.tokens';

@Module({
  providers: [
    { provide: CUSTOMER_REPOSITORY, useClass: PrismaCustomerRepository },
    { provide: CUSTOMER_CREATOR, useClass: PrismaCustomerCreator },
    CustomerRegisterHandler,
  ],
  exports: [CUSTOMER_REPOSITORY, CUSTOMER_CREATOR, CustomerRegisterHandler],
})
export class CustomersModule {}
