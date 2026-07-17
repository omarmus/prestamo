import { Test, type TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuditService', () => {
  let service: AuditService;
  let prisma: {
    auditLog: { create: jest.Mock; findMany: jest.Mock; count: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: BigInt(1) }),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  describe('record', () => {
    it('should insert an audit log entry', async () => {
      await service.record({
        entityType: 'User',
        entityId: 'user-1',
        action: 'UPDATE',
        actorId: 'actor-1',
        changes: { name: { from: 'Old', to: 'New' } },
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          entityType: 'User',
          entityId: 'user-1',
          action: 'UPDATE',
          actorId: 'actor-1',
          changes: { name: { from: 'Old', to: 'New' } },
          sourceIp: null,
        },
      });
    });

    it('should throw for invalid action', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const invalidAction: any = 'INVALID';

      await expect(
        service.record({
          entityType: 'User',
          entityId: 'user-1',
          action: invalidAction,
          actorId: 'actor-1',
          changes: {},
        }),
      ).rejects.toThrow('Invalid audit action: INVALID');

      expect(prisma.auditLog.create).not.toHaveBeenCalled();
    });

    it('should include sourceIp when provided', async () => {
      await service.record({
        entityType: 'Loan',
        entityId: 'loan-1',
        action: 'CREATE',
        actorId: 'actor-1',
        changes: {},
        sourceIp: '192.168.1.1',
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ sourceIp: '192.168.1.1' }),
        }),
      );
    });
  });

  describe('find', () => {
    it('should return paginated results', async () => {
      const mockRows = [
        { id: BigInt(1), entityType: 'User', entityId: '1', action: 'UPDATE', actorId: 'a1', changes: null, sourceIp: null, createdAt: new Date() },
      ];
      prisma.auditLog.findMany.mockResolvedValue(mockRows);
      prisma.auditLog.count.mockResolvedValue(1);

      const result = await service.find({ entityType: 'User', page: 1, limit: 10 });

      expect(result.rows).toEqual(mockRows);
      expect(result.total).toBe(1);
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 10 }),
      );
    });

    it('should apply date filter when from/to provided', async () => {
      const from = new Date('2026-01-01');
      const to = new Date('2026-12-31');

      await service.find({ from, to });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: { gte: from, lte: to },
          }),
        }),
      );
    });
  });
});
