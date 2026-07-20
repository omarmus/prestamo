import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { CustomerProfile, FullCustomerProfile } from '@prestamos/shared';
import { CUSTOMER_REPOSITORY } from '../../customers.tokens';
import type { CustomerRepository } from '../../domain/customer.repository';
import { Customer } from '../../domain/customer.entity';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class GetProfileHandler {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: CustomerRepository,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async execute(userId: string): Promise<CustomerProfile> {
    const customer = await this.customerRepository.findByUserId(userId);
    if (!customer) throw new NotFoundException('Customer not found');
    return this.toProfile(customer);
  }

  async executeFull(userId: string): Promise<FullCustomerProfile> {
    const customer = await this.customerRepository.findByUserId(userId);
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
