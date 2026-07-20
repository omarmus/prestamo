import {Inject, Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,} from '@nestjs/common';
import type {
  CustomerProfile,
  FullCustomerProfile,
  UpdateCustomerInput,
  CreateAddressInput,
  UpdateAddressInput,
  CreatePhoneInput,
  UpdatePhoneInput,
  CreateEmailInput,
  UpdateEmailInput,
  UpsertEmploymentInput,
  CreateIncomeInput,
  UpdateIncomeInput,
  CreateBankAccountInput,
  UpdateBankAccountInput,
  CreatePortalActionInput,
} from '@prestamos/shared';
import {
  UpdateCustomerSchema,
  CreateAddressSchema,
  UpdateAddressSchema,
  CreatePhoneSchema,
  UpdatePhoneSchema,
  CreateEmailSchema,
  UpdateEmailSchema,
  UpsertEmploymentSchema,
  CreateIncomeSchema,
  UpdateIncomeSchema,
  CreateBankAccountSchema,
  UpdateBankAccountSchema,
  CreatePortalActionSchema,
} from '@prestamos/shared';

import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe';
import type { JwtPayload } from '@prestamos/shared';

import { GetProfileHandler } from '../application/profile/get-profile.handler';
import { UpdateProfileHandler } from '../application/profile/update-profile.handler';
import { GetAddressesHandler } from '../application/address/get-addresses.handler';
import { CreateAddressHandler } from '../application/address/create-address.handler';
import { UpdateAddressHandler } from '../application/address/update-address.handler';
import { DeleteAddressHandler } from '../application/address/delete-address.handler';
import { GetPhonesHandler } from '../application/phone/get-phones.handler';
import { CreatePhoneHandler } from '../application/phone/create-phone.handler';
import { UpdatePhoneHandler } from '../application/phone/update-phone.handler';
import { DeletePhoneHandler } from '../application/phone/delete-phone.handler';
import { GetEmailsHandler } from '../application/email/get-emails.handler';
import { CreateEmailHandler } from '../application/email/create-email.handler';
import { UpdateEmailHandler } from '../application/email/update-email.handler';
import { DeleteEmailHandler } from '../application/email/delete-email.handler';
import { GetEmploymentHandler } from '../application/employment/get-employment.handler';
import { UpsertEmploymentHandler } from '../application/employment/upsert-employment.handler';
import { GetIncomesHandler } from '../application/income/get-incomes.handler';
import { CreateIncomeHandler } from '../application/income/create-income.handler';
import { UpdateIncomeHandler } from '../application/income/update-income.handler';
import { DeleteIncomeHandler } from '../application/income/delete-income.handler';
import { GetBankAccountsHandler } from '../application/bank-account/get-bank-accounts.handler';
import { CreateBankAccountHandler } from '../application/bank-account/create-bank-account.handler';
import { UpdateBankAccountHandler } from '../application/bank-account/update-bank-account.handler';
import { DeleteBankAccountHandler } from '../application/bank-account/delete-bank-account.handler';
import { TrackActionHandler } from '../application/portal-action/track-action.handler';

@Controller('api/customers')
@UseGuards(JwtAuthGuard)
export class CustomerProfileController {
  constructor(
    @Inject(GetProfileHandler)
    private readonly getProfileHandler: GetProfileHandler,
    @Inject(UpdateProfileHandler)
    private readonly updateProfileHandler: UpdateProfileHandler,
    @Inject(GetAddressesHandler)
    private readonly getAddressesHandler: GetAddressesHandler,
    @Inject(CreateAddressHandler)
    private readonly createAddressHandler: CreateAddressHandler,
    @Inject(UpdateAddressHandler)
    private readonly updateAddressHandler: UpdateAddressHandler,
    @Inject(DeleteAddressHandler)
    private readonly deleteAddressHandler: DeleteAddressHandler,
    @Inject(GetPhonesHandler)
    private readonly getPhonesHandler: GetPhonesHandler,
    @Inject(CreatePhoneHandler)
    private readonly createPhoneHandler: CreatePhoneHandler,
    @Inject(UpdatePhoneHandler)
    private readonly updatePhoneHandler: UpdatePhoneHandler,
    @Inject(DeletePhoneHandler)
    private readonly deletePhoneHandler: DeletePhoneHandler,
    @Inject(GetEmailsHandler)
    private readonly getEmailsHandler: GetEmailsHandler,
    @Inject(CreateEmailHandler)
    private readonly createEmailHandler: CreateEmailHandler,
    @Inject(UpdateEmailHandler)
    private readonly updateEmailHandler: UpdateEmailHandler,
    @Inject(DeleteEmailHandler)
    private readonly deleteEmailHandler: DeleteEmailHandler,
    @Inject(GetEmploymentHandler)
    private readonly getEmploymentHandler: GetEmploymentHandler,
    @Inject(UpsertEmploymentHandler)
    private readonly upsertEmploymentHandler: UpsertEmploymentHandler,
    @Inject(GetIncomesHandler)
    private readonly getIncomesHandler: GetIncomesHandler,
    @Inject(CreateIncomeHandler)
    private readonly createIncomeHandler: CreateIncomeHandler,
    @Inject(UpdateIncomeHandler)
    private readonly updateIncomeHandler: UpdateIncomeHandler,
    @Inject(DeleteIncomeHandler)
    private readonly deleteIncomeHandler: DeleteIncomeHandler,
    @Inject(GetBankAccountsHandler)
    private readonly getBankAccountsHandler: GetBankAccountsHandler,
    @Inject(CreateBankAccountHandler)
    private readonly createBankAccountHandler: CreateBankAccountHandler,
    @Inject(UpdateBankAccountHandler)
    private readonly updateBankAccountHandler: UpdateBankAccountHandler,
    @Inject(DeleteBankAccountHandler)
    private readonly deleteBankAccountHandler: DeleteBankAccountHandler,
    @Inject(TrackActionHandler)
    private readonly trackActionHandler: TrackActionHandler,
  ) {}

