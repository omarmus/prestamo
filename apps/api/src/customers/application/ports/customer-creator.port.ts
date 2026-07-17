import type { Customer } from '../../domain/customer.entity';

export interface CustomerCreatorPort {
  create(customer: Customer): Promise<void>;
}
