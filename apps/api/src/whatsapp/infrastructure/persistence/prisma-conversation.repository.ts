import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { WhatsAppConversation } from '../../domain/whatsapp-conversation.entity';
import type { ConversationRepository } from '../../domain/conversation-repository.port';

@Injectable()
export class PrismaConversationRepository implements ConversationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(conversation: WhatsAppConversation): Promise<WhatsAppConversation> {
    const record = await this.prisma.whatsAppConversation.upsert({
      where: { id: conversation.id },
      create: {
        id: conversation.id,
        contactId: conversation.contactId,
      },
      update: {
        contactId: conversation.contactId,
      },
    });

    return this.toDomain(record);
  }

  async findActiveByContact(
    contactId: string,
  ): Promise<WhatsAppConversation | null> {
    // ponytail: last 24h conversation, enough for single-session UX
    const record = await this.prisma.whatsAppConversation.findFirst({
      where: {
        contactId,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: 'desc' },
    });

    return record ? this.toDomain(record) : null;
  }

  async findById(id: string): Promise<WhatsAppConversation | null> {
    const record = await this.prisma.whatsAppConversation.findUnique({
      where: { id },
    });

    return record ? this.toDomain(record) : null;
  }

  private toDomain(record: {
    id: string;
    contactId: string;
    createdAt: Date;
    updatedAt: Date;
  }): WhatsAppConversation {
    return WhatsAppConversation.reconstitute({
      id: record.id,
      contactId: record.contactId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
