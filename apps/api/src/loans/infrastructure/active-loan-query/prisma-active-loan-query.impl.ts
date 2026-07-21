import { Injectable, Inject } from '@nestjs/common';
import type { ActiveLoanQuery, ActiveLoanSummary, ActiveLoanDetail } from '../../application/ports/active-loan-query.port';
import { PrismaService } from '../../../shared/prisma/prisma.service';

// ponytail: Inline row shapes instead of Prisma-generated types.
interface PrismaLoanRow {
  id: string;
  applicationId: string;
  customerId: string;
  amount: unknown;
  termMonths: number;
  annualRate: unknown;
  monthlyPayment: unknown;
  totalInterest: unknown;
  totalPayment: unknown;
  outstandingBalance: unknown;
  status: string;
  disbursedAt: Date;
  firstPaymentDate: Date | null;
  nextPaymentDate: Date | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  installments: PrismaInstallmentRow[];
  transactions: PrismaTransactionRow[];
}

interface PrismaInstallmentRow {
  id: string;
  installmentNumber: number;
  dueDate: Date;
  principalAmount: unknown;
  interestAmount: unknown;
  totalAmount: unknown;
  paidPrincipal: unknown;
  paidInterest: unknown;
  paidTotal: unknown;
  status: string;
  paidAt: Date | null;
}

interface PrismaTransactionRow {
  id: string;
  type: string;
  amount: unknown;
  balanceAfter: unknown;
  description: string | null;
  reference: string | null;
  createdAt: Date;
}

@Injectable()
export class PrismaActiveLoanQueryImpl implements ActiveLoanQuery {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async findByCustomerId(customerId: string): Promise<ActiveLoanSummary[]> {
    const rows = await this.prisma.loan.findMany({
      where: { customerId, status: { in: ['ACTIVE'] } },
      include: {
        installments: { orderBy: { installmentNumber: 'asc' as const } },
      },
      orderBy: { disbursedAt: 'desc' as const },
    });

    return (rows as unknown as PrismaLoanRow[]).map((r) => {
      const installments = r.installments;
      const paidCount = installments.filter((i) => i.status === 'PAID').length;
      const totalCount = installments.length;
      const nextInst = installments.find(
        (i) => i.status === 'PENDING' || i.status === 'OVERDUE',
      );

      return {
        id: r.id,
        amount: Number(r.amount),
        outstandingBalance: Number(r.outstandingBalance),
        status: r.status,
        nextPaymentDate: nextInst?.dueDate.toISOString() ?? null,
        nextPaymentAmount: nextInst ? Number(nextInst.totalAmount) : null,
        paidInstallments: paidCount,
        totalInstallments: totalCount,
        disbursedAt: r.disbursedAt.toISOString(),
      };
    });
  }

  async findById(id: string): Promise<ActiveLoanDetail | null> {
    const row = await this.prisma.loan.findUnique({
      where: { id },
      include: {
        installments: { orderBy: { installmentNumber: 'asc' as const } },
        transactions: { orderBy: { createdAt: 'asc' as const } },
      },
    });
    if (!row) return null;
    return this.toDetail(row as unknown as PrismaLoanRow);
  }

  async findByIdAndCustomer(
    customerId: string,
    id: string,
  ): Promise<ActiveLoanDetail | null> {
    const row = await this.prisma.loan.findFirst({
      where: { id, customerId },
      include: {
        installments: { orderBy: { installmentNumber: 'asc' as const } },
        transactions: { orderBy: { createdAt: 'asc' as const } },
      },
    });
    if (!row) return null;
    return this.toDetail(row as unknown as PrismaLoanRow);
  }

  private toDetail(row: PrismaLoanRow): ActiveLoanDetail {
    const installments = row.installments;
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
      transactions: row.transactions.map((t) => ({
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
