import type { InstallmentStatus } from './value-objects/installment-status';

export class Installment {
  constructor(
    public readonly id: string,
    public readonly loanId: string,
    public readonly installmentNumber: number,
    public readonly dueDate: string,
    public readonly principalAmount: number,
    public readonly interestAmount: number,
    public readonly totalAmount: number,
    public paidPrincipal: number,
    public paidInterest: number,
    public paidTotal: number,
    public status: InstallmentStatus,
    public paidAt: string | null,
    public readonly createdAt: string,
    public readonly updatedAt: string,
  ) {}

  markAsPaid(): void {
    this.status = 'PAID';
    this.paidAt = new Date().toISOString();
  }
}
