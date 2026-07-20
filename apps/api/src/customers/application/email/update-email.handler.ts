import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { UpdateEmailInput } from '@prestamos/shared';
import { CUSTOMER_REPOSITORY } from '../../customers.tokens';
import type { CustomerRepository } from '../../domain/customer.repository';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class UpdateEmailHandler {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: CustomerRepository,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async execute(userId: string, id: string, body: UpdateEmailInput) {
    const customer = await this.customerRepository.findByUserId(userId);
    if (!customer) throw new NotFoundException('Customer not found');
    const existing = await this.prisma.customerEmail.findFirst({
      where: { id, customerId: customer.id },
    });
    if (!existing) throw new NotFoundException('Email not found');
    return this.prisma.customerEmail.update({
      where: { id },
      data: {
        ...(body.email !== undefined && { email: body.email }),
        ...(body.isPrimary !== undefined && { isPrimary: body.isPrimary }),
      },
    });
  }
}
