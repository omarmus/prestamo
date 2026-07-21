import { ListApplicationsHandler } from './get-applications.handler';
import type { LoanApplicationRepository } from '../../domain/loan-application.repository';
import { LoanApplication } from '../../domain/loan-application.entity';
import type { LoanStatus } from '../../domain/value-objects/loan-status';

function createApp(
  id = 'app-1',
  status: LoanStatus = 'DRAFT',
  customerId = 'customer-1',
  purpose: string | null = null,
): LoanApplication {
  return new LoanApplication(
    id, customerId,
    10000, 12, 12, 888.49, 661.88, 10661.88,
    purpose, status, null, null, null, null, null,
    '2026-07-20T12:00:00.000Z', '2026-07-20T12:00:00.000Z', [],
  );
}

describe('ListApplicationsHandler', () => {
  let handler: ListApplicationsHandler;
  let mockRepo: jest.Mocked<LoanApplicationRepository>;

  beforeEach(() => {
    mockRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCustomerId: jest.fn(),
      findByCustomerIdAndId: jest.fn(),
      findPending: jest.fn(),
      updateStatus: jest.fn(),
    };

    handler = new ListApplicationsHandler(mockRepo);
  });

  describe('scenario: customer has applications', () => {
    it('returns all applications for the customer sorted by createdAt desc', async () => {
      const apps = [
        createApp('app-1', 'PENDING', 'customer-1', 'NEGOCIO'),
        createApp('app-2', 'DRAFT', 'customer-1'),
      ];
      mockRepo.findByCustomerId.mockResolvedValue(apps);

      const result = await handler.execute('customer-1');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('app-1');
      expect(result[0].status).toBe('PENDING');
      expect(result[1].id).toBe('app-2');
      expect(mockRepo.findByCustomerId).toHaveBeenCalledWith('customer-1');
    });
  });

  describe('scenario: customer has no applications', () => {
    it('returns empty array', async () => {
      mockRepo.findByCustomerId.mockResolvedValue([]);

      const result = await handler.execute('customer-1');

      expect(result).toEqual([]);
    });
  });

  describe('scenario: does not see other customers applications', () => {
    it('only returns own applications', async () => {
      mockRepo.findByCustomerId.mockResolvedValue([]);

      const result = await handler.execute('customer-2');

      expect(result).toHaveLength(0);
      expect(mockRepo.findByCustomerId).toHaveBeenCalledWith('customer-2');
    });
  });
});
