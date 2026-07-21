import { Inject, Injectable } from '@nestjs/common';
import { ADMIN_ACTIVE_LOAN_QUERY } from '../../application/ports/active-loan-query.port';
import type { AdminActiveLoanQuery } from '../../application/ports/active-loan-query.port';

export interface AdminActiveLoanListParams {
  page: number;
  limit: number;
  status?: string;
  search?: string;
}

@Injectable()
export class ListActiveLoansHandler {
  constructor(
    @Inject(ADMIN_ACTIVE_LOAN_QUERY)
    private readonly query: AdminActiveLoanQuery,
  ) {}

  async execute(
    params: AdminActiveLoanListParams,
  ): Promise<{ data: import('../../application/ports/active-loan-query.port').ActiveLoanSummary[]; total: number }> {
    return this.query.list(params);
  }
}
