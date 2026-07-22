import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import type { StatsQuery } from '../application/ports/stats-query.port';
import type { AdminStatsResponse } from '@prestamos/shared';

// ponytail: direct Prisma access, extract to Gateway/DAO if queries grow complex
@Injectable()
export class PrismaStatsQueryImpl implements StatsQuery {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async getStats(): Promise<AdminStatsResponse> {
    const [
      totalApplications,
      pendingApplications,
      totalLoans,
      activeLoans,
      disbursedAgg,
      totalCustomers,
    ] = await Promise.all([
      this.prisma.loanApplication.count(),
      this.prisma.loanApplication.count({ where: { status: 'PENDING' } }),
      this.prisma.loan.count(),
      this.prisma.loan.count({ where: { status: 'ACTIVE' } }),
      this.prisma.loan.aggregate({ _sum: { amount: true } }),
      this.prisma.customer.count(),
    ]);

    return {
      totalApplications,
      pendingApplications,
      totalLoans,
      activeLoans,
      totalDisbursed: Number(disbursedAgg._sum.amount ?? 0),
      totalCustomers,
    };
  }
}
