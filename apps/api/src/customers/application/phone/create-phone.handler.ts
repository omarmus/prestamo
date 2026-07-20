import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { CreatePhoneInput } from '@prestamos/shared';
import { CUSTOMER_REPOSITORY } from '../../customers.tokens';
import type { CustomerRepository } from '../../domain/customer.repository';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class CreatePhoneHandler {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: CustomerRepository,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async execute(userId: string, body: CreatePhoneInput) {
    const customer = await this.customerRepository.findByUserId(userId);
    if (!customer) throw new NotFoundException('Customer not found');
    return this.prisma.customerPhone.create({
      data: {
        customerId: customer.id,
        phone: body.phone,
        isWhatsApp: body.isWhatsApp ?? false,
        isPrimary: body.isPrimary ?? false,
      },
    });
  }
}
