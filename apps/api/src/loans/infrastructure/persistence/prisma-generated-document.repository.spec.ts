import { PrismaGeneratedDocumentRepository } from './prisma-generated-document.repository';
import type { PrismaService } from '../../../shared/prisma/prisma.service';
import type { GeneratedDocumentRow } from '../../domain/generated-document.repository';

function createPrismaMock() {
  return {
    generatedDocument: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  } as unknown as jest.Mocked<PrismaService>;
}

describe('PrismaGeneratedDocumentRepository', () => {
  let repo: PrismaGeneratedDocumentRepository;
  let prisma: jest.Mocked<PrismaService>;

  const mockRow: GeneratedDocumentRow = {
    id: 'doc-1',
    loanId: 'loan-1',
    type: 'LOAN_CONTRACT',
    filePath: '/uploads/contracts/contract-loan-1.pdf',
    mimeType: 'application/pdf',
    metadata: { amount: 10000 },
    createdAt: new Date('2024-01-15T00:00:00.000Z'),
  };

  beforeEach(() => {
    prisma = createPrismaMock();
    repo = new PrismaGeneratedDocumentRepository(prisma);
  });

  describe('findByLoanId', () => {
    it('returns row when document exists', async () => {
      prisma.generatedDocument.findUnique.mockResolvedValue(mockRow);

      const result = await repo.findByLoanId('loan-1');

      expect(result).toEqual(mockRow);
      expect(prisma.generatedDocument.findUnique).toHaveBeenCalledWith({
        where: { loanId: 'loan-1' },
      });
    });

    it('returns null when no document exists', async () => {
      prisma.generatedDocument.findUnique.mockResolvedValue(null);

      const result = await repo.findByLoanId('loan-unknown');

      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    const saveInput = {
      loanId: 'loan-1',
      type: 'LOAN_CONTRACT',
      filePath: '/uploads/contracts/contract-loan-1.pdf',
      mimeType: 'application/pdf',
      metadata: { amount: 10000 },
    };

    it('creates document and returns full row with generated id and createdAt', async () => {
      const expectedRow: GeneratedDocumentRow = {
        id: 'new-id',
        ...saveInput,
        createdAt: new Date('2024-01-15T00:00:00.000Z'),
      };
      prisma.generatedDocument.create.mockResolvedValue(expectedRow);

      const result = await repo.save(saveInput);

      expect(result).toEqual(expectedRow);
      expect(prisma.generatedDocument.create).toHaveBeenCalledWith({
        data: saveInput,
      });
    });
  });
});
