import { Inject, Injectable } from '@nestjs/common';
import type { LoanApplicationResponse } from '@prestamos/shared';
import type { LoanApplication } from '../../domain/loan-application.entity';
import { LOAN_APPLICATION_REPOSITORY } from '../../loans.tokens';
import type { LoanApplicationRepository } from '../../domain/loan-application.repository';

@Injectable()
export class ListApplicationsHandler {
  constructor(
    @Inject(LOAN_APPLICATION_REPOSITORY)
    private readonly repo: LoanApplicationRepository,
  ) {}

  async execute(customerId: string): Promise<LoanApplicationResponse[]> {
    const applications = await this.repo.findByCustomerId(customerId);
    return applications.map(this.toResponse);
  }

  // ponytail: shared toResponse across handlers. Extract to a mapper when variants emerge.
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
