import { Injectable, Inject } from '@nestjs/common';
import type { GeneratedDocumentRepository, GeneratedDocumentRow } from '../../domain/generated-document.repository';
import { PrismaService } from '../../../shared/prisma/prisma.service';

// ponytail: Inline row shape matching Prisma result.
interface PrismaGeneratedDocumentRow {
  id: string;
  loanId: string;
  type: string;
  filePath: string;
  mimeType: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

@Injectable()
export class PrismaGeneratedDocumentRepository implements GeneratedDocumentRepository {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async findByLoanId(loanId: string): Promise<GeneratedDocumentRow | null> {
    const row = await this.prisma.generatedDocument.findUnique({
      where: { loanId },
    });
    return row as unknown as GeneratedDocumentRow | null;
  }

  async save(doc: Omit<GeneratedDocumentRow, 'id' | 'createdAt'>): Promise<GeneratedDocumentRow> {
    // ponytail: Cast to any to bypass Prisma DocumentType enum type constraint.
    // Domain layer uses strings; Prisma enum conflicts with inline row types.
    const row = await (this.prisma.generatedDocument.create as any)({ data: doc });
    return row as unknown as GeneratedDocumentRow;
  }
}
