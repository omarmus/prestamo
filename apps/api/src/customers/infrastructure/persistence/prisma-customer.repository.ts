import { Injectable, Inject } from '@nestjs/common';
import type { CustomerRepository } from '../../domain/customer.repository';
import { Customer } from '../../domain/customer.entity';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class PrismaCustomerRepository implements CustomerRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async save(customer: Customer): Promise<void> {
    await this.prisma.customer.create({
      data: {
        id: customer.id,
        userId: customer.userId,
        firstName: customer.firstName,
        lastName: customer.lastName,
        documentType: customer.documentType,
        documentNumber: customer.documentNumber,
        status: customer.status,
        kycStatus: customer.kycStatus,
      },
    });
  }

  async findByUserId(userId: string): Promise<Customer | null> {
    const record = await this.prisma.customer.findFirst({
      where: { userId, deletedAt: null },
    });
    return record ? this.toDomain(record) : null;
  }

  async findById(id: string): Promise<Customer | null> {
    const record = await this.prisma.customer.findFirst({
      where: { id, deletedAt: null },
    });
    return record ? this.toDomain(record) : null;
  }

  async update(customer: Customer): Promise<void> {
    await this.prisma.customer.update({
      where: { id: customer.id },
      data: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        documentType: customer.documentType,
        documentNumber: customer.documentNumber,
        status: customer.status,
        kycStatus: customer.kycStatus,
      },
    });
  }

  private toDomain(record: {
    id: string;
    userId: string;
    firstName: string;
    lastName: string | null;
    documentType: string | null;
    documentNumber: string | null;
    birthDate: Date | null;
    gender: string | null;
    maritalStatus: string | null;
    occupation: string | null;
    monthlyIncome: unknown;
    status: string;
    kycStatus: string;
    createdAt: Date;
    updatedAt: Date;
  }): Customer {
    return Customer.reconstitute({
      id: record.id,
      userId: record.userId,
      firstName: record.firstName,
      lastName: record.lastName,
      // ponytail: existing records may have null document fields; default to CI and empty string
      documentType: record.documentType ?? 'CI',
      documentNumber: record.documentNumber ?? '',
      birthDate: record.birthDate,
      gender: record.gender,
      maritalStatus: record.maritalStatus,
      occupation: record.occupation,
      monthlyIncome: record.monthlyIncome != null ? Number(record.monthlyIncome) : null,
      status: record.status,
      kycStatus: record.kycStatus,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
