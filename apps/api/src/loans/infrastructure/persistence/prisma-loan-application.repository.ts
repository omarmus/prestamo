import { Injectable, Inject } from '@nestjs/common';
import type { LoanApplicationRepository } from '../../domain/loan-application.repository';
import type { LoanStatus } from '../../domain/value-objects/loan-status';
import { LoanApplication, type TimelineEntry } from '../../domain/loan-application.entity';
import { PrismaService } from '../../../shared/prisma/prisma.service';

// ponytail: Inline row shape instead of Prisma-generated type — avoids import issues before generation.
interface PrismaLoanApplicationRow {
  id: string;
  customerId: string;
  simulationId: string | null;
  amount: unknown;
  termMonths: number;
  annualRate: unknown;
  monthlyPayment: unknown;
  totalInterest: unknown;
  totalPayment: unknown;
  purpose: string | null;
  status: string;
  riskScore: string | null;
  timeline: unknown;
  reviewerId: string | null;
  reviewNotes: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class PrismaLoanApplicationRepository implements LoanApplicationRepository {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async findById(id: string): Promise<LoanApplication | null> {
    const row = await this.prisma.loanApplication.findUnique({ where: { id } });
    return row ? this.toEntity(row as unknown as PrismaLoanApplicationRow) : null;
  }

  async findByCustomerId(customerId: string): Promise<LoanApplication[]> {
    const rows = await this.prisma.loanApplication.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    });
    return (rows as unknown as PrismaLoanApplicationRow[]).map(r => this.toEntity(r));
  }

  async findByCustomerIdAndId(customerId: string, id: string): Promise<LoanApplication | null> {
    const row = await this.prisma.loanApplication.findFirst({
      where: { id, customerId },
    });
    return row ? this.toEntity(row as unknown as PrismaLoanApplicationRow) : null;
  }

  async findPending(
    page: number,
    limit: number,
    status?: string[],
  ): Promise<{ data: LoanApplication[]; total: number }> {
    const where = status ? { status: { in: status } } : {};
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.loanApplication.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.loanApplication.count({ where }),
    ]);
    return {
      data: (rows as unknown as PrismaLoanApplicationRow[]).map(r => this.toEntity(r)),
      total,
    };
  }

  async save(application: LoanApplication): Promise<void> {
    await this.prisma.loanApplication.create({
      data: this.toPrisma(application),
    } as never);
  }

  // ponytail: Atomic status transition using updateMany with { where: { id, status } }.
  // If count === 0, the status changed between read and write → race condition.
  async updateStatus(
    id: string,
    fromStatus: LoanStatus,
    toStatus: string,
    data: Record<string, unknown>,
  ): Promise<boolean> {
    const result = await this.prisma.loanApplication.updateMany({
      where: { id, status: fromStatus },
      data: { status: toStatus, ...data },
    });
    return result.count > 0;
  }

  private toEntity(row: PrismaLoanApplicationRow): LoanApplication {
    return new LoanApplication(
      row.id,
      row.customerId,
      Number(row.amount),
      row.termMonths,
      Number(row.annualRate),
      Number(row.monthlyPayment),
      Number(row.totalInterest),
      Number(row.totalPayment),
      row.purpose,
      row.status as LoanStatus,
      row.riskScore,
      row.simulationId,
      row.reviewerId,
      row.reviewNotes,
      row.reviewedAt?.toISOString() ?? null,
      row.createdAt.toISOString(),
      row.updatedAt.toISOString(),
      (row.timeline as TimelineEntry[]) ?? [],
    );
  }

  // ponytail: Direct object literal — no external type dependency.
  private toPrisma(entity: LoanApplication): Record<string, unknown> {
    return {
      id: entity.id,
      customerId: entity.customerId,
      simulationId: entity.simulationId,
      amount: entity.amount,
      termMonths: entity.termMonths,
      annualRate: entity.annualRate,
      monthlyPayment: entity.monthlyPayment,
      totalInterest: entity.totalInterest,
      totalPayment: entity.totalPayment,
      purpose: entity.purpose,
      status: entity.status,
      riskScore: entity.riskScore,
      timeline: entity.timeline,
      reviewerId: entity.reviewerId,
      reviewNotes: entity.reviewNotes,
      reviewedAt: entity.reviewedAt ? new Date(entity.reviewedAt) : null,
    };
  }
}
