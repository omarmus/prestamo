import { GenerateContractService } from './generate-contract.service';
import type { ContractTemplateRegistry } from './contract-templates/contract-template-registry';
import type { ContractStorageService } from '../infrastructure/storage/contract-storage.service';
import type { GeneratedDocumentRepository, GeneratedDocumentRow } from '../domain/generated-document.repository';
import type { ContractTemplateData } from './contract-templates/loan-contract.template';

function makeTemplateData(overrides: Partial<ContractTemplateData> = {}): ContractTemplateData {
  return {
    loanId: 'loan-123',
    amount: 10000,
    termMonths: 12,
    annualRate: 12,
    monthlyPayment: 888.49,
    totalInterest: 661.88,
    totalPayment: 10661.88,
    disbursedAt: new Date('2024-01-15'),
    customer: { firstName: 'Juan', lastName: 'Pérez', documentNumber: '12345678' },
    lender: { name: 'Prestamos S.A.' },
    installments: [{ number: 1, dueDate: new Date('2024-02-15'), principal: 788.49, interest: 100, total: 888.49 }],
    ...overrides,
  };
}

describe('GenerateContractService', () => {
  let service: GenerateContractService;
  let mockRegistry: jest.Mocked<ContractTemplateRegistry>;
  let mockStorage: jest.Mocked<ContractStorageService>;
  let mockRepo: jest.Mocked<GeneratedDocumentRepository>;

  beforeEach(() => {
    mockRegistry = {
      get: jest.fn(),
      has: jest.fn(),
      register: jest.fn(),
    } as unknown as jest.Mocked<ContractTemplateRegistry>;

    mockStorage = {
      save: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<ContractStorageService>;

    const savedDoc: GeneratedDocumentRow = {
      id: 'doc-1',
      loanId: 'loan-123',
      type: 'loan-contract',
      filePath: 'uploads/contracts/loan-123/contrato-loan-123.pdf',
      mimeType: 'application/pdf',
      metadata: null,
      createdAt: new Date('2024-01-15T10:00:00Z'),
    };

    mockRepo = {
      findByLoanId: jest.fn(),
      save: jest.fn().mockResolvedValue(savedDoc),
    };

    service = new GenerateContractService(mockRegistry, mockStorage, mockRepo);
  });

  it('generates a contract and returns the document record', async () => {
    mockRegistry.get.mockReturnValue(async (data: ContractTemplateData) => Buffer.from('%PDF-mock'));
    mockStorage.save.mockResolvedValue('uploads/contracts/loan-123/contrato-loan-123.pdf');

    const result = await service.execute({
      loanId: 'loan-123',
      templateType: 'loan-contract',
      data: makeTemplateData(),
    });

    expect(result).toMatchObject({
      id: 'doc-1',
      loanId: 'loan-123',
      type: 'loan-contract',
      mimeType: 'application/pdf',
    });
  });

  it('throws for an unknown template type', async () => {
    mockRegistry.get.mockReturnValue(undefined);

    await expect(
      service.execute({
        loanId: 'loan-123',
        templateType: 'unknown',
        data: makeTemplateData(),
      }),
    ).rejects.toThrow('Unknown template type: unknown');
  });

  it('passes the template data to the builder', async () => {
    const builder = jest.fn().mockResolvedValue(Buffer.from('%PDF-mock'));
    mockRegistry.get.mockReturnValue(builder);
    mockStorage.save.mockResolvedValue('path/to/file.pdf');

    const data = makeTemplateData();
    await service.execute({ loanId: 'loan-123', templateType: 'loan-contract', data });

    expect(builder).toHaveBeenCalledWith(data);
  });

  it('saves the generated buffer to storage', async () => {
    const pdfBuffer = Buffer.from('%PDF-mock');
    mockRegistry.get.mockReturnValue(async () => pdfBuffer);
    mockStorage.save.mockResolvedValue('path/to/file.pdf');

    await service.execute({
      loanId: 'loan-123',
      templateType: 'loan-contract',
      data: makeTemplateData(),
    });

    expect(mockStorage.save).toHaveBeenCalledWith('loan-123', pdfBuffer, 'contrato-loan-123.pdf');
  });

  it('persists a document record via the repository', async () => {
    mockRegistry.get.mockReturnValue(async () => Buffer.from('%PDF-mock'));
    mockStorage.save.mockResolvedValue('uploads/contracts/loan-123/contrato-loan-123.pdf');

    await service.execute({
      loanId: 'loan-123',
      templateType: 'loan-contract',
      data: makeTemplateData(),
    });

    expect(mockRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        loanId: 'loan-123',
        type: 'loan-contract',
        mimeType: 'application/pdf',
      }),
    );
  });
});
