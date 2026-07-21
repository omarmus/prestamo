import { Inject, Injectable } from '@nestjs/common';
import type { AdminListQuery, AdminListResponse } from '@prestamos/shared';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class ListPendingApplicationsHandler {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async execute(query: AdminListQuery): Promise<AdminListResponse> {
    const statusFilter = query.status
      ? [query.status]
      : ['PENDING', 'IN_REVIEW'];

    // ponytail: build where clause directly in the handler to handle search/date filters
    // without bloating the repository interface. Extract to a dedicated query service when
    // more filter combinations emerge.
    const where: Record<string, unknown> = {
      status: { in: statusFilter },
    };

    if (query.dateFrom || query.dateTo) {
      const createdAtFilter: Record<string, Date> = {};
      if (query.dateFrom) {
        createdAtFilter.gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        createdAtFilter.lte = new Date(query.dateTo + 'T23:59:59.999Z');
      }
      where.createdAt = createdAtFilter;
    }

    if (query.search) {
      where.customer = {
        OR: [
          { firstName: { contains: query.search, mode: 'insensitive' } },
          { lastName: { contains: query.search, mode: 'insensitive' } },
          { documentNumber: { contains: query.search, mode: 'insensitive' } },
        ],
      };
    }

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.loanApplication.findMany({
        where,
        include: {
          customer: {
            select: { id: true, firstName: true, lastName: true, documentNumber: true },
          },
          reviewer: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.loanApplication.count({ where }),
    ]);

    return {
      data: rows.map(r => ({
        id: r.id,
        amount: Number(r.amount),
        termMonths: r.termMonths,
        annualRate: Number(r.annualRate),
        monthlyPayment: Number(r.monthlyPayment),
        purpose: r.purpose,
        status: r.status,
        riskScore: r.riskScore,
        createdAt: r.createdAt.toISOString(),
        customer: {
          id: r.customer.id,
          firstName: r.customer.firstName,
          lastName: r.customer.lastName,
          documentNumber: r.customer.documentNumber,
        },
        reviewer: r.reviewer ? { id: r.reviewer.id, name: r.reviewer.name } : null,
      })),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }
}
