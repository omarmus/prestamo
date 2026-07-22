import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import type {
  AdminNotesRepository,
  AdminNoteRecord,
} from '../application/ports/admin-notes-repository.port';

@Injectable()
export class PrismaAdminNotesRepositoryImpl implements AdminNotesRepository {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async create(data: {
    authorId: string;
    entityType: string;
    entityId: string;
    content: string;
  }): Promise<AdminNoteRecord> {
    const record = await this.prisma.adminNote.create({
      data: {
        authorId: data.authorId,
        entityType: data.entityType,
        entityId: data.entityId,
        content: data.content,
      },
      include: { author: { select: { name: true } } },
    });

    return this.toRecord(record);
  }

  async findByEntity(entityType: string, entityId: string): Promise<AdminNoteRecord[]> {
    const records = await this.prisma.adminNote.findMany({
      where: { entityType, entityId },
      include: { author: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((r) => this.toRecord(r));
  }

  private toRecord(record: {
    id: string;
    authorId: string;
    entityType: string;
    entityId: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    author: { name: string };
  }): AdminNoteRecord {
    return {
      id: record.id,
      authorId: record.authorId,
      authorName: record.author.name,
      entityType: record.entityType,
      entityId: record.entityId,
      content: record.content,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }
}
