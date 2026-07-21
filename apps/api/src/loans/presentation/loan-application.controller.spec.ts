import type { LoanApplicationRepository } from '../domain/loan-application.repository';
import { LoanApplication } from '../domain/loan-application.entity';
import { ListApplicationsHandler } from '../application/get-applications/get-applications.handler';
import { GetApplicationHandler } from '../application/get-application/get-application.handler';
import { CancelApplicationHandler } from '../application/cancel-application/cancel-application.handler';
import { LoanNotFoundError, LoanStatusTransitionError } from '../domain/loan-application.errors';
import type { LoanStatus } from '../domain/value-objects/loan-status';

// ponytail: Integration-style tests that exercise handler + mock repository together.
// Full controller integration with Test.createTestingModule plus HTTP mocks would need
// NestJS testing module setup. These test the handler-repository-controller boundary.

function createApp(status: LoanStatus = 'DRAFT', id = 'app-1', customerId = 'customer-1'): LoanApplication {
  return new LoanApplication(
    id, customerId,
    10000, 12, 12, 888.49, 661.88, 10661.88,
    null, status, null, null, null, null, null,
    '2026-07-20T12:00:00.000Z', '2026-07-20T12:00:00.000Z', [],
  );
}

describe('LoanApplicationController integration', () => {
  let mockRepo: jest.Mocked<LoanApplicationRepository>;
  let listHandler: ListApplicationsHandler;
  let getHandler: GetApplicationHandler;
  let cancelHandler: CancelApplicationHandler;

  beforeEach(() => {
    mockRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCustomerId: jest.fn(),
      findByCustomerIdAndId: jest.fn(),
      findPending: jest.fn(),
      updateStatus: jest.fn(),
    };

    listHandler = new ListApplicationsHandler(mockRepo);
    getHandler = new GetApplicationHandler(mockRepo);
    cancelHandler = new CancelApplicationHandler(mockRepo);
  });

  describe('GET /api/loans/applications', () => {
    it('lists own applications → 200 with data array', async () => {
      const apps = [createApp('DRAFT', 'app-1', 'customer-1'), createApp('PENDING', 'app-2', 'customer-1')];
      mockRepo.findByCustomerId.mockResolvedValue(apps);

      const result = await listHandler.execute('customer-1');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('app-1');
      expect(result[1].id).toBe('app-2');
    });

    it('returns empty array when no applications', async () => {
      mockRepo.findByCustomerId.mockResolvedValue([]);

      const result = await listHandler.execute('customer-1');

      expect(result).toEqual([]);
    });
  });

  describe('GET /api/loans/applications/:id', () => {
    it('gets own application detail → 200', async () => {
      const app = createApp('PENDING', 'app-1', 'customer-1');
      mockRepo.findByCustomerIdAndId.mockResolvedValue(app);

      const result = await getHandler.execute('customer-1', 'app-1');

      expect(result.id).toBe('app-1');
      expect(result.status).toBe('PENDING');
      expect(result.amount).toBe(10000);
    });

    it('gets another customer application → 404', async () => {
      mockRepo.findByCustomerIdAndId.mockResolvedValue(null);

      await expect(getHandler.execute('customer-2', 'app-1')).rejects.toThrow(LoanNotFoundError);
    });
  });

  describe('DELETE /api/loans/applications/:id', () => {
    it('cancels DRAFT application → 200 CANCELLED', async () => {
      const app = createApp('DRAFT', 'app-1', 'customer-1');
      mockRepo.findByCustomerIdAndId.mockResolvedValue(app);
      mockRepo.updateStatus.mockResolvedValue(true);

      const result = await cancelHandler.execute('customer-1', 'app-1');

      expect(result.status).toBe('CANCELLED');
    });

    it('cancels IN_REVIEW → 409', async () => {
      const app = createApp('IN_REVIEW', 'app-1', 'customer-1');
      mockRepo.findByCustomerIdAndId.mockResolvedValue(app);

      await expect(cancelHandler.execute('customer-1', 'app-1')).rejects.toThrow(LoanStatusTransitionError);
    });
  });
});
