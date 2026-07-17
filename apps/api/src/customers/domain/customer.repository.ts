import type { Customer } from './customer.entity';

export interface CustomerRepository {
  save(customer: Customer): Promise<void>;
  findByUserId(userId: string): Promise<Customer | null>;
  findById(id: string): Promise<Customer | null>;
  update(customer: Customer): Promise<void>;
}
