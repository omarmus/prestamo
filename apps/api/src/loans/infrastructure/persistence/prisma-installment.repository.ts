import { Injectable, Inject } from '@nestjs/common';
import type { InstallmentRepository } from '../../domain/loan.repository';
import { Installment } from '../../domain/installment.entity';
import type { InstallmentStatus } from '../../domain/value-objects/installment-status';
import { PrismaService } from '../../../shared/prisma/prisma.service';

// ponytail: Inline row shape instead of Prisma-generated type.
interface PrismaInstallmentRow {
  id: string;
  loanId: string;
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
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class PrismaInstallmentRepository implements InstallmentRepository {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async findByLoanId(loanId: string): Promise<Installment[]> {
    const rows = await this.prisma.installment.findMany({
      where: { loanId },
      orderBy: { installmentNumber: 'asc' },
    });
    return (rows as unknown as PrismaInstallmentRow[]).map(r => this.toEntity(r));
  }

  async findNextPending(loanId: string): Promise<Installment | null> {
    const row = await this.prisma.installment.findFirst({
      where: { loanId, status: { in: ['PENDING', 'OVERDUE'] } },
      orderBy: { installmentNumber: 'asc' },
    });
    return row ? this.toEntity(row as unknown as PrismaInstallmentRow) : null;
  }

  async markAsPaid(id: string): Promise<void> {
    await this.prisma.installment.update({
      where: { id },
      data: { status: 'PAID', paidAt: new Date() },
    });
  }

  async countByStatus(loanId: string, status: string): Promise<number> {
    return this.prisma.installment.count({
      where: { loanId, status },
    });
  }

  private toEntity(row: PrismaInstallmentRow): Installment {
    return new Installment(
      row.id,
      row.loanId,
      row.installmentNumber,
      row.dueDate.toISOString(),
      Number(row.principalAmount),
      Number(row.interestAmount),
      Number(row.totalAmount),
      Number(row.paidPrincipal),
      Number(row.paidInterest),
      Number(row.paidTotal),
      row.status as InstallmentStatus,
      row.paidAt?.toISOString() ?? null,
      row.createdAt.toISOString(),
      row.updatedAt.toISOString(),
    );
  }
}
