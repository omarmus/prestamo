import { ContractStorageService } from './contract-storage.service';
import * as fs from 'fs';
import * as path from 'path';

// ponytail: Use real temp dir for integration-like test — avoids mocking fs.
// Replace with mock fs if tests become slow.
describe('ContractStorageService', () => {
  const testBaseDir = path.join(process.cwd(), 'tmp-test-contracts');
  let service: ContractStorageService;

  beforeEach(() => {
    // Clean up any previous test data
    fs.rmSync(testBaseDir, { recursive: true, force: true });
    service = new ContractStorageService(testBaseDir);
  });

  afterAll(() => {
    fs.rmSync(testBaseDir, { recursive: true, force: true });
  });

  describe('save', () => {
    it('stores file under contracts/{loanId}/{fileName}', async () => {
      const buffer = Buffer.from('test-pdf-content');
      const filePath = await service.save('loan-123', buffer, 'contrato-loan-123.pdf');

      expect(filePath).toContain('contracts/loan-123/contrato-loan-123.pdf');
      expect(fs.existsSync(filePath)).toBe(true);
      expect(fs.readFileSync(filePath)).toEqual(buffer);
    });

    it('creates the loan directory if it does not exist', async () => {
      const buffer = Buffer.from('content');
      const filePath = await service.save('new-loan', buffer, 'doc.pdf');

      const dir = path.dirname(filePath);
      expect(fs.existsSync(dir)).toBe(true);
    });

    it('returns the absolute path', async () => {
      const buffer = Buffer.from('content');
      const filePath = await service.save('loan-123', buffer, 'doc.pdf');

      expect(path.isAbsolute(filePath)).toBe(true);
    });
  });

  describe('get', () => {
    it('returns the file buffer when file exists', async () => {
      const buffer = Buffer.from('test-pdf-content');
      const filePath = await service.save('loan-123', buffer, 'doc.pdf');

      const result = await service.get(filePath);

      expect(result).toEqual(buffer);
    });

    it('throws when file does not exist', async () => {
      await expect(service.get('/nonexistent/path.pdf')).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('removes the file', async () => {
      const buffer = Buffer.from('content');
      const filePath = await service.save('loan-123', buffer, 'doc.pdf');

      expect(fs.existsSync(filePath)).toBe(true);

      await service.delete(filePath);

      expect(fs.existsSync(filePath)).toBe(false);
    });

    it('does not throw when file does not exist', async () => {
      await expect(service.delete('/nonexistent/path.pdf')).resolves.not.toThrow();
    });
  });
});
