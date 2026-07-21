import { Injectable, Inject } from '@nestjs/common';
import type { LoanRepository } from '../../domain/loan.repository';
import { Loan } from '../../domain/loan.entity';
import type { Installment } from '../../domain/installment.entity';
import type { ActiveLoanStatus } from '../../domain/value-objects/active-loan-status';
import { PrismaService } from '../../../shared/prisma/prisma.service';

// ponytail: Inline row shape instead of Prisma-generated type — avoids import issues before generation.
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
}

@Injectable()
export class PrismaLoanRepository implements LoanRepository {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async findById(id: string): Promise<Loan | null> {
    const row = await this.prisma.loan.findUnique({ where: { id } });
    return row ? this.toEntity(row as unknown as PrismaLoanRow) : null;
  }

  async findByCustomerId(customerId: string): Promise<Loan[]> {
    const rows = await this.prisma.loan.findMany({
      where: { customerId, status: { in: ['ACTIVE'] } },
      orderBy: { disbursedAt: 'desc' },
    });
    return (rows as unknown as PrismaLoanRow[]).map(r => this.toEntity(r));
  }

  async findByApplicationId(applicationId: string): Promise<Loan | null> {
    const row = await this.prisma.loan.findUnique({ where: { applicationId } });
    return row ? this.toEntity(row as unknown as PrismaLoanRow) : null;
  }

  async save(loan: Loan, installments: Installment[]): Promise<void> {
    await this.prisma.loan.create({
      data: {
        id: loan.id,
        applicationId: loan.applicationId,
        customerId: loan.customerId,
        amount: loan.amount,
        termMonths: loan.termMonths,
        annualRate: loan.annualRate,
        monthlyPayment: loan.monthlyPayment,
        totalInterest: loan.totalInterest,
        totalPayment: loan.totalPayment,
        outstandingBalance: loan.outstandingBalance,
        status: loan.status,
        disbursedAt: new Date(loan.disbursedAt),
        installments: {
          create: installments.map(i => ({
            id: i.id,
            installmentNumber: i.installmentNumber,
            dueDate: new Date(i.dueDate),
            principalAmount: i.principalAmount,
            interestAmount: i.interestAmount,
            totalAmount: i.totalAmount,
            paidPrincipal: 0,
            paidInterest: 0,
            paidTotal: 0,
            status: 'PENDING',
          })),
        },
      },
    } as never);
  }

  async updateStatus(id: string, fromStatus: ActiveLoanStatus, toStatus: string): Promise<boolean> {
    const result = await this.prisma.loan.updateMany({
      where: { id, status: fromStatus },
      data: { status: toStatus },
    });
    return result.count > 0;
  }

  async updateOutstandingBalance(id: string, newBalance: number): Promise<void> {
    await this.prisma.loan.update({
      where: { id },
      data: { outstandingBalance: newBalance },
    });
  }

  private toEntity(row: PrismaLoanRow): Loan {
    return new Loan(
      row.id,
      row.applicationId,
      row.customerId,
      Number(row.amount),
      row.termMonths,
      Number(row.annualRate),
      Number(row.monthlyPayment),
      Number(row.totalInterest),
      Number(row.totalPayment),
      Number(row.outstandingBalance),
      row.status as ActiveLoanStatus,
      row.disbursedAt.toISOString(),
      row.firstPaymentDate?.toISOString() ?? null,
      row.nextPaymentDate?.toISOString() ?? null,
      row.closedAt?.toISOString() ?? null,
      row.createdAt.toISOString(),
      row.updatedAt.toISOString(),
    );
  }
}
