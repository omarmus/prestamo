import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const VALID_ACTIONS = ['CREATE', 'UPDATE', 'DELETE'] as const;
export type AuditAction = (typeof VALID_ACTIONS)[number];

export interface AuditRecordParams {
  entityType: string;
  entityId: string;
  action: AuditAction;
  actorId: string;
  changes: Record<string, { from: unknown; to: unknown }>;
  sourceIp?: string;
}

export interface AuditFindFilters {
  entityType?: string;
  entityId?: string;
  actorId?: string;
  action?: string;
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AuditLogEntry = any;

export interface PaginatedAuditLogs {
  rows: AuditLogEntry[];
  total: number;
}

@Injectable()
export class AuditService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async record(params: AuditRecordParams): Promise<void> {
    if (!VALID_ACTIONS.includes(params.action as AuditAction)) {
      throw new Error(`Invalid audit action: ${params.action}. Must be one of: ${VALID_ACTIONS.join(', ')}`);
    }

    await this.prisma.auditLog.create({
      data: {
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        actorId: params.actorId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        changes: params.changes as any,
        sourceIp: params.sourceIp ?? null,
      },
    });
  }

  async find(filters: AuditFindFilters): Promise<PaginatedAuditLogs> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 50;
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.entityId) where.entityId = filters.entityId;
    if (filters.actorId) where.actorId = filters.actorId;
    if (filters.action) where.action = filters.action;
    if (filters.from || filters.to) {
      const createdAt: Record<string, Date> = {};
      if (filters.from) createdAt.gte = filters.from;
      if (filters.to) createdAt.lte = filters.to;
      where.createdAt = createdAt;
    }

    const [rows, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { rows, total };
  }
}
