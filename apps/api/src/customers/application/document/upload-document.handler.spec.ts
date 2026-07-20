import { NotFoundException } from '@nestjs/common';
import { UploadDocumentHandler } from './upload-document.handler';
import type { CustomerRepository } from '../../domain/customer.repository';
import { Customer } from '../../domain/customer.entity';
import type { PrismaService } from '../../../shared/prisma/prisma.service';

describe('UploadDocumentHandler', () => {
  let handler: UploadDocumentHandler;
  let mockRepo: jest.Mocked<CustomerRepository>;
  let mockPrisma: { customerDocument: { create: jest.Mock } };

  beforeEach(() => {
    mockRepo = {
      save: jest.fn(),
      findByUserId: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
    };

    mockPrisma = {
      customerDocument: { create: jest.fn() },
    };

    handler = new UploadDocumentHandler(mockRepo, mockPrisma as unknown as jest.Mocked<PrismaService>);
  });

  describe('scenario 1: success', () => {
    it('creates document with correct data', async () => {
      const customer = Customer.create({ userId: 'user-id', firstName: 'Juan' });
      mockRepo.findByUserId.mockResolvedValue(customer);
      const createdDoc = {
        id: 'doc-1',
        type: 'CI_FRONT',
        fileName: 'ci-front.jpg',
        mimeType: 'image/jpeg',
        notes: null,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.customerDocument.create.mockResolvedValue(createdDoc);

      const result = await handler.execute('user-id', {
        type: 'CI_FRONT',
        fileName: 'ci-front.jpg',
        mimeType: 'image/jpeg',
        data: 'base64encodedcontent',
      });

      expect(result).toEqual(createdDoc);
      expect(mockPrisma.customerDocument.create).toHaveBeenCalledWith({
        data: {
          customerId: customer.id,
          type: 'CI_FRONT',
          fileName: 'ci-front.jpg',
          mimeType: 'image/jpeg',
          data: 'base64encodedcontent',
          notes: null,
        },
        select: {
          id: true,
          type: true,
          fileName: true,
          mimeType: true,
          notes: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });
  });

  describe('scenario 2: customer not found', () => {
    it('throws NotFoundException', async () => {
      mockRepo.findByUserId.mockResolvedValue(null);

      await expect(
        handler.execute('user-id', { type: 'CI_FRONT', data: 'base64' }),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.customerDocument.create).not.toHaveBeenCalled();
    });
  });
});
