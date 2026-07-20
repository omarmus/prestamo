import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateDocumentInput } from '@prestamos/shared';
import { CUSTOMER_REPOSITORY } from '../../customers.tokens';
import type { CustomerRepository } from '../../domain/customer.repository';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class UploadDocumentHandler {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: CustomerRepository,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async execute(userId: string, body: CreateDocumentInput) {
    const customer = await this.customerRepository.findByUserId(userId);
    if (!customer) throw new NotFoundException('Customer not found');
    return this.prisma.customerDocument.create({
      data: {
        customerId: customer.id,
        type: body.type,
        fileName: body.fileName ?? null,
        mimeType: body.mimeType ?? null,
        data: body.data,
        notes: body.notes ?? null,
      },
      select: {
        id: true,
        type: true,
        fileName: true,
        mimeType: true,
        notes: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
