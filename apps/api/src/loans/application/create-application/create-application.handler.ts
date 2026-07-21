import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { CreateLoanApplicationInput, LoanApplicationResponse } from '@prestamos/shared';
import { LOAN_APPLICATION_REPOSITORY } from '../../loans.tokens';
import { CUSTOMER_REPOSITORY } from '../../../customers/customers.tokens';
import type { LoanApplicationRepository } from '../../domain/loan-application.repository';
import type { CustomerRepository } from '../../../customers/domain/customer.repository';
import type { Customer } from '../../../customers/domain/customer.entity';
import { LoanApplication } from '../../domain/loan-application.entity';
import type { TimelineEntry } from '../../domain/loan-application.entity';
import { LoanNotFoundError, InsufficientIncomeError } from '../../domain/loan-application.errors';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { calculateLoan } from '../../../shared/loan-calculator';

@Injectable()
export class CreateApplicationHandler {
  constructor(
    @Inject(LOAN_APPLICATION_REPOSITORY)
    private readonly repo: LoanApplicationRepository,
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepo: CustomerRepository,
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    customer: Customer,
    input: CreateLoanApplicationInput & { submit?: boolean },
  ): Promise<LoanApplicationResponse> {
    // 1. Resolve loan data: from simulationId OR calculate directly
    let loanData: {
      amount: number;
      termMonths: number;
      annualRate: number;
      monthlyPayment: number;
      totalInterest: number;
      totalPayment: number;
    };

    if (input.simulationId) {
      const simulation = await this.prisma.loanSimulation.findUnique({
        where: { id: input.simulationId },
      });
      if (!simulation || simulation.customerId !== customer.id) {
        throw new LoanNotFoundError(input.simulationId);
      }
      // ponytail: Recalculates loan even when simulationId is provided — avoids stale calculation bugs.
      const calc = calculateLoan(
        Number(simulation.amount),
        Number(simulation.annualRate),
        simulation.termMonths,
      );
      loanData = {
        amount: Number(simulation.amount),
        termMonths: simulation.termMonths,
        annualRate: Number(simulation.annualRate),
        monthlyPayment: calc.monthlyPayment,
        totalInterest: calc.totalInterest,
        totalPayment: calc.totalPayment,
      };
    } else {
      const calc = calculateLoan(input.amount!, input.annualRate!, input.termMonths!);
      loanData = {
        amount: input.amount!,
        termMonths: input.termMonths!,
        annualRate: input.annualRate!,
        ...calc,
      };
    }

    // 2. If submit=true, validate incomes exist
    if (input.submit) {
      const customerIncomes = await this.prisma.customerIncome.findMany({
        where: { customerId: customer.id },
      });
      if (customerIncomes.length === 0) {
        throw new InsufficientIncomeError();
      }
    }

    // 3. Create entity
    const status = input.submit ? 'PENDING' : 'DRAFT' as const;
    const timeline: TimelineEntry[] = [{
      fromStatus: null,
      toStatus: status,
      changedBy: 'customer',
      changedAt: new Date().toISOString(),
    }];

    const application = new LoanApplication(
      randomUUID(),
      customer.id,
      loanData.amount,
      loanData.termMonths,
      loanData.annualRate,
      loanData.monthlyPayment,
      loanData.totalInterest,
      loanData.totalPayment,
      input.purpose ?? null,
      status,
      null,
      input.simulationId ?? null,
      null,
      null,
      null,
      new Date().toISOString(),
      new Date().toISOString(),
      timeline,
    );

    // 4. Persist
    await this.repo.save(application);
    return this.toResponse(application);
  }

  private toResponse(app: LoanApplication): LoanApplicationResponse {
    return {
      id: app.id,
      amount: app.amount,
      termMonths: app.termMonths,
      annualRate: app.annualRate,
      monthlyPayment: app.monthlyPayment,
      totalInterest: app.totalInterest,
      totalPayment: app.totalPayment,
      purpose: app.purpose,
      status: app.status,
      riskScore: app.riskScore,
      simulationId: app.simulationId,
      reviewerId: app.reviewerId,
      reviewNotes: app.reviewNotes,
      reviewedAt: app.reviewedAt,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
      timeline: app.timeline.map(e => ({
        fromStatus: e.fromStatus,
        toStatus: e.toStatus,
        changedBy: e.changedBy,
        changedAt: e.changedAt,
        notes: e.notes,
      })),
    };
  }
}
