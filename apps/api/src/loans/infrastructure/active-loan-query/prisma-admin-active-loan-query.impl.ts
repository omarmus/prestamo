import { Injectable, Inject } from '@nestjs/common';
import type { AdminActiveLoanQuery } from '../../application/ports/active-loan-query.port';
import type { ActiveLoanSummary, ActiveLoanDetail } from '../../application/ports/active-loan-query.port';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class PrismaAdminActiveLoanQueryImpl implements AdminActiveLoanQuery {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async list(params: {
    page: number;
    limit: number;
    status?: string;
    search?: string;
  }): Promise<{ data: ActiveLoanSummary[]; total: number }> {
    const { page, limit, status, search } = params;
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.customer = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { documentNumber: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [rows, total] = await Promise.all([
      this.prisma.loan.findMany({
        where,
        include: {
          installments: { orderBy: { installmentNumber: 'asc' as const } },
          customer: {
            select: { id: true, firstName: true, lastName: true, documentNumber: true },
          },
        },
        orderBy: { disbursedAt: 'desc' as const },
        skip,
        take: limit,
      }),
      this.prisma.loan.count({ where }),
    ]);

    const data = rows.map((r) => {
      const installments = (r as unknown as { installments: Array<{ status: string }> }).installments;
      const paidCount = installments.filter((i) => i.status === 'PAID').length;
      const totalCount = installments.length;

      return {
        id: r.id,
        amount: Number(r.amount),
        outstandingBalance: Number(r.outstandingBalance),
        status: r.status,
        nextPaymentDate: null,
        nextPaymentAmount: null,
        paidInstallments: paidCount,
        totalInstallments: totalCount,
        disbursedAt: r.disbursedAt.toISOString(),
      };
    });

    return { data, total };
  }

  async getDetail(id: string): Promise<ActiveLoanDetail | null> {
    const row = await this.prisma.loan.findUnique({
      where: { id },
      include: {
        installments: { orderBy: { installmentNumber: 'asc' as const } },
        transactions: { orderBy: { createdAt: 'asc' as const } },
      },
    });
    if (!row) return null;

    const installments = (row as unknown as { installments: Array<{
      id: string; installmentNumber: number; dueDate: Date;
      totalAmount: unknown; principalAmount: unknown; interestAmount: unknown;
      paidTotal: unknown; status: string; paidAt: Date | null;
    }> }).installments;

    const transactions = (row as unknown as { transactions: Array<{
      id: string; type: string; amount: unknown; balanceAfter: unknown;
      description: string | null; reference: string | null; createdAt: Date;
    }> }).transactions;

    const paidCount = installments.filter((i) => i.status === 'PAID').length;
    const totalCount = installments.length;
    const nextInst = installments.find(
      (i) => i.status === 'PENDING' || i.status === 'OVERDUE',
    );

    return {
      id: row.id,
      amount: Number(row.amount),
      outstandingBalance: Number(row.outstandingBalance),
      status: row.status,
      nextPaymentDate: nextInst?.dueDate.toISOString() ?? null,
      nextPaymentAmount: nextInst ? Number(nextInst.totalAmount) : null,
      paidInstallments: paidCount,
      totalInstallments: totalCount,
      disbursedAt: row.disbursedAt.toISOString(),
      applicationId: row.applicationId,
      monthlyPayment: Number(row.monthlyPayment),
      annualRate: Number(row.annualRate),
      termMonths: row.termMonths,
      totalInterest: Number(row.totalInterest),
      totalPayment: Number(row.totalPayment),
      installments: installments.map((i) => ({
        id: i.id,
        installmentNumber: i.installmentNumber,
        dueDate: i.dueDate.toISOString(),
        totalAmount: Number(i.totalAmount),
        principalAmount: Number(i.principalAmount),
        interestAmount: Number(i.interestAmount),
        paidTotal: Number(i.paidTotal),
        status: i.status,
        paidAt: i.paidAt?.toISOString() ?? null,
      })),
      transactions: transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        balanceAfter: Number(t.balanceAfter),
        description: t.description,
        reference: t.reference,
        createdAt: t.createdAt.toISOString(),
      })),
    };
  }
}
