import { Injectable } from '@nestjs/common';
import type { CustomerCreatorPort } from '../../application/ports/customer-creator.port';
import type { Customer } from '../../domain/customer.entity';
import type { CustomerRepository } from '../../domain/customer.repository';
import { CustomerAlreadyExistsError } from '../../domain/errors/customer-already-exists.error';

@Injectable()
export class PrismaCustomerCreator implements CustomerCreatorPort {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async create(customer: Customer): Promise<void> {
    const existing = await this.customerRepository.findByUserId(customer.userId);
    if (existing) {
      // ponytail: conflict guard — duplicate registration returns error instead of silently no-opping
      throw new CustomerAlreadyExistsError(customer.userId);
    }
    await this.customerRepository.save(customer);
  }
}
