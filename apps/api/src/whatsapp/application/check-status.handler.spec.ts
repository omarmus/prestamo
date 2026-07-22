import { CheckStatusHandler } from './check-status.handler';

function makePrismaMock() {
  return {
    whatsAppLoanDraft: {
      findFirst: jest.fn(),
    },
  };
}

describe('CheckStatusHandler', () => {
  let handler: CheckStatusHandler;
  let mockPrisma: ReturnType<typeof makePrismaMock>;

  beforeEach(() => {
    mockPrisma = makePrismaMock();
    handler = new CheckStatusHandler(mockPrisma as never);
  });

  describe('execute with existing loan application', () => {
    it('returns application status', async () => {
      mockPrisma.whatsAppLoanDraft.findFirst.mockResolvedValue({
        id: 'loan-1',
        phone: '+59171234567',
        amount: 5000,
        termMonths: 12,
        purpose: 'Negocio',
        status: 'draft',
        userId: null,
        createdAt: new Date('2025-01-15'),
        updatedAt: new Date('2025-01-15'),
      });

      const result = await handler.execute('+59171234567');

      expect(result.hasApplication).toBe(true);
      expect(result.message).toContain('5000');
      expect(result.message).toContain('12 meses');
    });

    it('shows different messages per status', async () => {
      mockPrisma.whatsAppLoanDraft.findFirst.mockResolvedValue({
        id: 'loan-1',
        phone: '+59171234567',
        amount: 3000,
        termMonths: 6,
        purpose: 'Salud',
        status: 'review',
        userId: null,
        createdAt: new Date('2025-01-15'),
        updatedAt: new Date('2025-01-15'),
      });

      const result = await handler.execute('+59171234567');

      expect(result.hasApplication).toBe(true);
      expect(result.message).toContain('revisando');
    });
  });

  describe('execute without loan application', () => {
    it('returns hasApplication false when no loan exists', async () => {
      mockPrisma.whatsAppLoanDraft.findFirst.mockResolvedValue(null);

      const result = await handler.execute('+59171234567');

      expect(result.hasApplication).toBe(false);
      expect(result.message).toContain('No tienes solicitudes');
    });
  });
});
