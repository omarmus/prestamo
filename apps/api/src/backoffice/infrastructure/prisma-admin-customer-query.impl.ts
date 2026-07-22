import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import type {
  AdminCustomerQuery,
  AdminCustomerListFilters,
} from '../application/ports/admin-customer-query.port';
import type { AdminCustomerListItem, AdminCustomerDetailResponse } from '@prestamos/shared';

// ponytail: direct Prisma access, extract to dedicated query service if filters grow
@Injectable()
export class PrismaAdminCustomerQueryImpl implements AdminCustomerQuery {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async list(filters: AdminCustomerListFilters): Promise<{
    data: AdminCustomerListItem[];
    total: number;
  }> {
    const where: Record<string, unknown> = { deletedAt: null };

    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { documentNumber: { contains: filters.search, mode: 'insensitive' } },
        { user: { email: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    const skip = (filters.page - 1) * filters.limit;

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.customer.findMany({
        where,
        include: {
          user: { select: { email: true, phone: true } },
          phones: { where: { isPrimary: true }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: filters.limit,
      }),
      this.prisma.customer.count({ where }),
    ]);

    const data: AdminCustomerListItem[] = rows.map((r) => ({
      id: r.id,
      firstName: r.firstName,
      lastName: r.lastName,
      documentType: r.documentType,
      documentNumber: r.documentNumber,
      email: r.user.email,
      phone: r.phones[0]?.phone ?? r.user.phone,
      status: r.status,
      kycStatus: r.kycStatus,
      createdAt: r.createdAt.toISOString(),
    }));

    return { data, total };
  }

  async getById(id: string): Promise<AdminCustomerDetailResponse | null> {
    const customer = await this.prisma.customer.findFirst({
      where: { id, deletedAt: null },
      include: {
        user: { select: { email: true, phone: true, name: true } },
        addresses: true,
        phones: true,
        emails: true,
        employment: true,
        incomes: true,
        bankAccounts: true,
        documents: true,
        simulations: true,
        portalActions: true,
        loans: {
          select: {
            id: true,
            amount: true,
            status: true,
            outstandingBalance: true,
            disbursedAt: true,
          },
        },
        loanApplications: {
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) return null;

    return {
      customer: {
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
        monthlyIncome: customer.monthlyIncome ? Number(customer.monthlyIncome) : null,
        status: customer.status,
        kycStatus: customer.kycStatus,
        createdAt: customer.createdAt.toISOString(),
        updatedAt: customer.updatedAt.toISOString(),
        addresses: customer.addresses.map((a) => ({
          ...a,
          createdAt: a.createdAt.toISOString(),
          updatedAt: a.updatedAt.toISOString(),
        })),
        phones: customer.phones.map((p) => ({
          ...p,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        })),
        emails: customer.emails.map((e) => ({
          ...e,
          createdAt: e.createdAt.toISOString(),
          updatedAt: e.updatedAt.toISOString(),
        })),
        employment: customer.employment
          ? {
              id: customer.employment.id,
              employer: customer.employment.employer,
              position: customer.employment.position,
              employmentStatus: customer.employment.employmentStatus,
              monthlySalary: customer.employment.monthlySalary
                ? Number(customer.employment.monthlySalary)
                : null,
              yearsWorking: customer.employment.yearsWorking,
              createdAt: customer.employment.createdAt.toISOString(),
            }
          : null,
        incomes: customer.incomes.map((i) => ({
          ...i,
          amount: Number(i.amount),
          createdAt: i.createdAt.toISOString(),
          updatedAt: i.updatedAt.toISOString(),
        })),
        bankAccounts: customer.bankAccounts.map((b) => ({
          ...b,
          createdAt: b.createdAt.toISOString(),
          updatedAt: b.updatedAt.toISOString(),
        })),
        documents: customer.documents.map((d) => ({
          ...d,
          createdAt: d.createdAt.toISOString(),
          updatedAt: d.updatedAt.toISOString(),
        })),
        simulations: customer.simulations.map((s) => ({
          id: s.id,
          amount: Number(s.amount),
          termMonths: s.termMonths,
          annualRate: Number(s.annualRate),
          monthlyPayment: s.monthlyPayment ? Number(s.monthlyPayment) : null,
          schedule: s.schedule,
          createdAt: s.createdAt.toISOString(),
        })),
        portalActions: customer.portalActions.map((pa) => ({
          ...pa,
          createdAt: pa.createdAt.toISOString(),
        })),
        user: customer.user,
      },
      loans: customer.loans.map((l) => ({
        id: l.id,
        amount: Number(l.amount),
        status: l.status,
        outstandingBalance: Number(l.outstandingBalance),
        disbursedAt: l.disbursedAt.toISOString(),
      })),
      applications: customer.loanApplications.map((a) => ({
        id: a.id,
        amount: Number(a.amount),
        status: a.status,
        createdAt: a.createdAt.toISOString(),
      })),
    };
  }
}
