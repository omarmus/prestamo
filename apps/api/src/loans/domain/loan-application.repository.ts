import type { LoanApplication } from './loan-application.entity';
import type { LoanStatus } from './value-objects/loan-status';

export interface LoanApplicationRepository {
  findById(id: string): Promise<LoanApplication | null>;
  findByCustomerId(customerId: string): Promise<LoanApplication[]>;
  findByCustomerIdAndId(customerId: string, id: string): Promise<LoanApplication | null>;
  findPending(page: number, limit: number, status?: string[]): Promise<{ data: LoanApplication[]; total: number }>;
  save(application: LoanApplication): Promise<void>;
  /** Atomic status transition — returns true if row was updated, false if race condition. */
  updateStatus(id: string, fromStatus: LoanStatus, toStatus: string, data: Record<string, unknown>): Promise<boolean>;
}
