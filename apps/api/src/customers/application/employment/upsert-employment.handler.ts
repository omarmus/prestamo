import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { UpsertEmploymentInput } from '@prestamos/shared';
import { CUSTOMER_REPOSITORY } from '../../customers.tokens';
import type { CustomerRepository } from '../../domain/customer.repository';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class UpsertEmploymentHandler {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: CustomerRepository,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async execute(userId: string, body: UpsertEmploymentInput) {
    const customer = await this.customerRepository.findByUserId(userId);
    if (!customer) throw new NotFoundException('Customer not found');
    return this.prisma.customerEmployment.upsert({
      where: { customerId: customer.id },
      create: {
        customerId: customer.id,
        employer: body.employer ?? null,
        position: body.position ?? null,
        employmentStatus: body.employmentStatus ?? null,
        monthlySalary: body.monthlySalary ?? null,
        yearsWorking: body.yearsWorking ?? null,
      },
      update: {
        ...(body.employer !== undefined && { employer: body.employer }),
        ...(body.position !== undefined && { position: body.position }),
        ...(body.employmentStatus !== undefined && { employmentStatus: body.employmentStatus }),
        ...(body.monthlySalary !== undefined && { monthlySalary: body.monthlySalary }),
        ...(body.yearsWorking !== undefined && { yearsWorking: body.yearsWorking }),
      },
    });
  }
}
