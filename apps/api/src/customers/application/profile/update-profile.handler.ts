import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { CustomerProfile, UpdateCustomerInput } from '@prestamos/shared';
import { CUSTOMER_REPOSITORY } from '../../customers.tokens';
import type { CustomerRepository } from '../../domain/customer.repository';
import { Customer } from '../../domain/customer.entity';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class UpdateProfileHandler {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: CustomerRepository,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async execute(userId: string, body: UpdateCustomerInput): Promise<CustomerProfile> {
    const customer = await this.customerRepository.findByUserId(userId);
    if (!customer) throw new NotFoundException('Customer not found');

    const updated = Customer.reconstitute({
      id: customer.id,
      userId: customer.userId,
      firstName: body.firstName ?? customer.firstName,
      lastName: body.lastName != null ? body.lastName : customer.lastName,
      documentType: body.documentType != null ? body.documentType : customer.documentType,
      documentNumber: body.documentNumber != null ? body.documentNumber : customer.documentNumber,
      birthDate: body.birthDate != null ? new Date(body.birthDate) : null,
      gender: body.gender != null ? body.gender : null,
      maritalStatus: body.maritalStatus != null ? body.maritalStatus : null,
      occupation: body.occupation != null ? body.occupation : null,
      monthlyIncome: body.monthlyIncome != null ? body.monthlyIncome : null,
      status: customer.status,
      kycStatus: customer.kycStatus,
      createdAt: customer.createdAt,
      updatedAt: new Date(),
    });

    await this.customerRepository.update(updated);
    return this.toProfile(updated);
  }

  private toProfile(customer: Customer): CustomerProfile {
    return {
      id: customer.id,
      userId: customer.userId,
      firstName: customer.firstName,
      lastName: customer.lastName,
      documentType: customer.documentType,
      documentNumber: customer.documentNumber,
      birthDate: customer.birthDate?.toISOString() ?? null,
      gender: customer.gender,
      maritalStatus: customer.maritalStatus,
      occupation: customer.occupation,
      monthlyIncome: customer.monthlyIncome,
      status: customer.status,
      kycStatus: customer.kycStatus,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
    };
  }
}
