import { RegisterPaymentHandler, type RegisterPaymentInput, type RegisterPaymentResponse } from './register-payment.handler';
import {
  InvalidPaymentAmountError,
  LoanNotFoundError,
  LoanAlreadyPaidError,
  NoPendingInstallmentsError,
  PartialPaymentNotSupportedError,
} from '../../domain/loan.errors';
import { Loan } from '../../domain/loan.entity';
import { Installment } from '../../domain/installment.entity';
import type { LoanRepository } from '../../domain/loan.repository';
import type { InstallmentRepository } from '../../domain/loan.repository';
import type { PrismaService } from '../../../shared/prisma/prisma.service';

function createLoan(overrides: Partial<Loan> = {}): Loan {
  return new Loan(
    overrides.id ?? 'loan-1',
    'app-1',
    'customer-1',
    10000,
    12,
    12,
    888.49,
    661.85,
    10661.85,
    overrides.outstandingBalance ?? 9211.51,
    (overrides.status ?? 'ACTIVE') as 'ACTIVE' | 'CLOSED' | 'DEFAULTED',
    '2024-01-15T00:00:00.000Z',
    '2024-02-15T00:00:00.000Z',
    '2024-02-15T00:00:00.000Z',
    null,
    '2024-01-15T00:00:00.000Z',
    '2024-01-15T00:00:00.000Z',
  );
}

function createInstallment(overrides: Partial<Installment> = {}): Installment {
  return new Installment(
    overrides.id ?? 'inst-1',
    'loan-1',
    overrides.installmentNumber ?? 1,
    '2024-02-15T00:00:00.000Z',
    overrides.principalAmount ?? 788.49,
    overrides.interestAmount ?? 100,
    overrides.totalAmount ?? 888.49,
    0,
    0,
    0,
    (overrides.status ?? 'PENDING') as 'PENDING' | 'PAID' | 'OVERDUE' | 'DEFAULTED',
    null,
    '2024-01-15T00:00:00.000Z',
    '2024-01-15T00:00:00.000Z',
  );
}

const defaultInput: RegisterPaymentInput = {
  loanId: 'loan-1',
  amount: 888.49,
  method: 'CASH',
};

