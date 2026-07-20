import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { UpdateIncomeInput } from '@prestamos/shared';
import { CUSTOMER_REPOSITORY } from '../../customers.tokens';
import type { CustomerRepository } from '../../domain/customer.repository';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class UpdateIncomeHandler {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: CustomerRepository,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async execute(userId: string, id: string, body: UpdateIncomeInput) {
    const customer = await this.customerRepository.findByUserId(userId);
    if (!customer) throw new NotFoundException('Customer not found');
    const existing = await this.prisma.customerIncome.findFirst({
      where: { id, customerId: customer.id },
    });
    if (!existing) throw new NotFoundException('Income not found');
    return this.prisma.customerIncome.update({
      where: { id },
      data: {
        ...(body.source !== undefined && { source: body.source }),
        ...(body.amount !== undefined && { amount: body.amount }),
        ...(body.frequency !== undefined && { frequency: body.frequency }),
      },
    });
  }
}
