import type { Customer } from '../../domain/customer.entity';

export interface CustomerQueryPort {
  findFullProfile(userId: string): Promise<Customer | null>;
  findWithRelations(userId: string, relations: string[]): Promise<Customer | null>;
}