describe('RegisterPaymentHandler', () => {
  let handler: RegisterPaymentHandler;
  let mockLoanRepo: jest.Mocked<LoanRepository>;
  let mockInstallmentRepo: jest.Mocked<InstallmentRepository>;
  let mockPrisma: {
    $transaction: jest.Mock;
  };

  function mockTx() {
    return {
      installment: { update: jest.fn(), findFirst: jest.fn() },
      loanTransaction: { create: jest.fn() },
      loan: { update: jest.fn() },
    };
  }

  beforeEach(() => {
    mockLoanRepo = {
      findById: jest.fn(),
      findByCustomerId: jest.fn(),
      findByApplicationId: jest.fn(),
      save: jest.fn(),
      updateStatus: jest.fn(),
      updateOutstandingBalance: jest.fn(),
    };

    mockInstallmentRepo = {
      findByLoanId: jest.fn(),
      findNextPending: jest.fn(),
      markAsPaid: jest.fn(),
      countByStatus: jest.fn(),
    };

    mockPrisma = {
      $transaction: jest.fn(),
    };

    handler = new RegisterPaymentHandler(
      mockLoanRepo,
      mockInstallmentRepo,
      mockPrisma as unknown as jest.Mocked<PrismaService>,
    );
  });

  describe('scenario: successful single installment payment', () => {
    it('pays the first pending installment, creates transaction, reduces balance', async () => {
      const loan = createLoan({ outstandingBalance: 9211.51 });
      const inst1 = createInstallment({ id: 'inst-1', installmentNumber: 1, totalAmount: 888.49, principalAmount: 788.49, interestAmount: 100 });
      const inst2 = createInstallment({ id: 'inst-2', installmentNumber: 2, totalAmount: 888.49, principalAmount: 788.49, interestAmount: 100, status: 'PENDING' });

      mockLoanRepo.findById.mockResolvedValue(loan);
      mockInstallmentRepo.findByLoanId.mockResolvedValue([inst1, inst2]);

      const tx = mockTx();
      mockPrisma.$transaction.mockImplementation((cb: (tx: unknown) => Promise<RegisterPaymentResponse>) => cb(tx));

      const result = await handler.execute(defaultInput);

      expect(result.transaction.type).toBe('PAYMENT');
      expect(result.transaction.amount).toBe(888.49);
      expect(result.installmentsPaid).toHaveLength(1);
      expect(result.installmentsPaid[0].id).toBe('inst-1');
      expect(result.installmentsPaid[0].status).toBe('PAID');
      expect(result.loanStatus).toBe('ACTIVE');
      expect(result.outstandingBalance).toBe(8423.02); // 9211.51 - 788.49

      expect(tx.installment.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'inst-1' }, data: expect.objectContaining({ status: 'PAID' }) }),
      );
      expect(tx.loanTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ type: 'PAYMENT', amount: 888.49 }) }),
      );
      expect(tx.loan.update).toHaveBeenCalled();
    });
  });

  describe('scenario: payment covering two installments of many', () => {
    it('pays both installments and decrements balance without closing loan', async () => {
      const loan = createLoan({ outstandingBalance: 10000 });
      const inst1 = createInstallment({ id: 'inst-1', installmentNumber: 1, totalAmount: 888.49, principalAmount: 788.49, interestAmount: 100 });
      const inst2 = createInstallment({ id: 'inst-2', installmentNumber: 2, totalAmount: 888.49, principalAmount: 796.37, interestAmount: 92.12 });
      const inst3 = createInstallment({ id: 'inst-3', installmentNumber: 3, totalAmount: 888.49, principalAmount: 804.83, interestAmount: 83.66, status: 'PENDING' });

      mockLoanRepo.findById.mockResolvedValue(loan);
      mockInstallmentRepo.findByLoanId.mockResolvedValue([inst1, inst2, inst3]);

      const tx = mockTx();
      const mockFindFirst = jest.fn().mockResolvedValue({ dueDate: new Date('2024-04-15') });
      tx.installment.findFirst = mockFindFirst;
      mockPrisma.$transaction.mockImplementation((cb: (tx: unknown) => Promise<RegisterPaymentResponse>) => cb(tx));

      const result = await handler.execute({ ...defaultInput, amount: 1776.98 });

      expect(result.installmentsPaid).toHaveLength(2);
      expect(result.outstandingBalance).toBe(8415.14); // 10000 - 788.49 - 796.37
      expect(result.loanStatus).toBe('ACTIVE');
    });
  });

  describe('scenario: overdue installment payment', () => {
    it('marks overdue installment as PAID', async () => {
      const loan = createLoan();
      const inst1 = createInstallment({ id: 'inst-1', installmentNumber: 1, totalAmount: 888.49, principalAmount: 788.49, status: 'OVERDUE' });

      mockLoanRepo.findById.mockResolvedValue(loan);
      mockInstallmentRepo.findByLoanId.mockResolvedValue([inst1]);

      const tx = mockTx();
      mockPrisma.$transaction.mockImplementation((cb: (tx: unknown) => Promise<RegisterPaymentResponse>) => cb(tx));

      const result = await handler.execute(defaultInput);

      expect(result.installmentsPaid).toHaveLength(1);
      expect(result.installmentsPaid[0].status).toBe('PAID');
      expect(tx.installment.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'inst-1' }, data: expect.objectContaining({ status: 'PAID' }) }),
      );
    });
  });

  describe('scenario: last installment closes loan', () => {
    it('marks all installments PAID and closes the loan', async () => {
      const loan = createLoan({ outstandingBalance: 788.49 });
      const lastInst = createInstallment({ id: 'inst-last', installmentNumber: 12, totalAmount: 888.49, principalAmount: 788.49, interestAmount: 100 });

      mockLoanRepo.findById.mockResolvedValue(loan);
      mockInstallmentRepo.findByLoanId.mockResolvedValue([lastInst]);

      const tx = mockTx();
      mockPrisma.$transaction.mockImplementation((cb: (tx: unknown) => Promise<RegisterPaymentResponse>) => cb(tx));

      const result = await handler.execute(defaultInput);

      expect(result.installmentsPaid).toHaveLength(1);
      expect(result.loanStatus).toBe('CLOSED');
      expect(result.outstandingBalance).toBe(0);
      expect(tx.loan.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'CLOSED', outstandingBalance: 0 }),
        }),
      );
    });
  });

  describe('scenario: partial payment', () => {
    it('throws PartialPaymentNotSupportedError when amount < installment total', async () => {
      const loan = createLoan();
      const inst1 = createInstallment({ id: 'inst-1', totalAmount: 888.49 });

      mockLoanRepo.findById.mockResolvedValue(loan);
      mockInstallmentRepo.findByLoanId.mockResolvedValue([inst1]);

      await expect(handler.execute({ ...defaultInput, amount: 500 })).rejects.toThrow(PartialPaymentNotSupportedError);
    });
  });

  describe('scenario: zero amount', () => {
    it('throws InvalidPaymentAmountError', async () => {
      await expect(handler.execute({ ...defaultInput, amount: 0 })).rejects.toThrow(InvalidPaymentAmountError);
    });
  });

  describe('scenario: negative amount', () => {
    it('throws InvalidPaymentAmountError', async () => {
      await expect(handler.execute({ ...defaultInput, amount: -100 })).rejects.toThrow(InvalidPaymentAmountError);
    });
  });

  describe('scenario: loan not found', () => {
    it('throws LoanNotFoundError', async () => {
      mockLoanRepo.findById.mockResolvedValue(null);

      await expect(handler.execute(defaultInput)).rejects.toThrow(LoanNotFoundError);
    });
  });

  describe('scenario: loan already closed', () => {
    it('throws LoanAlreadyPaidError', async () => {
      const loan = createLoan({ status: 'CLOSED' });
      mockLoanRepo.findById.mockResolvedValue(loan);

      await expect(handler.execute(defaultInput)).rejects.toThrow(LoanAlreadyPaidError);
    });
  });

  describe('scenario: no pending installments', () => {
    it('throws NoPendingInstallmentsError when all installments are PAID', async () => {
      const loan = createLoan();
      const paidInst = createInstallment({ status: 'PAID' });

      mockLoanRepo.findById.mockResolvedValue(loan);
      mockInstallmentRepo.findByLoanId.mockResolvedValue([paidInst]);

      await expect(handler.execute(defaultInput)).rejects.toThrow(NoPendingInstallmentsError);
    });
  });

  describe('scenario: stores notes and reference in transaction', () => {
    it('includes method and notes in description, reference in reference field', async () => {
      const loan = createLoan();
      const inst1 = createInstallment({ id: 'inst-1', totalAmount: 888.49, principalAmount: 788.49 });

      mockLoanRepo.findById.mockResolvedValue(loan);
      mockInstallmentRepo.findByLoanId.mockResolvedValue([inst1]);

      const tx = mockTx();
      mockPrisma.$transaction.mockImplementation((cb: (tx: unknown) => Promise<RegisterPaymentResponse>) => cb(tx));

      await handler.execute({
        ...defaultInput,
        method: 'TRANSFER',
        reference: 'REC-001',
        notes: 'Pago adelantado',
      });

      expect(tx.loanTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            description: 'Pago via TRANSFER. Pago adelantado',
            reference: 'REC-001',
          }),
        }),
      );
    });
  });
});
