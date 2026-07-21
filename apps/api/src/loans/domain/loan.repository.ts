import type { Loan } from './loan.entity';
import type { Installment } from './installment.entity';
import type { ActiveLoanStatus } from './value-objects/active-loan-status';

export interface LoanRepository {
  findById(id: string): Promise<Loan | null>;
  findByCustomerId(customerId: string): Promise<Loan[]>;
  findByApplicationId(applicationId: string): Promise<Loan | null>;
  save(loan: Loan, installments: Installment[]): Promise<void>;
  /** Atomic status transition — returns true if row was updated, false if race condition. */
  updateStatus(id: string, fromStatus: ActiveLoanStatus, toStatus: string): Promise<boolean>;
  updateOutstandingBalance(id: string, newBalance: number): Promise<void>;
}

export interface InstallmentRepository {
  findByLoanId(loanId: string): Promise<Installment[]>;
  findNextPending(loanId: string): Promise<Installment | null>;
  markAsPaid(id: string): Promise<void>;
  countByStatus(loanId: string, status: string): Promise<number>;
}
