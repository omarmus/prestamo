import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { UpdateAddressInput } from '@prestamos/shared';
import { CUSTOMER_REPOSITORY } from '../../customers.tokens';
import type { CustomerRepository } from '../../domain/customer.repository';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class UpdateAddressHandler {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: CustomerRepository,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async execute(userId: string, id: string, body: UpdateAddressInput) {
    const customer = await this.customerRepository.findByUserId(userId);
    if (!customer) throw new NotFoundException('Customer not found');
    const existing = await this.prisma.customerAddress.findFirst({
      where: { id, customerId: customer.id },
    });
    if (!existing) throw new NotFoundException('Address not found');
    return this.prisma.customerAddress.update({
      where: { id },
      data: {
        ...(body.type !== undefined && { type: body.type }),
        ...(body.country !== undefined && { country: body.country }),
        ...(body.department !== undefined && { department: body.department }),
        ...(body.city !== undefined && { city: body.city }),
        ...(body.zone !== undefined && { zone: body.zone }),
        ...(body.street !== undefined && { street: body.street }),
        ...(body.number !== undefined && { number: body.number }),
        ...(body.isPrimary !== undefined && { isPrimary: body.isPrimary }),
      },
    });
  }
}
