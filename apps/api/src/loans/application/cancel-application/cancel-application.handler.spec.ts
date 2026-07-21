import { CancelApplicationHandler } from './cancel-application.handler';
import type { LoanApplicationRepository } from '../../domain/loan-application.repository';
import { LoanApplication } from '../../domain/loan-application.entity';
import { LoanNotFoundError, LoanAlreadyReviewedError, LoanStatusTransitionError } from '../../domain/loan-application.errors';
import type { LoanStatus } from '../../domain/value-objects/loan-status';

function createApp(status: LoanStatus = 'DRAFT', id = 'app-1', customerId = 'customer-1'): LoanApplication {
  return new LoanApplication(
    id, customerId,
    10000, 12, 12, 888.49, 661.88, 10661.88,
    null, status, null, null, null, null, null,
    '2026-07-20T12:00:00.000Z', '2026-07-20T12:00:00.000Z', [],
  );
}

describe('CancelApplicationHandler', () => {
  let handler: CancelApplicationHandler;
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

    handler = new CancelApplicationHandler(mockRepo);
  });

  describe('scenario: cancel DRAFT application', () => {
    it('returns CANCELLED status', async () => {
      const app = createApp('DRAFT');
      mockRepo.findByCustomerIdAndId.mockResolvedValue(app);
      mockRepo.updateStatus.mockResolvedValue(true);

      const result = await handler.execute('customer-1', 'app-1');

      expect(result.status).toBe('CANCELLED');
      expect(mockRepo.updateStatus).toHaveBeenCalledWith(
        'app-1', 'DRAFT', 'CANCELLED', expect.objectContaining({ timeline: expect.any(Array) }),
      );
    });
  });

  describe('scenario: cancel PENDING application', () => {
    it('returns CANCELLED status', async () => {
      const app = createApp('PENDING');
      mockRepo.findByCustomerIdAndId.mockResolvedValue(app);
      mockRepo.updateStatus.mockResolvedValue(true);

      const result = await handler.execute('customer-1', 'app-1');

      expect(result.status).toBe('CANCELLED');
      expect(mockRepo.updateStatus).toHaveBeenCalledWith(
        'app-1', 'PENDING', 'CANCELLED', expect.any(Object),
      );
    });
  });

  describe('scenario: cancel IN_REVIEW application', () => {
    it('throws 409 status transition error', async () => {
      const app = createApp('IN_REVIEW');
      mockRepo.findByCustomerIdAndId.mockResolvedValue(app);

      // The entity throws LoanStatusTransitionError (which has statusCode 409)
      // before any repository call — IN_REVIEW → CANCELLED is not a valid transition
      await expect(handler.execute('customer-1', 'app-1')).rejects.toThrow(LoanStatusTransitionError);
    });
  });

  describe('scenario: cancel APPROVED application', () => {
    it('throws 409 status transition error', async () => {
      const app = createApp('APPROVED');
      mockRepo.findByCustomerIdAndId.mockResolvedValue(app);

      await expect(handler.execute('customer-1', 'app-1')).rejects.toThrow(LoanStatusTransitionError);
    });
  });

  describe('scenario: application not found', () => {
    it('throws 404', async () => {
      mockRepo.findByCustomerIdAndId.mockResolvedValue(null);

      await expect(handler.execute('customer-1', 'nonexistent')).rejects.toThrow(LoanNotFoundError);
    });
  });

  describe('scenario: race condition - status changed between read and write', () => {
    it('throws 409 when updateStatus returns false', async () => {
      const app = createApp('DRAFT');
      mockRepo.findByCustomerIdAndId.mockResolvedValue(app);
      mockRepo.updateStatus.mockResolvedValue(false);

      await expect(handler.execute('customer-1', 'app-1')).rejects.toThrow(LoanAlreadyReviewedError);
    });
  });
});
