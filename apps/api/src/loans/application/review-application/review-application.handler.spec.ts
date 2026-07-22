import { ReviewApplicationHandler } from './review-application.handler';
import type { LoanApplicationRepository } from '../../domain/loan-application.repository';
import type { CustomerRepository } from '../../../customers/domain/customer.repository';
import type { PrismaService } from '../../../shared/prisma/prisma.service';
import { LoanApplication } from '../../domain/loan-application.entity';
import { Customer } from '../../../customers/domain/customer.entity';
import {
  LoanAlreadyReviewedError,
  HighRiskLoanError,
  MissingDocumentsError,
  InsufficientIncomeError,
} from '../../domain/loan-application.errors';
import type { LoanStatus } from '../../domain/value-objects/loan-status';

function createApp(status: LoanStatus = 'PENDING', reviewerId: string | null = null, monthlyPayment = 2500): LoanApplication {
  return new LoanApplication(
    'app-1', 'customer-1',
    10000, 12, 12, monthlyPayment, 661.88, 10661.88,
    'NEGOCIO', status, null, null, reviewerId, null, null,
    '2026-07-20T12:00:00.000Z', '2026-07-20T12:00:00.000Z', [],
  );
}

describe('ReviewApplicationHandler', () => {
  let handler: ReviewApplicationHandler;
  let mockRepo: jest.Mocked<LoanApplicationRepository>;
  let mockCustomerRepo: jest.Mocked<CustomerRepository>;
  let mockPrisma: {
    customerDocument: { findMany: jest.Mock };
    customerIncome: { findMany: jest.Mock };
  };

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
    };

    handler = new ReviewApplicationHandler(
      mockRepo,
      mockCustomerRepo,
      mockPrisma as unknown as jest.Mocked<PrismaService>,
    );
  });

  describe('scenario: assign review (PENDING → IN_REVIEW)', () => {
    it('transitions to IN_REVIEW with reviewerId', async () => {
      const app = createApp('PENDING');
      mockRepo.findById.mockResolvedValue(app);
      mockRepo.updateStatus.mockResolvedValue(true);

      const result = await handler.execute('admin-1', 'app-1', 'review', {});

      expect(result.status).toBe('IN_REVIEW');
      expect(result.reviewerId).toBe('admin-1');
      expect(mockRepo.updateStatus).toHaveBeenCalledWith(
        'app-1', 'PENDING', 'IN_REVIEW', expect.objectContaining({ reviewerId: 'admin-1' }),
      );
    });

    it('throws 409 when already in review (race condition)', async () => {
      const app = createApp('PENDING');
      mockRepo.findById.mockResolvedValue(app);
      mockRepo.updateStatus.mockResolvedValue(false);

      await expect(handler.execute('admin-1', 'app-1', 'review', {}))
        .rejects.toThrow(LoanAlreadyReviewedError);
    });
  });

  describe('scenario: approve low-risk (DTI ≤ 0.30)', () => {
    it('transitions to APPROVED with riskScore LOW', async () => {
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

      const result = await handler.execute('admin-1', 'app-1', 'approve', { notes: 'Cliente cumple perfil' });

      expect(result.status).toBe('APPROVED');
      expect(result.riskScore).toBe('LOW');
      expect(result.reviewNotes).toBe('Cliente cumple perfil');
      expect(result.reviewedAt).not.toBeNull();
    });
  });

  describe('scenario: approve medium-risk (DTI 0.40)', () => {
    it('transitions to APPROVED with riskScore MEDIUM', async () => {
      const app = createApp('IN_REVIEW', 'admin-1', 4000);
      mockRepo.findById.mockResolvedValue(app);
      mockRepo.updateStatus.mockResolvedValue(true);
      mockPrisma.customerIncome.findMany.mockResolvedValue([
        { id: 'inc-1', source: 'SALARY', amount: 10000, frequency: 'MONTHLY' },
      ]);
      mockPrisma.customerDocument.findMany.mockResolvedValue([
        { id: 'doc-1', type: 'CI_FRONT', status: 'VERIFIED' },
        { id: 'doc-2', type: 'CI_BACK', status: 'VERIFIED' },
      ]);

      const result = await handler.execute('admin-1', 'app-1', 'approve', {});

      expect(result.status).toBe('APPROVED');
      expect(result.riskScore).toBe('MEDIUM');
    });
  });

  describe('scenario: approve high-risk (DTI > 0.50) is blocked', () => {
    it('throws 422 with HighRiskLoanError', async () => {
      const app = createApp('IN_REVIEW', 'admin-1', 6000);
      mockRepo.findById.mockResolvedValue(app);
      mockPrisma.customerIncome.findMany.mockResolvedValue([
        { id: 'inc-1', source: 'SALARY', amount: 10000, frequency: 'MONTHLY' },
      ]);

      await expect(handler.execute('admin-1', 'app-1', 'approve', {}))
        .rejects.toThrow(HighRiskLoanError);

      expect(mockRepo.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe('scenario: approve without verified CI documents', () => {
    it('throws 422 with MissingDocumentsError', async () => {
      const app = createApp('IN_REVIEW', 'admin-1', 2500);
      mockRepo.findById.mockResolvedValue(app);
      mockPrisma.customerIncome.findMany.mockResolvedValue([
        { id: 'inc-1', source: 'SALARY', amount: 10000, frequency: 'MONTHLY' },
      ]);
      // CI_FRONT is PENDING, CI_BACK missing
      mockPrisma.customerDocument.findMany.mockResolvedValue([
        { id: 'doc-1', type: 'CI_FRONT', status: 'PENDING' },
      ]);

      await expect(handler.execute('admin-1', 'app-1', 'approve', {}))
        .rejects.toThrow(MissingDocumentsError);
    });
  });

  describe('scenario: approve by wrong reviewer', () => {
    it('throws error about reviewer mismatch', async () => {
      const app = createApp('IN_REVIEW', 'admin-1', 2500);
      mockRepo.findById.mockResolvedValue(app);

      await expect(handler.execute('other-admin', 'app-1', 'approve', {}))
        .rejects.toThrow('Solo el asesor asignado puede aprobar esta solicitud');

      expect(mockRepo.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe('scenario: reject with reason', () => {
    it('transitions to REJECTED with reviewNotes', async () => {
      const app = createApp('IN_REVIEW', 'admin-1');
      mockRepo.findById.mockResolvedValue(app);
      mockRepo.updateStatus.mockResolvedValue(true);

      const result = await handler.execute('admin-1', 'app-1', 'reject', { reason: 'Documentación insuficiente' });

      expect(result.status).toBe('REJECTED');
      expect(result.reviewNotes).toBe('Documentación insuficiente');
      expect(result.reviewedAt).not.toBeNull();
    });
  });

  describe('scenario: request info', () => {
    it('transitions to INFO_REQUESTED with reviewNotes', async () => {
      const app = createApp('IN_REVIEW', 'admin-1');
      mockRepo.findById.mockResolvedValue(app);
      mockRepo.updateStatus.mockResolvedValue(true);

      const result = await handler.execute('admin-1', 'app-1', 'request-info', {
        message: 'Por favor sube tu último recibo de sueldo',
      });

      expect(result.status).toBe('INFO_REQUESTED');
      expect(result.reviewNotes).toBe('Por favor sube tu último recibo de sueldo');
    });
  });

  describe('scenario: race condition on approve', () => {
    it('throws 409 when updateStatus returns false', async () => {
      const app = createApp('IN_REVIEW', 'admin-1', 2500);
      mockRepo.findById.mockResolvedValue(app);
      mockRepo.updateStatus.mockResolvedValue(false);
      mockPrisma.customerIncome.findMany.mockResolvedValue([
        { id: 'inc-1', source: 'SALARY', amount: 10000, frequency: 'MONTHLY' },
      ]);
      mockPrisma.customerDocument.findMany.mockResolvedValue([
        { id: 'doc-1', type: 'CI_FRONT', status: 'VERIFIED' },
        { id: 'doc-2', type: 'CI_BACK', status: 'VERIFIED' },
      ]);

      await expect(handler.execute('admin-1', 'app-1', 'approve', {}))
        .rejects.toThrow(LoanAlreadyReviewedError);
    });
  });

  describe('scenario: DTI calculation with BIWEEKLY/WEEKLY/YEARLY normalization', () => {
    it('normalizes incomes correctly', async () => {
      mockPrisma.customerIncome.findMany.mockResolvedValue([
        { id: 'inc-1', source: 'SALARY', amount: 5000, frequency: 'MONTHLY' },
        { id: 'inc-2', source: 'RENT', amount: 1000, frequency: 'BIWEEKLY' },
        { id: 'inc-3', source: 'COMMISSION', amount: 500, frequency: 'WEEKLY' },
        { id: 'inc-4', source: 'BONUS', amount: 12000, frequency: 'YEARLY' },
      ]);
      // Monthly: 5000, BIWEEKLY: 1000*2.17 = 2170, WEEKLY: 500*4.33 = 2165, YEARLY: 12000/12 = 1000
      // total = 5000 + 2170 + 2165 + 1000 = 10335
      // DTI = 2500 / 10335 ≈ 0.24

      const result = await handler.calculateDTI('customer-1', 2500);

      expect(result.dti).toBeLessThanOrEqual(0.25);
      expect(result.riskScore).toBe('LOW');
    });
  });

  describe('scenario: DTI fallback to Customer.monthlyIncome', () => {
    it('uses customer.monthlyIncome when no CustomerIncome records', async () => {
      mockPrisma.customerIncome.findMany.mockResolvedValue([]);
      mockCustomerRepo.findById.mockResolvedValue(
        Customer.reconstitute({ id: 'customer-1', userId: 'user-1', firstName: 'Juan', documentType: 'CI', documentNumber: '12345678', monthlyIncome: 8000, createdAt: new Date(), updatedAt: new Date() }),
      );

      const result = await handler.calculateDTI('customer-1', 2000);

      expect(result.dti).toBe(0.25);
      expect(result.riskScore).toBe('LOW');
    });
  });

  describe('scenario: DTI fallback with no income at all', () => {
    it('throws InsufficientIncomeError', async () => {
      mockPrisma.customerIncome.findMany.mockResolvedValue([]);
      mockCustomerRepo.findById.mockResolvedValue(
        Customer.reconstitute({ id: 'customer-1', userId: 'user-1', firstName: 'Juan', documentType: 'CI', documentNumber: '12345678', monthlyIncome: null, createdAt: new Date(), updatedAt: new Date() }),
      );

      await expect(handler.calculateDTI('customer-1', 2000)).rejects.toThrow(InsufficientIncomeError);
    });
  });

  describe('scenario: DTI precision to 2 decimals', () => {
    it('rounds DTI to 2 decimal places', async () => {
      mockPrisma.customerIncome.findMany.mockResolvedValue([
        { id: 'inc-1', source: 'SALARY', amount: 3333, frequency: 'MONTHLY' },
      ]);

      const result = await handler.calculateDTI('customer-1', 1000);

      expect(result.dti).toBe(0.30); // 1000/3333 ≈ 0.30003 → 0.30
      expect(result.riskScore).toBe('LOW'); // 0.30 ≤ 0.30
    });
  });
});
