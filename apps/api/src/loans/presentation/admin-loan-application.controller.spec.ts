import type { LoanApplicationRepository } from '../domain/loan-application.repository';
import type { CustomerRepository } from '../../customers/domain/customer.repository';
import type { PrismaService } from '../../shared/prisma/prisma.service';
import { LoanApplication } from '../domain/loan-application.entity';
import { ReviewApplicationHandler } from '../application/review-application/review-application.handler';
import { ListPendingApplicationsHandler } from '../application/list-pending-applications/list-pending-applications.handler';
import { PrismaAdminQueryImpl } from '../infrastructure/admin-query/prisma-admin-query.impl';
import { AdminGuard } from './admin.guard';
import type { LoanStatus } from '../domain/value-objects/loan-status';

function createApp(status: LoanStatus = 'PENDING', reviewerId: string | null = null, monthlyPayment = 2500): LoanApplication {
  return new LoanApplication(
    'app-1', 'customer-1',
    10000, 12, 12, monthlyPayment, 661.88, 10661.88,
    'NEGOCIO', status, null, null, reviewerId, null, null,
    '2026-07-20T12:00:00.000Z', '2026-07-20T12:00:00.000Z', [],
  );
}

describe('AdminLoanApplicationController integration', () => {
  let mockRepo: jest.Mocked<LoanApplicationRepository>;
  let mockCustomerRepo: jest.Mocked<CustomerRepository>;
  let mockPrisma: {
    customerDocument: { findMany: jest.Mock };
    customerIncome: { findMany: jest.Mock };
    loanApplication: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let reviewHandler: ReviewApplicationHandler;
  let listPendingHandler: ListPendingApplicationsHandler;
  let adminQuery: PrismaAdminQueryImpl;

  beforeEach(() => {
    mockRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCustomerId: jest.fn(),
      findByCustomerIdAndId: jest.fn(),
      findPending: jest.fn(),
      updateStatus: jest.fn(),
    };

    mockCustomerRepo = {
      save: jest.fn(),
      findByUserId: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
    };

    mockPrisma = {
      customerDocument: { findMany: jest.fn() },
      customerIncome: { findMany: jest.fn() },
      loanApplication: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    reviewHandler = new ReviewApplicationHandler(
      mockRepo,
      mockCustomerRepo,
      mockPrisma as unknown as jest.Mocked<PrismaService>,
    );

    listPendingHandler = new ListPendingApplicationsHandler(
      mockPrisma as unknown as jest.Mocked<PrismaService>,
    );

    adminQuery = new PrismaAdminQueryImpl(
      mockPrisma as unknown as jest.Mocked<PrismaService>,
    );
  });

  describe('GET /api/admin/loans — list pending', () => {
    it('returns paginated results with default PENDING+IN_REVIEW filter', async () => {
      const fakeRows = [
        {
          id: 'app-1', customerId: 'customer-1', amount: 10000, termMonths: 12,
          annualRate: 12, monthlyPayment: 888.49, totalInterest: 661.88, totalPayment: 10661.88,
          purpose: 'NEGOCIO', status: 'PENDING', riskScore: null, simulationId: null,
          reviewerId: null, reviewNotes: null, reviewedAt: null, timeline: [],
          createdAt: new Date('2026-07-20'), updatedAt: new Date('2026-07-20'),
          customer: { id: 'customer-1', firstName: 'Juan', lastName: 'Perez', documentNumber: '1234567' },
          reviewer: null,
        },
      ];
      mockPrisma.$transaction
        .mockResolvedValueOnce([fakeRows, 1]);

      const result = await listPendingHandler.execute({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].customer.firstName).toBe('Juan');
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('filters by specific status', async () => {
      mockPrisma.$transaction.mockResolvedValueOnce([[], 0]);

      const result = await listPendingHandler.execute({ page: 1, limit: 20, status: 'APPROVED' });

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('GET /api/admin/loans/:id — detail', () => {
    it('returns full application detail with customer data', async () => {
      mockPrisma.loanApplication.findUnique.mockResolvedValue({
        id: 'app-1', customerId: 'customer-1',
        amount: 10000, termMonths: 12, annualRate: 12,
        monthlyPayment: 888.49, totalInterest: 661.88, totalPayment: 10661.88,
        purpose: 'NEGOCIO', status: 'IN_REVIEW', riskScore: null, simulationId: null,
        reviewerId: null, reviewNotes: null, reviewedAt: null, timeline: [],
        createdAt: new Date('2026-07-20'), updatedAt: new Date('2026-07-20'),
        customer: {
          id: 'customer-1', firstName: 'Juan', lastName: 'Perez',
          documentType: 'CI', documentNumber: '1234567',
          status: 'REGISTERED', kycStatus: 'COMPLETED',
          addresses: [], phones: [], incomes: [], employment: null,
          bankAccounts: [], documents: [], simulations: [],
        },
      });

      const result = await adminQuery.getApplicationDetail('app-1');

      expect(result).not.toBeNull();
      expect(result!.application.id).toBe('app-1');
      expect(result!.customer.firstName).toBe('Juan');
      expect(result!.totalMonthlyIncome).toBe(0);
      expect(result!.dti).toBe(0);
    });

    it('returns null for nonexistent', async () => {
      mockPrisma.loanApplication.findUnique.mockResolvedValue(null);

      const result = await adminQuery.getApplicationDetail('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('POST /api/admin/loans/:id/review', () => {
    it('assigns review → 200 IN_REVIEW', async () => {
      const app = createApp('PENDING');
      mockRepo.findById.mockResolvedValue(app);
      mockRepo.updateStatus.mockResolvedValue(true);

      const result = await reviewHandler.execute('admin-1', 'app-1', 'review', {});

      expect(result.status).toBe('IN_REVIEW');
      expect(result.reviewerId).toBe('admin-1');
    });
  });

  describe('POST /api/admin/loans/:id/approve', () => {
    it('approves application → 200 APPROVED', async () => {
      const app = createApp('IN_REVIEW', 'admin-1', 2500);
      mockRepo.findById.mockResolvedValue(app);
      mockRepo.updateStatus.mockResolvedValue(true);
      mockPrisma.customerIncome.findMany.mockResolvedValue([
        { id: 'inc-1', source: 'SALARY', amount: 10000, frequency: 'MONTHLY' },
      ]);
      mockPrisma.customerDocument.findMany.mockResolvedValue([
        { id: 'doc-1', type: 'CI_FRONT', status: 'VERIFIED' },
        { id: 'doc-2', type: 'CI_BACK', status: 'VERIFIED' },
      ]);

      const result = await reviewHandler.execute('admin-1', 'app-1', 'approve', { notes: 'ok' });

      expect(result.status).toBe('APPROVED');
      expect(result.riskScore).toBe('LOW');
    });
  });

  describe('POST /api/admin/loans/:id/reject', () => {
    it('rejects application → 200 REJECTED', async () => {
      const app = createApp('IN_REVIEW', 'admin-1');
      mockRepo.findById.mockResolvedValue(app);
      mockRepo.updateStatus.mockResolvedValue(true);

      const result = await reviewHandler.execute('admin-1', 'app-1', 'reject', { reason: 'Doc insuficiente' });

      expect(result.status).toBe('REJECTED');
      expect(result.reviewNotes).toBe('Doc insuficiente');
    });
  });

  describe('POST /api/admin/loans/:id/request-info', () => {
    it('requests info → 200 INFO_REQUESTED', async () => {
      const app = createApp('IN_REVIEW', 'admin-1');
      mockRepo.findById.mockResolvedValue(app);
      mockRepo.updateStatus.mockResolvedValue(true);

      const result = await reviewHandler.execute('admin-1', 'app-1', 'request-info', {
        message: 'Sube tu recibo de sueldo',
      });

      expect(result.status).toBe('INFO_REQUESTED');
      expect(result.reviewNotes).toBe('Sube tu recibo de sueldo');
    });
  });

  describe('Non-admin access', () => {
    it('AdminGuard rejects non-admin users', () => {
      const guard = new AdminGuard();

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({ user: { sub: 'user-1', role: 'USER' } }),
        }),
      } as never;

      expect(guard.canActivate(mockContext)).toBe(false);
    });

    it('AdminGuard allows admin users', () => {
      const guard = new AdminGuard();

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({ user: { sub: 'admin-1', role: 'ADMIN' } }),
        }),
      } as never;

      expect(guard.canActivate(mockContext)).toBe(true);
    });
  });
});
