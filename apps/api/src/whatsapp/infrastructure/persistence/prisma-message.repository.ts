import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { WhatsAppMessage } from '../../domain/whatsapp-message.entity';
import type { MessageRepository } from '../../domain/message-repository.port';

@Injectable()
export class PrismaMessageRepository implements MessageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(message: WhatsAppMessage): Promise<WhatsAppMessage> {
    const record = await this.prisma.whatsAppMessage.create({
      data: {
        id: message.id,
        conversationId: message.conversationId,
        direction: message.direction,
        messageType: message.messageType,
        content: message.content,
        metaId: message.metaId,
        status: message.status,
      },
    });

    return this.toDomain(record);
  }

  private toDomain(record: {
    id: string;
    conversationId: string;
    direction: string;
    messageType: string;
    content: string | null;
    metaId: string | null;
    status: string;
    createdAt: Date;
  }): WhatsAppMessage {
    return WhatsAppMessage.reconstitute({
      id: record.id,
      conversationId: record.conversationId,
      direction: record.direction as 'incoming' | 'outgoing',
      messageType: record.messageType,
      content: record.content,
      metaId: record.metaId,
      status: record.status,
      createdAt: record.createdAt,
    });
  }
}
