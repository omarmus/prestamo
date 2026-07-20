import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateBankAccountInput } from '@prestamos/shared';
import { CUSTOMER_REPOSITORY } from '../../customers.tokens';
import type { CustomerRepository } from '../../domain/customer.repository';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class CreateBankAccountHandler {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: CustomerRepository,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async execute(userId: string, body: CreateBankAccountInput) {
    const customer = await this.customerRepository.findByUserId(userId);
    if (!customer) throw new NotFoundException('Customer not found');
    return this.prisma.customerBankAccount.create({
      data: {
        customerId: customer.id,
        bank: body.bank ?? null,
        accountType: body.accountType ?? null,
        accountNumber: body.accountNumber ?? null,
        holderName: body.holderName ?? null,
        isPrimary: body.isPrimary ?? false,
      },
    });
  }
}
