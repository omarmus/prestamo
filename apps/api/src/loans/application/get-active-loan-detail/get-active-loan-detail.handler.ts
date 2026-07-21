import { Inject, Injectable } from '@nestjs/common';
import { ACTIVE_LOAN_QUERY } from '../../application/ports/active-loan-query.port';
import type { ActiveLoanQuery } from '../../application/ports/active-loan-query.port';
import type { ActiveLoanDetail } from '../../application/ports/active-loan-query.port';
import { LoanNotFoundError } from '../../domain/loan.errors';

@Injectable()
export class GetActiveLoanDetailHandler {
  constructor(
    @Inject(ACTIVE_LOAN_QUERY)
    private readonly query: ActiveLoanQuery,
  ) {}

  async execute(customerId: string, id: string): Promise<ActiveLoanDetail> {
    const detail = await this.query.findByIdAndCustomer(customerId, id);
    if (!detail) {
      throw new LoanNotFoundError(id);
    }
    return detail;
  }
}
