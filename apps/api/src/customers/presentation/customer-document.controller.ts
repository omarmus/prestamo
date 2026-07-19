import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Inject,
  NotFoundException,
  HttpCode,
} from '@nestjs/common';
import { CreateDocumentSchema } from '@prestamos/shared';

import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe';
import { CUSTOMER_REPOSITORY } from '../customers.tokens';
import type { CustomerRepository } from '../domain/customer.repository';
import { PrismaService } from '../../shared/prisma/prisma.service';
import type { JwtPayload } from '@prestamos/shared';

// ponytail: document upload as base64 in DB — S3 post-MVP

@Controller('api/customers/me/documents')
@UseGuards(JwtAuthGuard)
export class CustomerDocumentController {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: CustomerRepository,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async listDocuments(@CurrentUser() user: JwtPayload) {
    const customer = await this.customerRepository.findByUserId(user.sub);
    if (!customer) throw new NotFoundException('Customer not found');

    const documents = await this.prisma.customerDocument.findMany({
      where: { customerId: customer.id },
      select: {
        id: true,
        type: true,
        fileName: true,
        mimeType: true,
        notes: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        // ponytail: data (base64) excluded from list — fetch single doc for content
      },
    });
    return documents;
  }

  @Post()
  @HttpCode(201)
  async uploadDocument(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(CreateDocumentSchema)) body: Record<string, unknown>,
  ) {
    const customer = await this.customerRepository.findByUserId(user.sub);
    if (!customer) throw new NotFoundException('Customer not found');

    return this.prisma.customerDocument.create({
      data: {
        customerId: customer.id,
        type: body.type as string,
        fileName: (body.fileName as string) ?? null,
        mimeType: (body.mimeType as string) ?? null,
        data: body.data as string,
        notes: (body.notes as string) ?? null,
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
