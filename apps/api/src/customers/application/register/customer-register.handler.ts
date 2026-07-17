import { Inject, Injectable } from '@nestjs/common';
import { CUSTOMER_CREATOR } from '../../customers.tokens';
import type { CustomerCreatorPort } from '../ports/customer-creator.port';
import type { Customer } from '../../domain/customer.entity';

@Injectable()
export class CustomerRegisterHandler {
  constructor(
    @Inject(CUSTOMER_CREATOR)
    private readonly customerCreator: CustomerCreatorPort,
  ) {}

  async execute(customer: Customer): Promise<void> {
    await this.customerCreator.create(customer);
  }
}
