import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateIncomeInput } from '@prestamos/shared';
import { CUSTOMER_REPOSITORY } from '../../customers.tokens';
import type { CustomerRepository } from '../../domain/customer.repository';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class CreateIncomeHandler {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: CustomerRepository,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async execute(userId: string, body: CreateIncomeInput) {
    const customer = await this.customerRepository.findByUserId(userId);
    if (!customer) throw new NotFoundException('Customer not found');
    return this.prisma.customerIncome.create({
      data: {
        customerId: customer.id,
        source: body.source ?? null,
        amount: body.amount,
        frequency: body.frequency ?? null,
      },
    });
  }
}
