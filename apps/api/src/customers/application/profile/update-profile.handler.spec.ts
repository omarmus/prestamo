import { NotFoundException } from '@nestjs/common';
import { UpdateProfileHandler } from './update-profile.handler';
import type { CustomerRepository } from '../../domain/customer.repository';
import { Customer } from '../../domain/customer.entity';
import type { PrismaService } from '../../../shared/prisma/prisma.service';
import type { UpdateCustomerInput } from '@prestamos/shared';

describe('UpdateProfileHandler', () => {
  let handler: UpdateProfileHandler;
  let mockRepo: jest.Mocked<CustomerRepository>;
  let mockPrisma: jest.Mocked<PrismaService>;

  beforeEach(() => {
    mockRepo = {
      save: jest.fn(),
      findByUserId: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
    };

    mockPrisma = {} as jest.Mocked<PrismaService>;

    handler = new UpdateProfileHandler(mockRepo, mockPrisma);
  });

  describe('scenario 1: successful update', () => {
    it('updates fields and returns profile', async () => {
      const existing = Customer.create({
        userId: 'user-id',
        firstName: 'Juan',
        lastName: 'Perez',
      });
      mockRepo.findByUserId.mockResolvedValue(existing);
      mockRepo.update.mockResolvedValue(undefined);

      const body: UpdateCustomerInput = { firstName: 'Juan Carlos' };
      const result = await handler.execute('user-id', body);

      expect(result.firstName).toBe('Juan Carlos');
      expect(result.userId).toBe('user-id');
      expect(result.lastName).toBe('Perez');
      expect(mockRepo.update).toHaveBeenCalled();
      expect(mockRepo.findByUserId).toHaveBeenCalledWith('user-id');
    });
  });

  describe('scenario 2: customer not found', () => {
    it('throws NotFoundException', async () => {
      mockRepo.findByUserId.mockResolvedValue(null);

      await expect(
        handler.execute('user-id', { firstName: 'Juan' }),
      ).rejects.toThrow(NotFoundException);

      expect(mockRepo.update).not.toHaveBeenCalled();
    });
  });
});
