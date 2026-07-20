import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CUSTOMER_REPOSITORY } from '../../customers.tokens';
import type { CustomerRepository } from '../../domain/customer.repository';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class DeleteBankAccountHandler {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: CustomerRepository,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async execute(userId: string, id: string): Promise<void> {
    const customer = await this.customerRepository.findByUserId(userId);
    if (!customer) throw new NotFoundException('Customer not found');
    const existing = await this.prisma.customerBankAccount.findFirst({
      where: { id, customerId: customer.id },
    });
    if (!existing) throw new NotFoundException('Bank account not found');
    await this.prisma.customerBankAccount.delete({ where: { id } });
  }
}
