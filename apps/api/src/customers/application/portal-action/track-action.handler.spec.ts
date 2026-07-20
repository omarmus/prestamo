import { NotFoundException } from '@nestjs/common';
import { TrackActionHandler } from './track-action.handler';
import type { CustomerRepository } from '../../domain/customer.repository';
import { Customer } from '../../domain/customer.entity';
import type { PrismaService } from '../../../shared/prisma/prisma.service';

describe('TrackActionHandler', () => {
  let handler: TrackActionHandler;
  let mockRepo: jest.Mocked<CustomerRepository>;
  let mockPrisma: { portalAction: { create: jest.Mock } };

  beforeEach(() => {
    mockRepo = {
      save: jest.fn(),
      findByUserId: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
    };

    mockPrisma = {
      portalAction: { create: jest.fn() },
    };

    handler = new TrackActionHandler(mockRepo, mockPrisma as unknown as jest.Mocked<PrismaService>);
  });

  describe('scenario 1: success', () => {
    it('creates portal action', async () => {
      const customer = Customer.create({ userId: 'user-id', firstName: 'Juan' });
      mockRepo.findByUserId.mockResolvedValue(customer);
      const createdAction = {
        id: 'action-1',
        action: 'VIEW_SIMULATION',
        metadata: { simulationId: 'sim-1' },
        createdAt: new Date('2024-01-15'),
      };
      mockPrisma.portalAction.create.mockResolvedValue(createdAction);

      const result = await handler.execute('user-id', {
        action: 'VIEW_SIMULATION',
        metadata: { simulationId: 'sim-1' },
      });

      expect(result).toEqual(createdAction);
      expect(mockPrisma.portalAction.create).toHaveBeenCalledWith({
        data: {
          customerId: customer.id,
          action: 'VIEW_SIMULATION',
          metadata: { simulationId: 'sim-1' },
        },
      });
    });
  });

  describe('scenario 2: customer not found', () => {
    it('throws NotFoundException', async () => {
      mockRepo.findByUserId.mockResolvedValue(null);

      await expect(
        handler.execute('user-id', { action: 'VIEW_SIMULATION' }),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.portalAction.create).not.toHaveBeenCalled();
    });
  });
});
