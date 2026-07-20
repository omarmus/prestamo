import { Module } from '@nestjs/common';
import { PrismaCustomerRepository } from './infrastructure/persistence/prisma-customer.repository';
import { PrismaCustomerCreator } from './infrastructure/persistence/prisma-customer-creator.impl';
import { CustomerRegisterHandler } from './application/register/customer-register.handler';
import { CustomerProfileController } from './presentation/customer-profile.controller';
import { CustomerDocumentController } from './presentation/customer-document.controller';
import { CustomerSimulationController } from './presentation/customer-simulation.controller';
import { CUSTOMER_REPOSITORY, CUSTOMER_CREATOR } from './customers.tokens';

// Profile
import { GetProfileHandler } from './application/profile/get-profile.handler';
import { UpdateProfileHandler } from './application/profile/update-profile.handler';

// Address
import { GetAddressesHandler } from './application/address/get-addresses.handler';
import { CreateAddressHandler } from './application/address/create-address.handler';
import { UpdateAddressHandler } from './application/address/update-address.handler';
import { DeleteAddressHandler } from './application/address/delete-address.handler';

// Phone
import { GetPhonesHandler } from './application/phone/get-phones.handler';
import { CreatePhoneHandler } from './application/phone/create-phone.handler';
import { UpdatePhoneHandler } from './application/phone/update-phone.handler';
import { DeletePhoneHandler } from './application/phone/delete-phone.handler';

// Email
import { GetEmailsHandler } from './application/email/get-emails.handler';
import { CreateEmailHandler } from './application/email/create-email.handler';
import { UpdateEmailHandler } from './application/email/update-email.handler';
import { DeleteEmailHandler } from './application/email/delete-email.handler';

// Employment
import { GetEmploymentHandler } from './application/employment/get-employment.handler';
import { UpsertEmploymentHandler } from './application/employment/upsert-employment.handler';

// Income
import { GetIncomesHandler } from './application/income/get-incomes.handler';
import { CreateIncomeHandler } from './application/income/create-income.handler';
import { UpdateIncomeHandler } from './application/income/update-income.handler';
import { DeleteIncomeHandler } from './application/income/delete-income.handler';

// Bank Account
import { GetBankAccountsHandler } from './application/bank-account/get-bank-accounts.handler';
import { CreateBankAccountHandler } from './application/bank-account/create-bank-account.handler';
import { UpdateBankAccountHandler } from './application/bank-account/update-bank-account.handler';
import { DeleteBankAccountHandler } from './application/bank-account/delete-bank-account.handler';

// Document
import { ListDocumentsHandler } from './application/document/list-documents.handler';
import { UploadDocumentHandler } from './application/document/upload-document.handler';

// Simulation
import { ListSimulationsHandler } from './application/simulation/list-simulations.handler';
import { CreateSimulationHandler } from './application/simulation/create-simulation.handler';

// Portal Action
import { TrackActionHandler } from './application/portal-action/track-action.handler';

@Module({
  controllers: [
    CustomerProfileController,
    CustomerDocumentController,
    CustomerSimulationController,
  ],
  providers: [
    { provide: CUSTOMER_REPOSITORY, useClass: PrismaCustomerRepository },
    { provide: CUSTOMER_CREATOR, useClass: PrismaCustomerCreator },
    CustomerRegisterHandler,
    GetProfileHandler,
    UpdateProfileHandler,
    GetAddressesHandler,
    CreateAddressHandler,
    UpdateAddressHandler,
    DeleteAddressHandler,
    GetPhonesHandler,
    CreatePhoneHandler,
    UpdatePhoneHandler,
    DeletePhoneHandler,
    GetEmailsHandler,
    CreateEmailHandler,
    UpdateEmailHandler,
    DeleteEmailHandler,
    GetEmploymentHandler,
    UpsertEmploymentHandler,
    GetIncomesHandler,
    CreateIncomeHandler,
    UpdateIncomeHandler,
    DeleteIncomeHandler,
    GetBankAccountsHandler,
    CreateBankAccountHandler,
    UpdateBankAccountHandler,
    DeleteBankAccountHandler,
    ListDocumentsHandler,
    UploadDocumentHandler,
    ListSimulationsHandler,
    CreateSimulationHandler,
    TrackActionHandler,
  ],
  exports: [CUSTOMER_REPOSITORY, CUSTOMER_CREATOR, CustomerRegisterHandler],
})
export class CustomersModule {}
