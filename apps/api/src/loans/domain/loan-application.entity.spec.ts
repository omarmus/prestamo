import { LoanApplication } from './loan-application.entity';
import { LoanStatusTransitionError, LoanNotOwnedByCustomerError } from './loan-application.errors';
import type { LoanStatus } from './value-objects/loan-status';

function createApp(status: LoanStatus = 'DRAFT', reviewerId: string | null = null): LoanApplication {
  return new LoanApplication(
    'app-1', 'customer-1',
    10000, 12, 12, 888.49, 661.88, 10661.88,
    null, status, null, null, reviewerId, null, null,
    new Date().toISOString(), new Date().toISOString(), [],
  );
}

describe('LoanApplication', () => {
  describe('submit()', () => {
    it('transitions DRAFT → PENDING', () => {
      const app = createApp('DRAFT');
      app.submit();
      expect(app.status).toBe('PENDING');
      expect(app.timeline).toHaveLength(1);
    });
  });

  describe('cancel()', () => {
    it('transitions DRAFT → CANCELLED', () => {
      const app = createApp('DRAFT');
      app.cancel();
      expect(app.status).toBe('CANCELLED');
    });

    it('transitions PENDING → CANCELLED', () => {
      const app = createApp('PENDING');
      app.cancel();
      expect(app.status).toBe('CANCELLED');
    });

    it('throws from IN_REVIEW', () => {
      const app = createApp('IN_REVIEW');
      expect(() => app.cancel()).toThrow(LoanStatusTransitionError);
    });
  });

  describe('assignReviewer()', () => {
    it('transitions PENDING → IN_REVIEW with reviewerId', () => {
      const app = createApp('PENDING');
      app.assignReviewer('admin-1');
      expect(app.status).toBe('IN_REVIEW');
      expect(app.reviewerId).toBe('admin-1');
    });

    it('throws from DRAFT', () => {
      const app = createApp('DRAFT');
      expect(() => app.assignReviewer('admin-1')).toThrow(LoanStatusTransitionError);
    });
  });

  describe('approve()', () => {
    it('transitions IN_REVIEW → APPROVED', () => {
      const app = createApp('IN_REVIEW', 'admin-1');
      app.approve('admin-1', 'LOW');
      expect(app.status).toBe('APPROVED');
      expect(app.riskScore).toBe('LOW');
      expect(app.reviewedAt).not.toBeNull();
    });

    it('throws if wrong reviewer', () => {
      const app = createApp('IN_REVIEW', 'admin-1');
      expect(() => app.approve('other-admin', 'LOW')).toThrow(LoanNotOwnedByCustomerError);
    });
  });

  describe('reject()', () => {
    it('transitions IN_REVIEW → REJECTED with reason', () => {
      const app = createApp('IN_REVIEW', 'admin-1');
      app.reject('admin-1', 'Documentación insuficiente');
      expect(app.status).toBe('REJECTED');
      expect(app.reviewNotes).toBe('Documentación insuficiente');
    });

    it('throws if wrong reviewer', () => {
      const app = createApp('IN_REVIEW', 'admin-1');
      expect(() => app.reject('other-admin', 'no')).toThrow(LoanNotOwnedByCustomerError);
    });
  });

  describe('requestInfo()', () => {
    it('transitions IN_REVIEW → INFO_REQUESTED', () => {
      const app = createApp('IN_REVIEW', 'admin-1');
      app.requestInfo('admin-1', 'Sube tu recibo');
      expect(app.status).toBe('INFO_REQUESTED');
      expect(app.reviewNotes).toBe('Sube tu recibo');
    });
  });

  describe('respondToInfo()', () => {
    it('transitions INFO_REQUESTED → PENDING', () => {
      const app = createApp('INFO_REQUESTED');
      app.respondToInfo();
      expect(app.status).toBe('PENDING');
    });
  });

  describe('terminal states', () => {
    it.each(['APPROVED', 'REJECTED', 'CANCELLED'] as LoanStatus[])('throws from %s', (status) => {
      const app = createApp(status);
      expect(() => app.submit()).toThrow(LoanStatusTransitionError);
      expect(() => app.cancel()).toThrow(LoanStatusTransitionError);
    });
  });
});