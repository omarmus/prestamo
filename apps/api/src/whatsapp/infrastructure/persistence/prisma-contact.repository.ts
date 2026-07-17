import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { WhatsAppContact } from '../../domain/whatsapp-contact.entity';
import type { ContactRepository } from '../../domain/contact-repository.port';

@Injectable()
export class PrismaContactRepository implements ContactRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(contact: WhatsAppContact): Promise<WhatsAppContact> {
    const record = await this.prisma.whatsAppContact.upsert({
      where: { id: contact.id },
      create: {
        id: contact.id,
        phone: contact.phone,
        name: contact.name,
        userId: contact.userId,
      },
      update: {
        name: contact.name,
        userId: contact.userId,
      },
    });

    return this.toDomain(record);
  }

  async findByPhone(phone: string): Promise<WhatsAppContact | null> {
    const record = await this.prisma.whatsAppContact.findUnique({
      where: { phone },
    });

    return record ? this.toDomain(record) : null;
  }

  async findById(id: string): Promise<WhatsAppContact | null> {
    const record = await this.prisma.whatsAppContact.findUnique({
      where: { id },
    });

    return record ? this.toDomain(record) : null;
  }

  private toDomain(record: {
    id: string;
    phone: string;
    name: string | null;
    userId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): WhatsAppContact {
    return WhatsAppContact.reconstitute({
      id: record.id,
      phone: record.phone,
      name: record.name,
      userId: record.userId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
