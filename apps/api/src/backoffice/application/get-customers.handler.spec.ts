import { GetCustomersHandler } from './get-customers.handler';
import { ADMIN_CUSTOMER_QUERY } from './ports/admin-customer-query.port';
import type { AdminCustomerQuery, AdminCustomerListFilters } from './ports/admin-customer-query.port';
import type { AdminCustomerListItem } from '@prestamos/shared';

describe('GetCustomersHandler', () => {
  let handler: GetCustomersHandler;
  let mockQuery: jest.Mocked<AdminCustomerQuery>;

  beforeEach(() => {
    mockQuery = {
      list: jest.fn(),
      getById: jest.fn(),
    };
    handler = new GetCustomersHandler(mockQuery);
  });

  describe('scenario: list customers with pagination', () => {
    it('returns paginated customer list', async () => {
      const customers: AdminCustomerListItem[] = [
        {
          id: 'cust-1',
          firstName: 'Juan',
          lastName: 'Perez',
          documentType: 'CI',
          documentNumber: '123456',
          email: 'juan@test.com',
          phone: '+59171234567',
          status: 'REGISTERED',
          kycStatus: 'VERIFIED',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ];
      mockQuery.list.mockResolvedValue({ data: customers, total: 1 });

      const filters: AdminCustomerListFilters = { page: 1, limit: 20 };
      const result = await handler.execute(filters);

      expect(result.data).toEqual(customers);
      expect(result.pagination).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 });
      expect(mockQuery.list).toHaveBeenCalledWith(filters);
    });
  });

  describe('scenario: empty result', () => {
    it('returns empty list with zero pagination', async () => {
      mockQuery.list.mockResolvedValue({ data: [], total: 0 });

      const result = await handler.execute({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(0);
      expect(result.pagination.totalPages).toBe(0);
    });
  });
});