  // --- Profile ---

  @Get('me')
  getProfile(@CurrentUser() user: JwtPayload): Promise<CustomerProfile> {
    return this.getProfileHandler.execute(user.sub);
  }

  @Put('me')
  updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(UpdateCustomerSchema)) body: UpdateCustomerInput,
  ): Promise<CustomerProfile> {
    return this.updateProfileHandler.execute(user.sub, body);
  }

  @Get('me/full')
  getFullProfile(@CurrentUser() user: JwtPayload): Promise<FullCustomerProfile> {
    return this.getProfileHandler.executeFull(user.sub);
  }

  // --- Addresses ---

  @Get('me/addresses')
  getAddresses(@CurrentUser() user: JwtPayload) {
    return this.getAddressesHandler.execute(user.sub);
  }

  @Post('me/addresses')
  @HttpCode(201)
  createAddress(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(CreateAddressSchema)) body: CreateAddressInput,
  ) {
    return this.createAddressHandler.execute(user.sub, body);
  }

  @Put('me/addresses/:id')
  updateAddress(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateAddressSchema)) body: UpdateAddressInput,
  ) {
    return this.updateAddressHandler.execute(user.sub, id, body);
  }

  @Delete('me/addresses/:id')
  @HttpCode(204)
  deleteAddress(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<void> {
    return this.deleteAddressHandler.execute(user.sub, id);
  }

  // --- Phones ---

  @Get('me/phones')
  getPhones(@CurrentUser() user: JwtPayload) {
    return this.getPhonesHandler.execute(user.sub);
  }

  @Post('me/phones')
  @HttpCode(201)
  createPhone(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(CreatePhoneSchema)) body: CreatePhoneInput,
  ) {
    return this.createPhoneHandler.execute(user.sub, body);
  }

  @Put('me/phones/:id')
  updatePhone(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdatePhoneSchema)) body: UpdatePhoneInput,
  ) {
    return this.updatePhoneHandler.execute(user.sub, id, body);
  }

  @Delete('me/phones/:id')
  @HttpCode(204)
  deletePhone(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<void> {
    return this.deletePhoneHandler.execute(user.sub, id);
  }

  // --- Emails ---

  @Get('me/emails')
  getEmails(@CurrentUser() user: JwtPayload) {
    return this.getEmailsHandler.execute(user.sub);
  }

  @Post('me/emails')
  @HttpCode(201)
  createEmail(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(CreateEmailSchema)) body: CreateEmailInput,
  ) {
    return this.createEmailHandler.execute(user.sub, body);
  }

  @Put('me/emails/:id')
  updateEmail(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateEmailSchema)) body: UpdateEmailInput,
  ) {
    return this.updateEmailHandler.execute(user.sub, id, body);
  }

  @Delete('me/emails/:id')
  @HttpCode(204)
  deleteEmail(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<void> {
    return this.deleteEmailHandler.execute(user.sub, id);
  }

  // --- Employment ---

  @Get('me/employment')
  getEmployment(@CurrentUser() user: JwtPayload) {
    return this.getEmploymentHandler.execute(user.sub);
  }

  @Put('me/employment')
  upsertEmployment(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(UpsertEmploymentSchema)) body: UpsertEmploymentInput,
  ) {
    return this.upsertEmploymentHandler.execute(user.sub, body);
  }

  // --- Incomes ---

  @Get('me/incomes')
  getIncomes(@CurrentUser() user: JwtPayload) {
    return this.getIncomesHandler.execute(user.sub);
  }

  @Post('me/incomes')
  @HttpCode(201)
  createIncome(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(CreateIncomeSchema)) body: CreateIncomeInput,
  ) {
    return this.createIncomeHandler.execute(user.sub, body);
  }

  @Put('me/incomes/:id')
  updateIncome(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateIncomeSchema)) body: UpdateIncomeInput,
  ) {
    return this.updateIncomeHandler.execute(user.sub, id, body);
  }

  @Delete('me/incomes/:id')
  @HttpCode(204)
  deleteIncome(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<void> {
    return this.deleteIncomeHandler.execute(user.sub, id);
  }

  // --- Bank Accounts ---

  @Get('me/bank-accounts')
  getBankAccounts(@CurrentUser() user: JwtPayload) {
    return this.getBankAccountsHandler.execute(user.sub);
  }

  @Post('me/bank-accounts')
  @HttpCode(201)
  createBankAccount(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(CreateBankAccountSchema)) body: CreateBankAccountInput,
  ) {
    return this.createBankAccountHandler.execute(user.sub, body);
  }

  @Put('me/bank-accounts/:id')
  updateBankAccount(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateBankAccountSchema)) body: UpdateBankAccountInput,
  ) {
    return this.updateBankAccountHandler.execute(user.sub, id, body);
  }

  @Delete('me/bank-accounts/:id')
  @HttpCode(204)
  deleteBankAccount(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<void> {
    return this.deleteBankAccountHandler.execute(user.sub, id);
  }

  // --- Portal Actions ---

  @Post('me/actions')
  @HttpCode(201)
  trackAction(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(CreatePortalActionSchema)) body: CreatePortalActionInput,
  ) {
    return this.trackActionHandler.execute(user.sub, body);
  }
}
