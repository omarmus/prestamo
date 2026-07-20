import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { CreatePortalActionInput } from '@prestamos/shared';
import { CUSTOMER_REPOSITORY } from '../../customers.tokens';
import type { CustomerRepository } from '../../domain/customer.repository';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class TrackActionHandler {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: CustomerRepository,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async execute(userId: string, body: CreatePortalActionInput) {
    const customer = await this.customerRepository.findByUserId(userId);
    if (!customer) throw new NotFoundException('Customer not found');
    // ponytail: Prisma JSON type — cast via serialization
    return this.prisma.portalAction.create({
      data: {
        customerId: customer.id,
        action: body.action,
        metadata: body.metadata !== undefined ? JSON.parse(JSON.stringify(body.metadata)) : undefined,
      },
    });
  }
}
