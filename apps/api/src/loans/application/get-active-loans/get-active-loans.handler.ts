import { Inject, Injectable } from '@nestjs/common';
import { ACTIVE_LOAN_QUERY } from '../../application/ports/active-loan-query.port';
import type { ActiveLoanQuery, ActiveLoanSummary } from '../../application/ports/active-loan-query.port';

@Injectable()
export class GetActiveLoansHandler {
  constructor(
    @Inject(ACTIVE_LOAN_QUERY)
    private readonly query: ActiveLoanQuery,
  ) {}

  async execute(customerId: string): Promise<ActiveLoanSummary[]> {
    return this.query.findByCustomerId(customerId);
  }
}
