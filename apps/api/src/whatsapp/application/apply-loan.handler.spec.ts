import { ApplyLoanHandler } from './apply-loan.handler';
import type { ContactRepository } from '../domain/contact-repository.port';

function makePrismaMock() {
  return {
    whatsAppLoanDraft: {
      create: jest.fn().mockResolvedValue({}),
    },
  };
}

describe('ApplyLoanHandler', () => {
  let handler: ApplyLoanHandler;
  let mockPrisma: ReturnType<typeof makePrismaMock>;
  let mockContactRepo: jest.Mocked<ContactRepository>;

  beforeEach(() => {
    mockPrisma = makePrismaMock();
    mockContactRepo = {
      save: jest.fn(),
      findByPhone: jest.fn(),
      findById: jest.fn(),
    };
    handler = new ApplyLoanHandler(mockPrisma as never, mockContactRepo);
  });

  describe('execute', () => {
    it('creates a loan application from session data', async () => {
      mockContactRepo.findByPhone.mockResolvedValue(null);

      const result = await handler.execute('+59171234567', {
        amount: 5000,
        termMonths: 12,
        purpose: 'Negocio',
      });

      expect(result.status).toBe('draft');
      expect(result.applicationId).toBeDefined();
      expect(mockPrisma.whatsAppLoanDraft.create).toHaveBeenCalledTimes(1);
    });

    it('returns a confirmation message with amount and term', async () => {
      mockContactRepo.findByPhone.mockResolvedValue(null);

      const result = await handler.execute('+59171234567', {
        amount: 10000,
        termMonths: 24,
        purpose: 'Educación',
      });

      expect(result.message).toContain('Bs. 10000');
      expect(result.message).toContain('24 meses');
      expect(result.message).toContain('Educación');
    });

    it('links user when contact has userId', async () => {
      mockContactRepo.findByPhone.mockResolvedValue({
        id: 'contact-1',
        phone: '+59171234567',
        userId: 'user-1',
        name: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await handler.execute('+59171234567', {
        amount: 5000,
        termMonths: 12,
        purpose: 'Negocio',
      });

      expect(mockPrisma.whatsAppLoanDraft.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 'user-1' }),
        }),
      );
      expect(result.status).toBe('draft');
    });
  });
});
