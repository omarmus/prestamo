import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateAddressInput } from '@prestamos/shared';
import { CUSTOMER_REPOSITORY } from '../../customers.tokens';
import type { CustomerRepository } from '../../domain/customer.repository';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class CreateAddressHandler {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: CustomerRepository,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async execute(userId: string, body: CreateAddressInput) {
    const customer = await this.customerRepository.findByUserId(userId);
    if (!customer) throw new NotFoundException('Customer not found');
    return this.prisma.customerAddress.create({
      data: {
        customerId: customer.id,
        type: body.type ?? null,
        country: body.country ?? null,
        department: body.department ?? null,
        city: body.city ?? null,
        zone: body.zone ?? null,
        street: body.street ?? null,
        number: body.number ?? null,
        isPrimary: body.isPrimary ?? false,
      },
    });
  }
}
