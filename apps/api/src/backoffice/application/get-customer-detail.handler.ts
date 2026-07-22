import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ADMIN_CUSTOMER_QUERY } from './ports/admin-customer-query.port';
import type { AdminCustomerQuery } from './ports/admin-customer-query.port';
import type { AdminCustomerDetailResponse } from '@prestamos/shared';

@Injectable()
export class GetCustomerDetailHandler {
  constructor(
    @Inject(ADMIN_CUSTOMER_QUERY) private readonly query: AdminCustomerQuery,
  ) {}

  async execute(id: string): Promise<AdminCustomerDetailResponse> {
    const result = await this.query.getById(id);
    if (!result) {
      throw new NotFoundException(`Customer with id ${id} not found`);
    }
    return result;
  }
}
