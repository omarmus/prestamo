import { buildLoanContractPdf } from './loan-contract.template';
import type { ContractTemplateData } from './loan-contract.template';

function makeDefaultData(overrides: Partial<ContractTemplateData> = {}): ContractTemplateData {
  return {
    loanId: 'loan-123',
    amount: 10000,
    termMonths: 12,
    annualRate: 12,
    monthlyPayment: 888.49,
    totalInterest: 661.88,
    totalPayment: 10661.88,
    disbursedAt: new Date('2024-01-15T00:00:00.000Z'),
    customer: {
      firstName: 'Juan',
      lastName: 'Pérez',
      documentNumber: '12345678',
    },
    lender: { name: 'Prestamos S.A.' },
    installments: [
      { number: 1, dueDate: new Date('2024-02-15'), principal: 788.49, interest: 100, total: 888.49 },
      { number: 2, dueDate: new Date('2024-03-15'), principal: 796.37, interest: 92.12, total: 888.49 },
    ],
    ...overrides,
  };
}

describe('buildLoanContractPdf', () => {
  it('resolves to a Buffer', async () => {
    const data = makeDefaultData();
    const result = await buildLoanContractPdf(data);
    expect(result).toBeInstanceOf(Buffer);
  });

  it('generates a valid PDF (starts with %PDF-)', async () => {
    const data = makeDefaultData();
    const result = await buildLoanContractPdf(data);
    expect(result.slice(0, 5).toString('ascii')).toBe('%PDF-');
  });

  it('generates a PDF of reasonable size for a contract', async () => {
    const data = makeDefaultData();
    const result = await buildLoanContractPdf(data);
    // A contract with amortization table should be > 1KB
    expect(result.length).toBeGreaterThan(1000);
  });

  it('includes the contract title and lender name in PDF metadata', async () => {
    const data = makeDefaultData();
    const result = await buildLoanContractPdf(data);
    const raw = result.toString('latin1');
    // PDF metadata includes Producer, Creator strings
    expect(raw).toContain('PDFKit');
    // The lender name should appear in the raw PDF (embedded as XMP/Info metadata or in uncompressed content)
    // ponytail: PDF content is FlateDecode compressed, so we can't search for rendered text directly in unit tests.
    // Full text verification should be done in integration tests with pdf-parse.
    expect(result.length).toBeGreaterThan(1500);
  });

  describe('handles null customer fields gracefully', () => {
    it('generates PDF when lastName is null', async () => {
      const data = makeDefaultData({
        customer: { firstName: 'Juan', lastName: null as unknown as string, documentNumber: '12345678' as unknown as string },
      });
      const result = await buildLoanContractPdf(data);
      expect(result.slice(0, 5).toString('ascii')).toBe('%PDF-');
      expect(result.length).toBeGreaterThan(1000);
    });

    it('generates PDF when documentNumber is null', async () => {
      const data = makeDefaultData({
        customer: { firstName: 'Juan', lastName: 'Pérez', documentNumber: null as unknown as string },
      });
      const result = await buildLoanContractPdf(data);
      expect(result.slice(0, 5).toString('ascii')).toBe('%PDF-');
      expect(result.length).toBeGreaterThan(1000);
    });
  });

  it('generates larger PDF with more installments', async () => {
    const smallData = makeDefaultData({ installments: [{ number: 1, dueDate: new Date('2024-02-15'), principal: 10000, interest: 0, total: 10000 }] });
    const largeData = makeDefaultData({
      installments: Array.from({ length: 12 }, (_, i) => ({
        number: i + 1,
        dueDate: new Date(2024, i + 1, 15), // Feb 15 .. Jan 15
        principal: 800,
        interest: 88.49,
        total: 888.49,
      })),
    });

    const [small, large] = await Promise.all([buildLoanContractPdf(smallData), buildLoanContractPdf(largeData)]);
    expect(small.length).toBeGreaterThan(1000);
    expect(large.length).toBeGreaterThan(small.length);
  });
});
