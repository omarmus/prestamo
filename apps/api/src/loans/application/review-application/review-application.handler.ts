import { Inject, Injectable } from '@nestjs/common';
import type { LoanApplicationResponse } from '@prestamos/shared';
import { LOAN_APPLICATION_REPOSITORY } from '../../loans.tokens';
import { CUSTOMER_REPOSITORY } from '../../../customers/customers.tokens';
import type { LoanApplicationRepository } from '../../domain/loan-application.repository';
import type { CustomerRepository } from '../../../customers/domain/customer.repository';
import type { LoanApplication } from '../../domain/loan-application.entity';
import {
  LoanNotFoundError,
  LoanAlreadyReviewedError,
  HighRiskLoanError,
  MissingDocumentsError,
  InsufficientIncomeError,
  LoanNotOwnedByCustomerError,
} from '../../domain/loan-application.errors';
import { PrismaService } from '../../../shared/prisma/prisma.service';

export interface ReviewPayload {
  notes?: string;
  reason?: string;
  message?: string;
}

@Injectable()
export class ReviewApplicationHandler {
  constructor(
    @Inject(LOAN_APPLICATION_REPOSITORY)
    private readonly repo: LoanApplicationRepository,
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepo: CustomerRepository,
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    adminId: string,
    applicationId: string,
    action: 'review' | 'approve' | 'reject' | 'request-info',
    payload: ReviewPayload,
  ): Promise<LoanApplicationResponse> {
    const app = await this.repo.findById(applicationId);
    if (!app) throw new LoanNotFoundError(applicationId);

    switch (action) {
      case 'review':
        return this.assignReview(adminId, app);
      case 'approve':
        return this.approve(adminId, app, payload);
      case 'reject':
        return this.reject(adminId, app, payload.reason!);
      case 'request-info':
        return this.requestInfo(adminId, app, payload.message!);
    }
  }

  private async assignReview(adminId: string, app: LoanApplication): Promise<LoanApplicationResponse> {
    app.assignReviewer(adminId);
    const updated = await this.repo.updateStatus(app.id, 'PENDING', 'IN_REVIEW', {
      reviewerId: adminId,
      timeline: app.timeline,
    });
    if (!updated) throw new LoanAlreadyReviewedError();
    return this.toResponse(app);
  }

  private async approve(
    adminId: string,
    app: LoanApplication,
    payload: ReviewPayload,
  ): Promise<LoanApplicationResponse> {
    // ponytail: fail-fast — check reviewer before DTI/docs to avoid wasted queries
    if (app.reviewerId !== adminId) {
      throw new LoanNotOwnedByCustomerError('Solo el asesor asignado puede aprobar esta solicitud');
    }

    // 1. DTI calculation
    const dtiResult = await this.calculateDTI(app.customerId, app.monthlyPayment);
    if (dtiResult.dti > 0.50) {
      throw new HighRiskLoanError(dtiResult.dti);
    }

    // 2. Document verification — CI_FRONT + CI_BACK must be VERIFIED
    const docs = await this.prisma.customerDocument.findMany({
      where: { customerId: app.customerId, type: { in: ['CI_FRONT', 'CI_BACK'] } },
    });
    const ciFrontVerified = docs.some(d => d.type === 'CI_FRONT' && d.status === 'VERIFIED');
    const ciBackVerified = docs.some(d => d.type === 'CI_BACK' && d.status === 'VERIFIED');
    if (!ciFrontVerified || !ciBackVerified) {
      throw new MissingDocumentsError();
    }

    // 3. Entity transition
    app.approve(adminId, dtiResult.riskScore);
    app.reviewNotes = payload.notes ?? null;

    const updated = await this.repo.updateStatus(app.id, 'IN_REVIEW', 'APPROVED', {
      riskScore: dtiResult.riskScore,
      reviewNotes: payload.notes ?? null,
      reviewedAt: app.reviewedAt,
      timeline: app.timeline,
    });
    if (!updated) throw new LoanAlreadyReviewedError('El estado de la solicitud cambió desde que fue cargada');

    return this.toResponse(app);
  }

  private async reject(
    adminId: string,
    app: LoanApplication,
    reason: string,
  ): Promise<LoanApplicationResponse> {
    app.reject(adminId, reason);
    const updated = await this.repo.updateStatus(app.id, 'IN_REVIEW', 'REJECTED', {
      reviewNotes: reason,
      reviewedAt: app.reviewedAt,
      timeline: app.timeline,
    });
    if (!updated) throw new LoanAlreadyReviewedError('El estado de la solicitud cambió desde que fue cargada');

    return this.toResponse(app);
  }

  private async requestInfo(
    adminId: string,
    app: LoanApplication,
    message: string,
  ): Promise<LoanApplicationResponse> {
    app.requestInfo(adminId, message);
    const updated = await this.repo.updateStatus(app.id, 'IN_REVIEW', 'INFO_REQUESTED', {
      reviewNotes: message,
      timeline: app.timeline,
    });
    if (!updated) throw new LoanAlreadyReviewedError('El estado de la solicitud cambió desde que fue cargada');

    return this.toResponse(app);
  }

  // ponytail: DTI calculation is inline in the handler, not a separate domain service.
  // Extract when there are multiple scoring models or a credit-bureau integration.
  async calculateDTI(
    customerId: string,
    monthlyPayment: number,
  ): Promise<{ dti: number; riskScore: string }> {
    const incomes = await this.prisma.customerIncome.findMany({
      where: { customerId },
    });

    let totalMonthlyIncome: number;

    if (incomes.length > 0) {
      totalMonthlyIncome = incomes.reduce((sum, inc) => {
        const amount = Number(inc.amount);
        switch (inc.frequency) {
          case 'BIWEEKLY': return sum + amount * 2.17; // ponytail: 52 weeks / 12 months / 2 = 2.1666
          case 'WEEKLY':   return sum + amount * 4.33;
          case 'YEARLY':   return sum + amount / 12;
          default:         return sum + amount; // MONTHLY and null
        }
      }, 0);
    } else {
      // Fallback: Customer.monthlyIncome
      const customer = await this.customerRepo.findById(customerId);
      if (!customer?.monthlyIncome) {
        throw new InsufficientIncomeError('El cliente no tiene ingresos registrados');
      }
      totalMonthlyIncome = Number(customer.monthlyIncome);
    }

    // ponytail: 2 decimal precision
    const dti = Math.round((monthlyPayment / totalMonthlyIncome) * 100) / 100;
    const riskScore = dti <= 0.30 ? 'LOW' : dti <= 0.50 ? 'MEDIUM' : 'HIGH';

    return { dti, riskScore };
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
