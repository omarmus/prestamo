import { CheckStatusHandler } from './check-status.handler';
import type { LoanApplicationRepository } from '../domain/loan-application-repository.port';
import { LoanApplication } from '../domain/loan-application.entity';

describe('CheckStatusHandler', () => {
  let handler: CheckStatusHandler;
  let mockLoanRepo: jest.Mocked<LoanApplicationRepository>;

  beforeEach(() => {
    mockLoanRepo = {
      save: jest.fn(),
      findByPhone: jest.fn(),
      findById: jest.fn(),
    };
    handler = new CheckStatusHandler(mockLoanRepo);
  });

  describe('execute with existing loan application', () => {
    it('returns application status', async () => {
      const app = LoanApplication.create({
        phone: '+59171234567',
        amount: 5000,
        termMonths: 12,
        purpose: 'Negocio',
        status: 'draft',
      });
      mockLoanRepo.findByPhone.mockResolvedValue(app);

      const result = await handler.execute('+59171234567');

      expect(result.hasApplication).toBe(true);
      expect(result.message).toContain('5000');
      expect(result.message).toContain('12 meses');
    });

    it('shows different messages per status', async () => {
      const app = LoanApplication.create({
        phone: '+59171234567',
        amount: 3000,
        termMonths: 6,
        purpose: 'Salud',
        status: 'review',
      });
      mockLoanRepo.findByPhone.mockResolvedValue(app);

      const result = await handler.execute('+59171234567');

      expect(result.hasApplication).toBe(true);
      expect(result.message).toContain('revisando');
    });
  });

  describe('execute without loan application', () => {
    it('returns hasApplication false when no loan exists', async () => {
      mockLoanRepo.findByPhone.mockResolvedValue(null);

      const result = await handler.execute('+59171234567');

      expect(result.hasApplication).toBe(false);
      expect(result.message).toContain('No tienes solicitudes');
    });
  });
});
