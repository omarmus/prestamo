import { Inject, Injectable } from '@nestjs/common';
import type { AdminApplicationDetail, TimelineEntryResponse } from '@prestamos/shared';
import type { AdminQuery } from '../../application/ports/admin-query.port';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class PrismaAdminQueryImpl implements AdminQuery {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async getApplicationDetail(applicationId: string): Promise<AdminApplicationDetail | null> {
    const app = await this.prisma.loanApplication.findUnique({
      where: { id: applicationId },
      include: {
        customer: {
          include: {
            addresses: true,
            phones: true,
            incomes: true,
            employment: true,
            bankAccounts: true,
            documents: true,
            simulations: true,
          },
        },
      },
    });
    if (!app) return null;

    // Normalize incomes to monthly
    const incomes = app.customer.incomes.map(inc => ({
      id: inc.id,
      source: inc.source,
      amount: Number(inc.amount),
      frequency: inc.frequency,
      monthlyAmount: this.normalizeIncome(Number(inc.amount), inc.frequency),
      createdAt: inc.createdAt.toISOString(),
    }));
    const totalMonthlyIncome = incomes.reduce((s, i) => s + i.monthlyAmount, 0);
    const dti = totalMonthlyIncome > 0
      ? Math.round((Number(app.monthlyPayment) / totalMonthlyIncome) * 100) / 100
      : 0;

    const timeline = (app.timeline as unknown as TimelineEntryResponse[]) ?? [];

    return {
      application: {
        id: app.id,
        amount: Number(app.amount),
        termMonths: app.termMonths,
        annualRate: Number(app.annualRate),
        monthlyPayment: Number(app.monthlyPayment),
        totalInterest: Number(app.totalInterest),
        totalPayment: Number(app.totalPayment),
        purpose: app.purpose,
        status: app.status,
        riskScore: app.riskScore,
        simulationId: app.simulationId,
        reviewerId: app.reviewerId,
        reviewNotes: app.reviewNotes,
        reviewedAt: app.reviewedAt?.toISOString() ?? null,
        createdAt: app.createdAt.toISOString(),
        updatedAt: app.updatedAt.toISOString(),
        timeline,
      },
      customer: {
        id: app.customer.id,
        firstName: app.customer.firstName,
        lastName: app.customer.lastName,
        documentType: app.customer.documentType,
        documentNumber: app.customer.documentNumber,
        status: app.customer.status,
        kycStatus: app.customer.kycStatus,
        addresses: app.customer.addresses ?? [],
        phones: app.customer.phones ?? [],
        incomes,
        employments: app.customer.employment ? [app.customer.employment] : [],
        bankAccounts: app.customer.bankAccounts ?? [],
        documents: app.customer.documents ?? [],
      },
      totalMonthlyIncome,
      dti,
      timeline,
    };
  }

  private normalizeIncome(amount: number, frequency: string | null): number {
    switch (frequency) {
      case 'BIWEEKLY': return Math.round(amount * 2.17 * 100) / 100;
      case 'WEEKLY':   return Math.round(amount * 4.33 * 100) / 100;
      case 'YEARLY':   return Math.round(amount / 12 * 100) / 100;
      default:         return amount; // MONTHLY and null
    }
  }
}
