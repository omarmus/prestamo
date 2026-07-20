import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { UpdateBankAccountInput } from '@prestamos/shared';
import { CUSTOMER_REPOSITORY } from '../../customers.tokens';
import type { CustomerRepository } from '../../domain/customer.repository';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class UpdateBankAccountHandler {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: CustomerRepository,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async execute(userId: string, id: string, body: UpdateBankAccountInput) {
    const customer = await this.customerRepository.findByUserId(userId);
    if (!customer) throw new NotFoundException('Customer not found');
    const existing = await this.prisma.customerBankAccount.findFirst({
      where: { id, customerId: customer.id },
    });
    if (!existing) throw new NotFoundException('Bank account not found');
    return this.prisma.customerBankAccount.update({
      where: { id },
      data: {
        ...(body.bank !== undefined && { bank: body.bank }),
        ...(body.accountType !== undefined && { accountType: body.accountType }),
        ...(body.accountNumber !== undefined && { accountNumber: body.accountNumber }),
        ...(body.holderName !== undefined && { holderName: body.holderName }),
        ...(body.isPrimary !== undefined && { isPrimary: body.isPrimary }),
      },
    });
  }
}
