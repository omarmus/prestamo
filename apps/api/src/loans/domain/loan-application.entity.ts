import type { LoanStatus } from './value-objects/loan-status';
import { canTransition } from './value-objects/loan-status';
import { LoanStatusTransitionError, LoanNotOwnedByCustomerError } from './loan-application.errors';

export interface TimelineEntry {
  fromStatus: LoanStatus | null;
  toStatus: LoanStatus;
  changedBy: 'customer' | 'admin';
  changedAt: string;
  notes?: string;
}

export class LoanApplication {
  constructor(
    public readonly id: string,
    public readonly customerId: string,
    public amount: number,
    public termMonths: number,
    public annualRate: number,
    public monthlyPayment: number,
    public totalInterest: number,
    public totalPayment: number,
    public purpose: string | null,
    public status: LoanStatus,
    public riskScore: string | null,
    public readonly simulationId: string | null,
    public reviewerId: string | null,
    public reviewNotes: string | null,
    public reviewedAt: string | null,
    public readonly createdAt: string,
    public readonly updatedAt: string,
    public timeline: TimelineEntry[],
  ) {}

  private transition(to: LoanStatus, changedBy: TimelineEntry['changedBy'], notes?: string): void {
    if (!canTransition(this.status, to)) {
      throw new LoanStatusTransitionError(this.status, to);
    }
    const entry: TimelineEntry = {
      fromStatus: this.status,
      toStatus: to,
      changedBy,
      changedAt: new Date().toISOString(),
      notes,
    };
    this.status = to;
    this.timeline.push(entry);
  }

  submit(): void {
    this.transition('PENDING', 'customer');
  }

  cancel(): void {
    this.transition('CANCELLED', 'customer', 'Cancelado por el cliente');
  }

  assignReviewer(reviewerId: string): void {
    this.transition('IN_REVIEW', 'admin');
    this.reviewerId = reviewerId;
  }

  approve(actorId: string, riskScore: string): void {
    if (this.reviewerId !== actorId) {
      throw new LoanNotOwnedByCustomerError('Solo el asesor asignado puede aprobar esta solicitud');
    }
    this.transition('APPROVED', 'admin');
    this.riskScore = riskScore;
    this.reviewedAt = new Date().toISOString();
  }

  reject(actorId: string, reason: string): void {
    if (this.reviewerId !== actorId) {
      throw new LoanNotOwnedByCustomerError('Solo el asesor asignado puede rechazar esta solicitud');
    }
    this.transition('REJECTED', 'admin');
    this.reviewNotes = reason;
    this.reviewedAt = new Date().toISOString();
  }

  requestInfo(actorId: string, message: string): void {
    if (this.reviewerId !== actorId) {
      throw new LoanNotOwnedByCustomerError('Solo el asesor asignado puede solicitar información');
    }
    this.transition('INFO_REQUESTED', 'admin');
    this.reviewNotes = message;
  }

  respondToInfo(): void {
    this.transition('PENDING', 'customer', 'Cliente respondió a solicitud de información');
  }
}
