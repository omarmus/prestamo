import type { ActiveLoanStatus } from './value-objects/active-loan-status';

export class Loan {
  constructor(
    public readonly id: string,
    public readonly applicationId: string,
    public readonly customerId: string,
    public amount: number,
    public termMonths: number,
    public annualRate: number,
    public monthlyPayment: number,
    public totalInterest: number,
    public totalPayment: number,
    public outstandingBalance: number,
    public status: ActiveLoanStatus,
    public readonly disbursedAt: string,
    public firstPaymentDate: string | null,
    public nextPaymentDate: string | null,
    public closedAt: string | null,
    public readonly createdAt: string,
    public readonly updatedAt: string,
  ) {}

  close(): void {
    this.status = 'CLOSED';
    this.closedAt = new Date().toISOString();
  }

  markDefaulted(): void {
    this.status = 'DEFAULTED';
  }
}
