// Mock Mastra modules to avoid ESM transform issues with pnpm
jest.mock('@mastra/core', () => ({
  Mastra: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('@mastra/core/tools', () => ({
  createTool: jest.fn().mockImplementation((config) => {
    const tool = {
      id: config.id,
      description: config.description,
      inputSchema: config.inputSchema,
      execute: config.execute,
      transform: config.transform,
    };
    return tool;
  }),
}));

jest.mock('@mastra/loggers', () => ({
  PinoLogger: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('@mastra/memory', () => ({
  Memory: jest.fn().mockImplementation(() => ({
    getThreadByResource: jest.fn(),
    waitFor: jest.fn(),
  })),
}));

jest.mock('@mastra/libsql', () => ({
  LibSQLStore: jest.fn().mockImplementation(() => ({})),
  LibSQLVector: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('@mastra/core/agent', () => ({
  Agent: jest.fn().mockImplementation((config) => ({
    name: config.name,
    id: config.id,
    instructions: config.instructions,
    model: config.model,
    tools: config.tools || {},
    memory: config.memory,
  })),
}));

jest.mock('@mastra/core/workflows', () => ({
  createStep: jest.fn().mockImplementation((config) => config),
  createWorkflow: jest.fn().mockImplementation(() => ({
    then: jest.fn().mockReturnThis(),
    commit: jest.fn(),
  })),
}));

import { Mastra } from '@mastra/core';
import { Agent } from '@mastra/core/agent';
import { createMastra } from '../index';
import { createCustomerSupportAgent } from '../agents/customer-support';
import { createRegisterCustomerTool } from '../tools/register-customer';
import { createGetCustomerByPhoneTool } from '../tools/get-customer-by-phone';
import { createCheckLoanApplicationTool } from '../tools/check-loan-application';
import { createCheckLoanStatusTool } from '../tools/check-loan-status';
import { createCheckNextInstallmentTool } from '../tools/check-next-installment';
import { createCreateLoanApplicationTool } from '../tools/create-loan-application';
import { createSimulateLoanTool } from '../tools/simulate-loan';
import type { CompleteRegistrationHandler } from '../../src/whatsapp/application/complete-registration.handler';
import type { ApplyLoanHandler } from '../../src/whatsapp/application/apply-loan.handler';
import type { ContactRepository } from '../../src/whatsapp/domain/contact-repository.port';
import type { UserRepository } from '../../src/identity/domain/user.repository';
import type { CustomerRepository } from '../../src/customers/domain/customer.repository';
import type { ActiveLoanQuery } from '../../src/loans/application/ports/active-loan-query.port';
import type { InstallmentRepository } from '../../src/loans/domain/loan.repository';

const EMPTY_CTX = undefined as never;

function makeContactRepo(overrides: Record<string, unknown> = {}): ContactRepository {
  return {
    save: jest.fn(),
    findByPhone: jest.fn().mockResolvedValue(overrides.contact ?? null),
    findById: jest.fn(),
  };
}

function makeUserRepo(overrides: Record<string, unknown> = {}): UserRepository {
  return {
    save: jest.fn(),
    findByEmail: jest.fn(),
    findByPhone: jest.fn().mockResolvedValue(overrides.user ?? null),
    findById: jest.fn(),
  };
}

function makeCustomerRepo(overrides: Record<string, unknown> = {}): CustomerRepository {
  return {
    save: jest.fn(),
    findByUserId: jest.fn().mockResolvedValue(overrides.customer ?? null),
    findById: jest.fn(),
    update: jest.fn(),
  };
}

function makeActiveLoanQuery(): ActiveLoanQuery {
  return {
    findByCustomerId: jest.fn().mockResolvedValue([]),
    findById: jest.fn(),
    findByIdAndCustomer: jest.fn(),
  };
}

function makeInstallmentRepo(): InstallmentRepository {
  return {
    findByLoanId: jest.fn(),
    findNextPending: jest.fn(),
    markAsPaid: jest.fn(),
    countByStatus: jest.fn(),
  };
}

function makeLoanAppRepo() {
  return jest.fn().mockResolvedValue(null);
}

describe('Mastra Agent — Customer Support', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCustomerSupportAgent', () => {
    it('creates an agent without errors', () => {
      const agent = createCustomerSupportAgent({
        model: 'openai/gpt-4o',
        tools: {},
      });
      expect(agent).toBeDefined();
      expect(agent.name).toBe('Asistente de Préstamos');
    });
  });

  describe('createMastra', () => {
    function makeDeps() {
      const handler = { execute: jest.fn() };
      return {
        completeRegistrationHandler: handler as unknown as CompleteRegistrationHandler,
        contactRepository: makeContactRepo(),
        userRepository: makeUserRepo(),
        queryLoanDraftByPhone: makeLoanAppRepo(),
        customerRepository: makeCustomerRepo(),
        activeLoanQuery: makeActiveLoanQuery(),
        installmentRepository: makeInstallmentRepo(),
        applyLoanHandler: handler as unknown as ApplyLoanHandler,
      };
    }

    it('returns a valid Mastra instance', () => {
      const mastra = createMastra(makeDeps());
      expect(Mastra).toHaveBeenCalled();
      expect(mastra).toBeDefined();
    });

    it('registers all 7 tools on the agent', () => {
      createMastra(makeDeps());
      const agentMock = Agent as unknown as jest.Mock;
      const agentInstance = agentMock.mock.results[0]?.value;
      expect(agentInstance.tools).toBeDefined();
      expect(Object.keys(agentInstance.tools)).toHaveLength(7);
    });
  });

  describe('registerCustomerTool', () => {
    it('executes the handler and returns userId', async () => {
      const mockHandler = {
        execute: jest.fn().mockResolvedValue('user-abc-123'),
      };

      const tool = createRegisterCustomerTool(mockHandler as unknown as CompleteRegistrationHandler);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (tool as any).execute({ phone: '+59170000000', name: 'Juan Perez' }, EMPTY_CTX);

      expect(mockHandler.execute).toHaveBeenCalledWith(
        '+59170000000',
        'Juan Perez',
        undefined,
      );
      expect(result).toEqual({ userId: 'user-abc-123', success: true });
    });

    it('handles optional email', async () => {
      const mockHandler = {
        execute: jest.fn().mockResolvedValue('user-xyz'),
      };

      const tool = createRegisterCustomerTool(mockHandler as unknown as CompleteRegistrationHandler);
      await (tool as any).execute(
        { phone: '+59170000001', name: 'Maria Lopez', email: 'maria@example.com' },
        EMPTY_CTX,
      );

      expect(mockHandler.execute).toHaveBeenCalledWith(
        '+59170000001',
        'Maria Lopez',
        'maria@example.com',
      );
    });
  });

  describe('getCustomerByPhoneTool', () => {
    it('returns found=false when contact does not exist', async () => {
      const contactRepo = makeContactRepo({ contact: null });
      const tool = createGetCustomerByPhoneTool(contactRepo, makeUserRepo());
      const result = await (tool as any).execute({ phone: '+59170000000' }, EMPTY_CTX);
      expect(result).toEqual({ found: false, isRegistered: false });
    });

    it('returns found=true with contact details when contact exists', async () => {
      const contactRepo = makeContactRepo({
        contact: {
          id: 'contact-1', phone: '+59170000000', name: 'Juan Perez',
          userId: null, createdAt: new Date(), updatedAt: new Date(),
        },
      });
      const tool = createGetCustomerByPhoneTool(contactRepo, makeUserRepo());
      const result = await (tool as any).execute({ phone: '+59170000000' }, EMPTY_CTX);
      expect(result).toMatchObject({ found: true, name: 'Juan Perez', isRegistered: false });
    });

    it('returns isRegistered=true when contact has linked user', async () => {
      const contactRepo = makeContactRepo({
        contact: {
          id: 'contact-1', phone: '+59170000000', name: 'Juan Perez',
          userId: 'user-123', createdAt: new Date(), updatedAt: new Date(),
        },
      });
      const userRepo = makeUserRepo({
        user: { id: 'user-123', name: 'Juan Perez', email: { getValue: () => 'juan@example.com' } },
      });
      const tool = createGetCustomerByPhoneTool(contactRepo, userRepo);
      const result = await (tool as any).execute({ phone: '+59170000000' }, EMPTY_CTX);
      expect(result).toMatchObject({ found: true, name: 'Juan Perez', isRegistered: true });
    });
  });

  describe('checkLoanApplicationTool', () => {
    it('returns empty applications when no loan found', async () => {
      const queryFn = jest.fn().mockResolvedValue(null);
      const tool = createCheckLoanApplicationTool(queryFn);
      const result = await (tool as any).execute({ phone: '+59170000000' }, EMPTY_CTX);
      expect(result).toEqual({ applications: [] });
    });

    it('returns applications when loan exists', async () => {
      const queryFn = jest.fn().mockResolvedValue({
        id: 'loan-1', amount: 5000, status: 'draft',
        createdAt: new Date('2025-01-15'),
      });
      const tool = createCheckLoanApplicationTool(queryFn);
      const result = await (tool as any).execute({ phone: '+59170000000' }, EMPTY_CTX);
      expect(result.applications).toHaveLength(1);
      expect(result.applications[0]).toMatchObject({
        id: 'loan-1', amount: 5000, status: 'draft',
      });
    });
  });

  describe('checkLoanStatusTool', () => {
    it('returns empty loans when contact not found', async () => {
      const tool = createCheckLoanStatusTool(
        makeContactRepo({ contact: null }),
        makeCustomerRepo(),
        makeActiveLoanQuery(),
      );
      const result = await (tool as any).execute({ phone: '+59170000000' }, EMPTY_CTX);
      expect(result).toEqual({ loans: [] });
    });

    it('returns empty loans when contact has no userId', async () => {
      const tool = createCheckLoanStatusTool(
        makeContactRepo({
          contact: {
            id: 'c1', phone: '+59170000000', name: 'Test',
            userId: null, createdAt: new Date(), updatedAt: new Date(),
          },
        }),
        makeCustomerRepo(),
        makeActiveLoanQuery(),
      );
      const result = await (tool as any).execute({ phone: '+59170000000' }, EMPTY_CTX);
      expect(result).toEqual({ loans: [] });
    });

    it('returns loans from ActiveLoanQuery when customer found', async () => {
      const mockQuery = makeActiveLoanQuery();
      (mockQuery.findByCustomerId as jest.Mock).mockResolvedValue([
        {
          id: 'loan-1', amount: 10000, outstandingBalance: 8000,
          status: 'ACTIVE', nextPaymentDate: '2025-02-15',
          paidInstallments: 2, totalInstallments: 12, disbursedAt: '2024-01-01',
        },
      ]);
      const tool = createCheckLoanStatusTool(
        makeContactRepo({
          contact: {
            id: 'c1', phone: '+59170000000', name: 'Test',
            userId: 'user-1', createdAt: new Date(), updatedAt: new Date(),
          },
        }),
        makeCustomerRepo({ customer: { id: 'cust-1', userId: 'user-1' } }),
        mockQuery,
      );
      const result = await (tool as any).execute({ phone: '+59170000000' }, EMPTY_CTX);
      expect(result.loans).toHaveLength(1);
      expect(result.loans[0]).toMatchObject({
        id: 'loan-1', amount: 10000, outstandingBalance: 8000, status: 'ACTIVE',
      });
    });
  });

  describe('checkNextInstallmentTool', () => {
    it('returns null when no pending installment', async () => {
      const installmentRepo = makeInstallmentRepo();
      (installmentRepo.findNextPending as jest.Mock).mockResolvedValue(null);
      const tool = createCheckNextInstallmentTool(installmentRepo);
      const result = await (tool as any).execute({ loanId: 'loan-1' }, EMPTY_CTX);
      expect(result).toBeNull();
    });

    it('returns installment details when found', async () => {
      const mockInstallment = {
        installmentNumber: 3,
        dueDate: '2025-03-15',
        totalAmount: 850.50,
        status: 'PENDING' as const,
        // Extra fields needed by the entity reference
        id: 'inst-3', loanId: 'loan-1', principalAmount: 700, interestAmount: 150.50,
        paidPrincipal: 0, paidInterest: 0, paidTotal: 0,
        paidAt: null, createdAt: '2025-01-01', updatedAt: '2025-01-01',
      };
      // Our tool uses findNextPending which returns Installment instances,
      // but the mock returns a plain object — ts-jest doesn't check at runtime
      const installmentRepo = makeInstallmentRepo();
      (installmentRepo.findNextPending as jest.Mock).mockResolvedValue(mockInstallment);
      const tool = createCheckNextInstallmentTool(installmentRepo);
      const result = await (tool as any).execute({ loanId: 'loan-1' }, EMPTY_CTX);
      expect(result).toMatchObject({
        installmentNumber: 3,
        dueDate: '2025-03-15',
        totalAmount: 850.50,
        status: 'PENDING',
      });
    });
  });

  describe('createLoanApplicationTool', () => {
    it('calls applyLoanHandler and returns result', async () => {
      const mockHandler = {
        execute: jest.fn().mockResolvedValue({
          applicationId: 'app-123',
          status: 'draft',
          message: '✅ Solicitud registrada',
        }),
      };
      const tool = createCreateLoanApplicationTool(mockHandler as unknown as ApplyLoanHandler);
      const result = await (tool as any).execute(
        { phone: '+59170000000', amount: 5000, termMonths: 12, purpose: 'Negocio' },
        EMPTY_CTX,
      );
      expect(mockHandler.execute).toHaveBeenCalledWith('+59170000000', {
        amount: 5000, termMonths: 12, purpose: 'Negocio',
      });
      expect(result).toEqual({ applicationId: 'app-123', status: 'draft' });
    });
  });

  describe('simulateLoanTool', () => {
    it('calculates monthly payment correctly', async () => {
      const tool = createSimulateLoanTool();
      const result = await (tool as any).execute(
        { amount: 10000, termMonths: 12, annualRate: 0.18 },
        EMPTY_CTX,
      );
      expect(result.monthlyPayment).toBeGreaterThan(0);
      expect(result.totalPayment).toBeGreaterThan(10000);
      expect(result.totalInterest).toBeGreaterThan(0);
      // 18% annual = 1.5% monthly on 10k for 12mo
      // Monthly payment ≈ 916.80 (French amortization)
      expect(result.monthlyPayment).toBeCloseTo(916.80, 0);
    });

    it('uses default rate when not provided', async () => {
      const original = process.env.DEFAULT_LOAN_RATE;
      delete process.env.DEFAULT_LOAN_RATE;
      const tool = createSimulateLoanTool();
      const result = await (tool as any).execute(
        { amount: 5000, termMonths: 6 },
        EMPTY_CTX,
      );
      // 18% annual = 1.5% monthly, 5k, 6mo → ~877.63
      expect(result.monthlyPayment).toBeCloseTo(877.63, 0);
      process.env.DEFAULT_LOAN_RATE = original;
    });

    it('reads custom rate from env', async () => {
      process.env.DEFAULT_LOAN_RATE = '0.12';
      const tool = createSimulateLoanTool();
      const result = await (tool as any).execute(
        { amount: 5000, termMonths: 6 },
        EMPTY_CTX,
      );
      // 12% annual = 1% monthly, 5k, 6mo → ~862.74
      expect(result.monthlyPayment).toBeCloseTo(862.74, 0);
      delete process.env.DEFAULT_LOAN_RATE;
    });
  });
});
