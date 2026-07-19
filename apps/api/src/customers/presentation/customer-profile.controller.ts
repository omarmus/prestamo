import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Inject,
  NotFoundException,
  HttpCode,
} from '@nestjs/common';
import type { CustomerProfile, FullCustomerProfile } from '@prestamos/shared';
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
} from '@prestamos/shared';

import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe';
import { CUSTOMER_REPOSITORY } from '../customers.tokens';
import type { CustomerRepository } from '../domain/customer.repository';
import { Customer } from '../domain/customer.entity';
import { PrismaService } from '../../shared/prisma/prisma.service';
import type { JwtPayload } from '@prestamos/shared';

// ponytail: single controller for all customer profile CRUD — PrismaService direct for sub-entities

@Controller('api/customers')
@UseGuards(JwtAuthGuard)
export class CustomerProfileController {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: CustomerRepository,
    private readonly prisma: PrismaService,
  ) {}

  // --- Profile ---

  @Get('me')
  async getProfile(@CurrentUser() user: JwtPayload): Promise<CustomerProfile> {
    const customer = await this.customerRepository.findByUserId(user.sub);
    if (!customer) throw new NotFoundException('Customer not found');
    return this.toProfile(customer);
  }

  @Put('me')
  async updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(UpdateCustomerSchema)) body: Record<string, unknown>,
  ): Promise<CustomerProfile> {
    const customer = await this.customerRepository.findByUserId(user.sub);
    if (!customer) throw new NotFoundException('Customer not found');

    // Reconstituir con nuevos valores manteniendo los existentes
    const updated = Customer.reconstitute({
      id: customer.id,
      userId: customer.userId,
      firstName: (body.firstName as string) ?? customer.firstName,
      lastName: body.lastName != null ? (body.lastName as string) : customer.lastName,
      documentType: body.documentType != null ? (body.documentType as string) : customer.documentType,
      documentNumber: body.documentNumber != null ? (body.documentNumber as string) : customer.documentNumber,
      birthDate: body.birthDate != null ? new Date(body.birthDate as string) : null,
      // ponytail: casteo simple, Zod ya validó tipos
      gender: body.gender != null ? (body.gender as string) : null,
      maritalStatus: body.maritalStatus != null ? (body.maritalStatus as string) : null,
      occupation: body.occupation != null ? (body.occupation as string) : null,
      monthlyIncome: body.monthlyIncome != null ? (body.monthlyIncome as number) : null,
      status: customer.status,
      kycStatus: customer.kycStatus,
      createdAt: customer.createdAt,
      updatedAt: new Date(),
    });

    await this.customerRepository.update(updated);
    return this.toProfile(updated);
  }

  @Get('me/full')
  async getFullProfile(@CurrentUser() user: JwtPayload): Promise<FullCustomerProfile> {
    const customer = await this.customerRepository.findByUserId(user.sub);
    if (!customer) throw new NotFoundException('Customer not found');

    const [addresses, phones, emails, employment, incomes, bankAccounts, documents, simulations, portalActions] =
      await Promise.all([
        this.prisma.customerAddress.findMany({ where: { customerId: customer.id } }),
        this.prisma.customerPhone.findMany({ where: { customerId: customer.id } }),
        this.prisma.customerEmail.findMany({ where: { customerId: customer.id } }),
        this.prisma.customerEmployment.findUnique({ where: { customerId: customer.id } }),
        this.prisma.customerIncome.findMany({ where: { customerId: customer.id } }),
        this.prisma.customerBankAccount.findMany({ where: { customerId: customer.id } }),
        this.prisma.customerDocument.findMany({ where: { customerId: customer.id } }),
        this.prisma.loanSimulation.findMany({ where: { customerId: customer.id } }),
        this.prisma.portalAction.findMany({ where: { customerId: customer.id } }),
      ]);

    return {
      ...this.toProfile(customer),
      addresses: addresses.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() })),
      phones: phones.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() })),
      emails: emails.map((e) => ({ ...e, createdAt: e.createdAt.toISOString() })),
      employment: employment
        ? {
            id: employment.id,
            employer: employment.employer,
            position: employment.position,
            employmentStatus: employment.employmentStatus,
            monthlySalary: employment.monthlySalary ? Number(employment.monthlySalary) : null,
            yearsWorking: employment.yearsWorking,
            createdAt: employment.createdAt.toISOString(),
          }
        : null,
      incomes: incomes.map((i) => ({
        ...i,
        amount: Number(i.amount),
        createdAt: i.createdAt.toISOString(),
      })),
      bankAccounts: bankAccounts.map((b) => ({ ...b, createdAt: b.createdAt.toISOString() })),
      documents: documents.map((d) => ({
        id: d.id,
        type: d.type,
        fileName: d.fileName,
        mimeType: d.mimeType,
        notes: d.notes,
        status: d.status,
        createdAt: d.createdAt.toISOString(),
      })),
      simulations: simulations.map((s) => ({
        id: s.id,
        amount: Number(s.amount),
        termMonths: s.termMonths,
        annualRate: Number(s.annualRate),
        monthlyPayment: s.monthlyPayment ? Number(s.monthlyPayment) : null,
        schedule: s.schedule,
        createdAt: s.createdAt.toISOString(),
      })),
      portalActions: portalActions.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
      })),
    };
  }

  // --- Addresses ---

  @Get('me/addresses')
  async getAddresses(@CurrentUser() user: JwtPayload) {
    const customer = await this.customerRepository.findByUserId(user.sub);
    if (!customer) throw new NotFoundException('Customer not found');
    return this.prisma.customerAddress.findMany({ where: { customerId: customer.id } });
  }

  @Post('me/addresses')
  @HttpCode(201)
  async createAddress(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(CreateAddressSchema)) body: Record<string, unknown>,
  ) {
    const customer = await this.customerRepository.findByUserId(user.sub);
    if (!customer) throw new NotFoundException('Customer not found');
    return this.prisma.customerAddress.create({
      data: {
        customerId: customer.id,
        type: (body.type as string) ?? null,
        country: (body.country as string) ?? null,
        department: (body.department as string) ?? null,
        city: (body.city as string) ?? null,
        zone: (body.zone as string) ?? null,
        street: (body.street as string) ?? null,
        number: (body.number as string) ?? null,
        isPrimary: (body.isPrimary as boolean) ?? false,
      },
    });
  }

  @Put('me/addresses/:id')
  async updateAddress(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateAddressSchema)) body: Record<string, unknown>,
  ) {
    const customer = await this.customerRepository.findByUserId(user.sub);
    if (!customer) throw new NotFoundException('Customer not found');
    const existing = await this.prisma.customerAddress.findFirst({
      where: { id, customerId: customer.id },
    });
    if (!existing) throw new NotFoundException('Address not found');

    return this.prisma.customerAddress.update({
      where: { id },
      data: {
        ...(body.type !== undefined && { type: body.type as string }),
        ...(body.country !== undefined && { country: body.country as string }),
        ...(body.department !== undefined && { department: body.department as string }),
        ...(body.city !== undefined && { city: body.city as string }),
        ...(body.zone !== undefined && { zone: body.zone as string }),
        ...(body.street !== undefined && { street: body.street as string }),
        ...(body.number !== undefined && { number: body.number as string }),
        ...(body.isPrimary !== undefined && { isPrimary: body.isPrimary as boolean }),
      },
    });
  }

  @Delete('me/addresses/:id')
  @HttpCode(204)
  async deleteAddress(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<void> {
    const customer = await this.customerRepository.findByUserId(user.sub);
    if (!customer) throw new NotFoundException('Customer not found');
    const existing = await this.prisma.customerAddress.findFirst({
      where: { id, customerId: customer.id },
    });
    if (!existing) throw new NotFoundException('Address not found');
    await this.prisma.customerAddress.delete({ where: { id } });
  }

  // --- Phones ---

  @Get('me/phones')
  async getPhones(@CurrentUser() user: JwtPayload) {
    const customer = await this.customerRepository.findByUserId(user.sub);
    if (!customer) throw new NotFoundException('Customer not found');
    return this.prisma.customerPhone.findMany({ where: { customerId: customer.id } });
  }

  @Post('me/phones')
  @HttpCode(201)
  async createPhone(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(CreatePhoneSchema)) body: Record<string, unknown>,
  ) {
    const customer = await this.customerRepository.findByUserId(user.sub);
    if (!customer) throw new NotFoundException('Customer not found');
    return this.prisma.customerPhone.create({
      data: {
        customerId: customer.id,
        phone: body.phone as string,
        isWhatsApp: (body.isWhatsApp as boolean) ?? false,
        isPrimary: (body.isPrimary as boolean) ?? false,
      },
    });
  }

  @Put('me/phones/:id')
  async updatePhone(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdatePhoneSchema)) body: Record<string, unknown>,
  ) {
    const customer = await this.customerRepository.findByUserId(user.sub);
    if (!customer) throw new NotFoundException('Customer not found');
    const existing = await this.prisma.customerPhone.findFirst({
      where: { id, customerId: customer.id },
    });
    if (!existing) throw new NotFoundException('Phone not found');

    return this.prisma.customerPhone.update({
      where: { id },
      data: {
        ...(body.phone !== undefined && { phone: body.phone as string }),
        ...(body.isWhatsApp !== undefined && { isWhatsApp: body.isWhatsApp as boolean }),
        ...(body.isPrimary !== undefined && { isPrimary: body.isPrimary as boolean }),
      },
    });
  }

  @Delete('me/phones/:id')
  @HttpCode(204)
  async deletePhone(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<void> {
    const customer = await this.customerRepository.findByUserId(user.sub);
    if (!customer) throw new NotFoundException('Customer not found');
    const existing = await this.prisma.customerPhone.findFirst({
      where: { id, customerId: customer.id },
    });
    if (!existing) throw new NotFoundException('Phone not found');
    await this.prisma.customerPhone.delete({ where: { id } });
  }

  // --- Emails ---

  @Get('me/emails')
  async getEmails(@CurrentUser() user: JwtPayload) {
    const customer = await this.customerRepository.findByUserId(user.sub);
    if (!customer) throw new NotFoundException('Customer not found');
    return this.prisma.customerEmail.findMany({ where: { customerId: customer.id } });
  }

  @Post('me/emails')
  @HttpCode(201)
  async createEmail(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(CreateEmailSchema)) body: Record<string, unknown>,
  ) {
    const customer = await this.customerRepository.findByUserId(user.sub);
    if (!customer) throw new NotFoundException('Customer not found');
    return this.prisma.customerEmail.create({
      data: {
        customerId: customer.id,
        email: body.email as string,
        isPrimary: (body.isPrimary as boolean) ?? false,
      },
    });
  }

  @Put('me/emails/:id')
  async updateEmail(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateEmailSchema)) body: Record<string, unknown>,
  ) {
    const customer = await this.customerRepository.findByUserId(user.sub);
    if (!customer) throw new NotFoundException('Customer not found');
    const existing = await this.prisma.customerEmail.findFirst({
      where: { id, customerId: customer.id },
    });
    if (!existing) throw new NotFoundException('Email not found');

    return this.prisma.customerEmail.update({
      where: { id },
      data: {
        ...(body.email !== undefined && { email: body.email as string }),
        ...(body.isPrimary !== undefined && { isPrimary: body.isPrimary as boolean }),
      },
    });
  }

  @Delete('me/emails/:id')
  @HttpCode(204)
  async deleteEmail(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<void> {
    const customer = await this.customerRepository.findByUserId(user.sub);
    if (!customer) throw new NotFoundException('Customer not found');
    const existing = await this.prisma.customerEmail.findFirst({
      where: { id, customerId: customer.id },
    });
    if (!existing) throw new NotFoundException('Email not found');
    await this.prisma.customerEmail.delete({ where: { id } });
  }

  // --- Employment ---

  @Get('me/employment')
  async getEmployment(@CurrentUser() user: JwtPayload) {
    const customer = await this.customerRepository.findByUserId(user.sub);
    if (!customer) throw new NotFoundException('Customer not found');
    const employment = await this.prisma.customerEmployment.findUnique({
      where: { customerId: customer.id },
    });
    if (!employment) throw new NotFoundException('Employment not found');
    return employment;
  }

  @Put('me/employment')
  async upsertEmployment(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(UpsertEmploymentSchema)) body: Record<string, unknown>,
  ) {
    const customer = await this.customerRepository.findByUserId(user.sub);
    if (!customer) throw new NotFoundException('Customer not found');

    return this.prisma.customerEmployment.upsert({
      where: { customerId: customer.id },
      create: {
        customerId: customer.id,
        employer: (body.employer as string) ?? null,
        position: (body.position as string) ?? null,
        employmentStatus: (body.employmentStatus as string) ?? null,
        monthlySalary: (body.monthlySalary as number) ?? null,
        yearsWorking: (body.yearsWorking as number) ?? null,
      },
      update: {
        ...(body.employer !== undefined && { employer: body.employer as string }),
        ...(body.position !== undefined && { position: body.position as string }),
        ...(body.employmentStatus !== undefined && { employmentStatus: body.employmentStatus as string }),
        ...(body.monthlySalary !== undefined && { monthlySalary: body.monthlySalary as number }),
        ...(body.yearsWorking !== undefined && { yearsWorking: body.yearsWorking as number }),
      },
    });
  }

  // --- Incomes ---

  @Get('me/incomes')
  async getIncomes(@CurrentUser() user: JwtPayload) {
    const customer = await this.customerRepository.findByUserId(user.sub);
    if (!customer) throw new NotFoundException('Customer not found');
    return this.prisma.customerIncome.findMany({ where: { customerId: customer.id } });
  }

  @Post('me/incomes')
  @HttpCode(201)
  async createIncome(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(CreateIncomeSchema)) body: Record<string, unknown>,
  ) {
    const customer = await this.customerRepository.findByUserId(user.sub);
    if (!customer) throw new NotFoundException('Customer not found');
    return this.prisma.customerIncome.create({
      data: {
        customerId: customer.id,
        source: (body.source as string) ?? null,
        amount: body.amount as number,
        frequency: (body.frequency as string) ?? null,
      },
    });
  }

  @Put('me/incomes/:id')
  async updateIncome(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateIncomeSchema)) body: Record<string, unknown>,
  ) {
    const customer = await this.customerRepository.findByUserId(user.sub);
    if (!customer) throw new NotFoundException('Customer not found');
    const existing = await this.prisma.customerIncome.findFirst({
      where: { id, customerId: customer.id },
    });
    if (!existing) throw new NotFoundException('Income not found');

    return this.prisma.customerIncome.update({
      where: { id },
      data: {
        ...(body.source !== undefined && { source: body.source as string }),
        ...(body.amount !== undefined && { amount: body.amount as number }),
        ...(body.frequency !== undefined && { frequency: body.frequency as string }),
      },
    });
  }

  @Delete('me/incomes/:id')
  @HttpCode(204)
  async deleteIncome(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<void> {
    const customer = await this.customerRepository.findByUserId(user.sub);
    if (!customer) throw new NotFoundException('Customer not found');
    const existing = await this.prisma.customerIncome.findFirst({
      where: { id, customerId: customer.id },
    });
    if (!existing) throw new NotFoundException('Income not found');
    await this.prisma.customerIncome.delete({ where: { id } });
  }

  // --- Bank Accounts ---

  @Get('me/bank-accounts')
  async getBankAccounts(@CurrentUser() user: JwtPayload) {
    const customer = await this.customerRepository.findByUserId(user.sub);
    if (!customer) throw new NotFoundException('Customer not found');
    return this.prisma.customerBankAccount.findMany({ where: { customerId: customer.id } });
  }

  @Post('me/bank-accounts')
  @HttpCode(201)
  async createBankAccount(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(CreateBankAccountSchema)) body: Record<string, unknown>,
  ) {
    const customer = await this.customerRepository.findByUserId(user.sub);
    if (!customer) throw new NotFoundException('Customer not found');
    return this.prisma.customerBankAccount.create({
      data: {
        customerId: customer.id,
        bank: (body.bank as string) ?? null,
        accountType: (body.accountType as string) ?? null,
        accountNumber: (body.accountNumber as string) ?? null,
        holderName: (body.holderName as string) ?? null,
        isPrimary: (body.isPrimary as boolean) ?? false,
      },
    });
  }

  @Put('me/bank-accounts/:id')
  async updateBankAccount(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateBankAccountSchema)) body: Record<string, unknown>,
  ) {
    const customer = await this.customerRepository.findByUserId(user.sub);
    if (!customer) throw new NotFoundException('Customer not found');
    const existing = await this.prisma.customerBankAccount.findFirst({
      where: { id, customerId: customer.id },
    });
    if (!existing) throw new NotFoundException('Bank account not found');

    return this.prisma.customerBankAccount.update({
      where: { id },
      data: {
        ...(body.bank !== undefined && { bank: body.bank as string }),
        ...(body.accountType !== undefined && { accountType: body.accountType as string }),
        ...(body.accountNumber !== undefined && { accountNumber: body.accountNumber as string }),
        ...(body.holderName !== undefined && { holderName: body.holderName as string }),
        ...(body.isPrimary !== undefined && { isPrimary: body.isPrimary as boolean }),
      },
    });
  }

  @Delete('me/bank-accounts/:id')
  @HttpCode(204)
  async deleteBankAccount(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<void> {
    const customer = await this.customerRepository.findByUserId(user.sub);
    if (!customer) throw new NotFoundException('Customer not found');
    const existing = await this.prisma.customerBankAccount.findFirst({
      where: { id, customerId: customer.id },
    });
    if (!existing) throw new NotFoundException('Bank account not found');
    await this.prisma.customerBankAccount.delete({ where: { id } });
  }

  // --- Helpers ---

  private toProfile(customer: Customer): CustomerProfile {
    return {
      id: customer.id,
      userId: customer.userId,
      firstName: customer.firstName,
      lastName: customer.lastName,
      documentType: customer.documentType,
      documentNumber: customer.documentNumber,
      birthDate: customer.birthDate?.toISOString() ?? null,
      gender: customer.gender,
      maritalStatus: customer.maritalStatus,
      occupation: customer.occupation,
      monthlyIncome: customer.monthlyIncome,
      status: customer.status,
      kycStatus: customer.kycStatus,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
    };
  }
}
