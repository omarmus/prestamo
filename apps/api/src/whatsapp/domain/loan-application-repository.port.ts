import { LoanApplication } from './loan-application.entity';

export interface LoanApplicationRepository {
  save(app: LoanApplication): Promise<void>;
  findByPhone(phone: string): Promise<LoanApplication | null>;
  findById(id: string): Promise<LoanApplication | null>;
}
