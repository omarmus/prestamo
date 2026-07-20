import { NotFoundException } from '@nestjs/common';
import { CreateSimulationHandler } from './create-simulation.handler';
import type { CustomerRepository } from '../../domain/customer.repository';
import { Customer } from '../../domain/customer.entity';
import type { PrismaService } from '../../../shared/prisma/prisma.service';
import { calculateLoan } from './loan-calculator';

jest.mock('./loan-calculator');

const mockCalculateLoan = calculateLoan as jest.MockedFunction<typeof calculateLoan>;

describe('CreateSimulationHandler', () => {
  let handler: CreateSimulationHandler;
  let mockRepo: jest.Mocked<CustomerRepository>;
  let mockPrisma: { loanSimulation: { create: jest.Mock } };

  beforeEach(() => {
    mockRepo = {
      save: jest.fn(),
      findByUserId: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
    };

    mockPrisma = {
      loanSimulation: { create: jest.fn() },
    };

    mockCalculateLoan.mockReturnValue({
      monthlyPayment: 888.49,
      totalInterest: 661.88,
      totalPayment: 10661.88,
      schedule: [
        { period: 1, payment: 888.49, interest: 100, principal: 788.49, balance: 9211.51 },
        { period: 2, payment: 888.49, interest: 92.12, principal: 796.37, balance: 8415.14 },
      ],
    });

    handler = new CreateSimulationHandler(mockRepo, mockPrisma as unknown as jest.Mocked<PrismaService>);
  });

  describe('scenario 1: success', () => {
    it('returns simulation result with schedule', async () => {
      const customer = Customer.create({ userId: 'user-id', firstName: 'Juan' });
      mockRepo.findByUserId.mockResolvedValue(customer);
      mockPrisma.loanSimulation.create.mockResolvedValue({
        id: 'sim-1',
        amount: 10000,
        termMonths: 12,
        annualRate: 12,
        monthlyPayment: 888.49,
        createdAt: new Date('2024-01-15'),
      });

      const result = await handler.execute('user-id', {
        amount: 10000,
        termMonths: 12,
        annualRate: 12,
      });

      expect(result.id).toBe('sim-1');
      expect(result.amount).toBe(10000);
      expect(result.termMonths).toBe(12);
      expect(result.monthlyPayment).toBe(888.49);
      expect(result.schedule).toHaveLength(2);
      expect(result.createdAt).toBe('2024-01-15T00:00:00.000Z');
    });
  });

  describe('scenario 2: customer not found', () => {
    it('throws NotFoundException', async () => {
      mockRepo.findByUserId.mockResolvedValue(null);

      await expect(
        handler.execute('user-id', { amount: 10000, termMonths: 12, annualRate: 12 }),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.loanSimulation.create).not.toHaveBeenCalled();
    });
  });
});
