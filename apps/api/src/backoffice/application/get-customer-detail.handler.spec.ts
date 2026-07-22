import { NotFoundException } from '@nestjs/common';
import { GetCustomerDetailHandler } from './get-customer-detail.handler';
import type { AdminCustomerQuery } from './ports/admin-customer-query.port';
import type { AdminCustomerDetailResponse } from '@prestamos/shared';

describe('GetCustomerDetailHandler', () => {
  let handler: GetCustomerDetailHandler;
  let mockQuery: jest.Mocked<AdminCustomerQuery>;

  beforeEach(() => {
    mockQuery = {
      list: jest.fn(),
      getById: jest.fn(),
    };
    handler = new GetCustomerDetailHandler(mockQuery);
  });

  describe('scenario: customer exists', () => {
    it('returns full customer detail', async () => {
      const detail = {
        customer: {
          id: 'cust-1',
          userId: 'user-1',
          firstName: 'Juan',
          lastName: 'Perez',
          documentType: 'CI',
          documentNumber: '123456',
          birthDate: null,
          gender: null,
          maritalStatus: null,
          occupation: null,
          monthlyIncome: null,
          status: 'REGISTERED',
          kycStatus: 'VERIFIED',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          addresses: [],
          phones: [],
          emails: [],
          employment: null,
          incomes: [],
          bankAccounts: [],
          documents: [],
          simulations: [],
          portalActions: [],
          user: { email: 'juan@test.com', phone: '+59171234567', name: 'Juan' },
        },
        loans: [],
        applications: [],
      } satisfies AdminCustomerDetailResponse;

      mockQuery.getById.mockResolvedValue(detail);

      const result = await handler.execute('cust-1');

      expect(result).toEqual(detail);
      expect(mockQuery.getById).toHaveBeenCalledWith('cust-1');
    });
  });

  describe('scenario: customer does not exist', () => {
    it('throws NotFoundException', async () => {
      mockQuery.getById.mockResolvedValue(null);

      await expect(handler.execute('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
