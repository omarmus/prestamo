import { GetApplicationHandler } from './get-application.handler';
import type { LoanApplicationRepository } from '../../domain/loan-application.repository';
import { LoanApplication } from '../../domain/loan-application.entity';
import { LoanNotFoundError } from '../../domain/loan-application.errors';
import type { LoanStatus } from '../../domain/value-objects/loan-status';
import type { TimelineEntry } from '../../domain/loan-application.entity';

function createApp(status: LoanStatus = 'PENDING'): LoanApplication {
  const timeline: TimelineEntry[] = [{
    fromStatus: null,
    toStatus: status,
    changedBy: 'customer',
    changedAt: new Date().toISOString(),
  }];
  return new LoanApplication(
    'app-1', 'customer-1',
    10000, 12, 12, 888.49, 661.88, 10661.88,
    'NEGOCIO', status, null, null, null, null, null,
    '2026-07-20T12:00:00.000Z', '2026-07-20T12:00:00.000Z', timeline,
  );
}

describe('GetApplicationHandler', () => {
  let handler: GetApplicationHandler;
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

    handler = new GetApplicationHandler(mockRepo);
  });

  describe('scenario: get own application detail', () => {
    it('returns full detail with timeline', async () => {
      const app = createApp('DRAFT');
      mockRepo.findByCustomerIdAndId.mockResolvedValue(app);

      const result = await handler.execute('customer-1', 'app-1');

      expect(result.id).toBe('app-1');
      expect(result.status).toBe('DRAFT');
      expect(result.amount).toBe(10000);
      expect(result.timeline).toHaveLength(1);
      expect(mockRepo.findByCustomerIdAndId).toHaveBeenCalledWith('customer-1', 'app-1');
    });
  });

  describe('scenario: application belongs to another customer', () => {
    it('throws 404', async () => {
      mockRepo.findByCustomerIdAndId.mockResolvedValue(null);

      await expect(handler.execute('customer-2', 'app-1')).rejects.toThrow(LoanNotFoundError);
    });
  });

  describe('scenario: application does not exist', () => {
    it('throws 404', async () => {
      mockRepo.findByCustomerIdAndId.mockResolvedValue(null);

      await expect(handler.execute('customer-1', 'nonexistent')).rejects.toThrow(LoanNotFoundError);
    });
  });
});
