import { ContractTemplateRegistry } from './contract-template-registry';
import type { ContractTemplateData } from './loan-contract.template';
import { buildLoanContractPdf } from './loan-contract.template';

describe('ContractTemplateRegistry', () => {
  let registry: ContractTemplateRegistry;

  beforeEach(() => {
    registry = new ContractTemplateRegistry();
  });

  it('registers and retrieves a template builder', () => {
    registry.register('loan-contract', buildLoanContractPdf);
    expect(registry.get('loan-contract')).toBe(buildLoanContractPdf);
  });

  it('returns undefined for an unregistered template type', () => {
    expect(registry.get('unknown')).toBeUndefined();
  });

  it('checks if a template type is registered', () => {
    registry.register('loan-contract', buildLoanContractPdf);
    expect(registry.has('loan-contract')).toBe(true);
    expect(registry.has('unknown')).toBe(false);
  });

  it('overwrites an existing registration', () => {
    const fn1 = async () => Buffer.from('a');
    const fn2 = async () => Buffer.from('b');
    registry.register('loan-contract', fn1);
    registry.register('loan-contract', fn2);
    expect(registry.get('loan-contract')).toBe(fn2);
  });

  it('executes a registered template and produces a PDF buffer', async () => {
    registry.register('loan-contract', buildLoanContractPdf);
    const builder = registry.get('loan-contract')!;
    const data: ContractTemplateData = {
      loanId: 'test-1',
      amount: 5000,
      termMonths: 6,
      annualRate: 15,
      monthlyPayment: 868.18,
      totalInterest: 209.08,
      totalPayment: 5209.08,
      disbursedAt: new Date('2024-06-01'),
      customer: { firstName: 'Ana', lastName: 'García', documentNumber: '87654321' },
      lender: { name: 'Financiera Test' },
      installments: [
        { number: 1, dueDate: new Date('2024-07-01'), principal: 800, interest: 68.18, total: 868.18 },
      ],
    };
    const buffer = await builder(data);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.slice(0, 5).toString('ascii')).toBe('%PDF-');
  });
});
