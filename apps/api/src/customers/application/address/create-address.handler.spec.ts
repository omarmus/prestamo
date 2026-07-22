import { NotFoundException } from '@nestjs/common';
import { CreateAddressHandler } from './create-address.handler';
import type { CustomerRepository } from '../../domain/customer.repository';
import { Customer } from '../../domain/customer.entity';
import type { PrismaService } from '../../../shared/prisma/prisma.service';

describe('CreateAddressHandler', () => {
  let handler: CreateAddressHandler;
  let mockRepo: jest.Mocked<CustomerRepository>;
  let mockPrisma: { customerAddress: { create: jest.Mock } };

  beforeEach(() => {
    mockRepo = {
      save: jest.fn(),
      findByUserId: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
    };

    mockPrisma = {
      customerAddress: { create: jest.fn() },
    };

    handler = new CreateAddressHandler(mockRepo, mockPrisma as unknown as jest.Mocked<PrismaService>);
  });

  describe('scenario 1: success', () => {
    it('creates address with correct customerId', async () => {
      const customer = Customer.create({ userId: 'user-id', firstName: 'Juan', documentType: 'CI', documentNumber: '12345678' });
      mockRepo.findByUserId.mockResolvedValue(customer);
      const createdAddress = { id: 'addr-1', customerId: customer.id, city: 'La Paz', isPrimary: true };
      mockPrisma.customerAddress.create.mockResolvedValue(createdAddress);

      const result = await handler.execute('user-id', { city: 'La Paz', isPrimary: true });

      expect(result).toEqual(createdAddress);
      expect(mockPrisma.customerAddress.create).toHaveBeenCalledWith({
        data: {
          customerId: customer.id,
          type: null,
          country: null,
          department: null,
          city: 'La Paz',
          zone: null,
          street: null,
          number: null,
          isPrimary: true,
        },
      });
    });
  });

  describe('scenario 2: customer not found', () => {
    it('throws NotFoundException', async () => {
      mockRepo.findByUserId.mockResolvedValue(null);

      await expect(
        handler.execute('user-id', { city: 'La Paz' }),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.customerAddress.create).not.toHaveBeenCalled();
    });
  });
});
