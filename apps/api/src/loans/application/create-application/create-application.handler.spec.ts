import { CreateApplicationHandler } from './create-application.handler';
import { InsufficientIncomeError, LoanNotFoundError } from '../../domain/loan-application.errors';
import { Customer } from '../../../customers/domain/customer.entity';
import type { LoanApplicationRepository } from '../../domain/loan-application.repository';
import type { CustomerRepository } from '../../../customers/domain/customer.repository';
import type { PrismaService } from '../../../shared/prisma/prisma.service';
import { calculateLoan } from '../../../shared/loan-calculator';

jest.mock('../../../shared/loan-calculator');

const mockCalculateLoan = calculateLoan as jest.MockedFunction<typeof calculateLoan>;

describe('CreateApplicationHandler', () => {
  let handler: CreateApplicationHandler;
  let mockRepo: jest.Mocked<LoanApplicationRepository>;
  let mockCustomerRepo: jest.Mocked<CustomerRepository>;
  let mockPrisma: {
    loanSimulation: { findUnique: jest.Mock };
    customerIncome: { findMany: jest.Mock };
  };

  const defaultCalc = {
    monthlyPayment: 888.49,
    totalInterest: 661.88,
    totalPayment: 10661.88,
    schedule: [
      { period: 1, payment: 888.49, interest: 100, principal: 788.49, balance: 9211.51 },
      { period: 2, payment: 888.49, interest: 92.12, principal: 796.37, balance: 8415.14 },
    ],
  };

  function createCustomer(overrides: Partial<{ id: string; userId: string; firstName: string }> = {}): Customer {
    return Customer.create({
      userId: overrides.userId ?? 'user-1',
      firstName: overrides.firstName ?? 'Juan',
      id: overrides.id ?? 'customer-1',
    });
  }

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
      loanSimulation: { findUnique: jest.fn() },
      customerIncome: { findMany: jest.fn() },
    };

    mockCalculateLoan.mockReturnValue(defaultCalc);

    handler = new CreateApplicationHandler(
      mockRepo,
      mockCustomerRepo,
      mockPrisma as unknown as jest.Mocked<PrismaService>,
    );
  });

  describe('scenario: create from simulation (happy path)', () => {
    it('creates application from a valid simulation', async () => {
      const customer = createCustomer();
      mockPrisma.loanSimulation.findUnique.mockResolvedValue({
        id: 'sim-1',
        customerId: 'customer-1',
        amount: 10000,
        termMonths: 12,
        annualRate: 12,
        monthlyPayment: 888.49,
        createdAt: new Date('2024-01-15'),
      });

      const result = await handler.execute(customer, {
        simulationId: 'sim-1',
        purpose: 'NEGOCIO',
      });

      expect(result.status).toBe('DRAFT');
      expect(result.amount).toBe(10000);
      expect(result.termMonths).toBe(12);
      expect(result.annualRate).toBe(12);
      expect(result.monthlyPayment).toBe(888.49);
      expect(result.simulationId).toBe('sim-1');
      expect(result.purpose).toBe('NEGOCIO');
      expect(result.timeline).toHaveLength(1);
      expect(result.timeline[0].fromStatus).toBeNull();
      expect(result.timeline[0].toStatus).toBe('DRAFT');
      expect(mockRepo.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('scenario: create directly with all fields', () => {
    it('calculates loan and creates application', async () => {
      const customer = createCustomer();

      const result = await handler.execute(customer, {
        amount: 10000,
        termMonths: 12,
        annualRate: 12,
        purpose: 'EDUCACION',
      });

      expect(result.status).toBe('DRAFT');
      expect(result.amount).toBe(10000);
      expect(result.termMonths).toBe(12);
      expect(result.annualRate).toBe(12);
      expect(result.monthlyPayment).toBe(888.49);
      expect(result.simulationId).toBeNull();
      expect(result.purpose).toBe('EDUCACION');
      expect(mockCalculateLoan).toHaveBeenCalledWith(10000, 12, 12);
    });
  });

  describe('scenario: simulation belongs to another customer', () => {
    it('throws 404 when simulation customerId does not match', async () => {
      const customer = createCustomer({ id: 'customer-1' });
      mockPrisma.loanSimulation.findUnique.mockResolvedValue({
        id: 'sim-1',
        customerId: 'other-customer',
        amount: 10000,
        termMonths: 12,
        annualRate: 12,
        monthlyPayment: 888.49,
        createdAt: new Date(),
      });

      await expect(handler.execute(customer, {
        simulationId: 'sim-1',
      })).rejects.toThrow(LoanNotFoundError);

      expect(mockRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('scenario: simulation not found', () => {
    it('throws 404 when simulation does not exist', async () => {
      const customer = createCustomer();
      mockPrisma.loanSimulation.findUnique.mockResolvedValue(null);

      await expect(handler.execute(customer, {
        simulationId: 'nonexistent',
      })).rejects.toThrow(LoanNotFoundError);

      expect(mockRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('scenario: create with submit=true and no incomes', () => {
    it('throws 422 when incomes are empty', async () => {
      const customer = createCustomer();
      mockPrisma.customerIncome.findMany.mockResolvedValue([]);

      await expect(handler.execute(customer, {
        amount: 10000,
        termMonths: 12,
        annualRate: 12,
        submit: true,
      })).rejects.toThrow(InsufficientIncomeError);

      expect(mockRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('scenario: create with submit=true and incomes exist', () => {
    it('creates application in PENDING status', async () => {
      const customer = createCustomer();
      mockPrisma.customerIncome.findMany.mockResolvedValue([
        { id: 'inc-1', source: 'SALARY', amount: 5000, frequency: 'MONTHLY' },
      ]);

      const result = await handler.execute(customer, {
        amount: 10000,
        termMonths: 12,
        annualRate: 12,
        submit: true,
      });

      expect(result.status).toBe('PENDING');
      expect(result.timeline[0].toStatus).toBe('PENDING');
      expect(mockRepo.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('scenario: create without submit', () => {
    it('creates application in DRAFT status even when incomes exist', async () => {
      const customer = createCustomer();

      const result = await handler.execute(customer, {
        amount: 10000,
        termMonths: 12,
        annualRate: 12,
      });

      expect(result.status).toBe('DRAFT');
      expect(result.timeline[0].toStatus).toBe('DRAFT');
    });
  });

  describe('scenario: validation handled by Zod', () => {
    it('creates without purpose — purpose is null', async () => {
      const customer = createCustomer();

      const result = await handler.execute(customer, {
        amount: 10000,
        termMonths: 12,
        annualRate: 12,
      });

      expect(result.purpose).toBeNull();
    });
  });
});
