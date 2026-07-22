import { Injectable, Inject } from '@nestjs/common';
import { ADMIN_CUSTOMER_QUERY } from './ports/admin-customer-query.port';
import type {
  AdminCustomerQuery,
  AdminCustomerListFilters,
} from './ports/admin-customer-query.port';
import type { AdminCustomerListResponse } from '@prestamos/shared';

@Injectable()
export class GetCustomersHandler {
  constructor(
    @Inject(ADMIN_CUSTOMER_QUERY) private readonly query: AdminCustomerQuery,
  ) {}

  async execute(filters: AdminCustomerListFilters): Promise<AdminCustomerListResponse> {
    const { data, total } = await this.query.list(filters);

    return {
      data,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  }
}
