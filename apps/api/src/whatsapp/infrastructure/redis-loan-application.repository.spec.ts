import { RedisLoanApplicationRepository } from './redis-loan-application.repository';
import { LoanApplication } from '../domain/loan-application.entity';

function createMockRedis() {
  const store = new Map<string, { value: string; ttl: number; expiresAt: number }>();
  return {
    get: jest.fn(async (key: string) => {
      const entry = store.get(key);
      if (!entry) return null;
      if (Date.now() > entry.expiresAt) {
        store.delete(key);
        return null;
      }
      return entry.value;
    }),
    setex: jest.fn(async (key: string, ttl: number, value: string) => {
      store.set(key, { value, ttl, expiresAt: Date.now() + ttl * 1000 });
    }),
    del: jest.fn(async (key: string) => {
      store.delete(key);
      return 1;
    }),
    keys: jest.fn(async (pattern: string) => {
      const prefix = pattern.replace('*', '');
      return [...store.keys()].filter((k) => k.startsWith(prefix));
    }),
  };
}

describe('RedisLoanApplicationRepository', () => {
  let repo: RedisLoanApplicationRepository;
  let mockRedis: ReturnType<typeof createMockRedis>;

  beforeEach(() => {
    mockRedis = createMockRedis();
    repo = new RedisLoanApplicationRepository(mockRedis as any);
  });

  describe('save and findByPhone', () => {
    it('persists a loan application and retrieves it', async () => {
      const app = LoanApplication.create({
        phone: '+59171234567',
        amount: 5000,
        termMonths: 12,
        purpose: 'Negocio',
      });
      await repo.save(app);

      const retrieved = await repo.findByPhone('+59171234567');
      expect(retrieved).not.toBeNull();
      expect(retrieved!.phone).toBe('+59171234567');
      expect(retrieved!.amount).toBe(5000);
      expect(retrieved!.termMonths).toBe(12);
      expect(retrieved!.purpose).toBe('Negocio');
      expect(retrieved!.status).toBe('draft');
      expect(retrieved!.id).toBeDefined();
    });

    it('returns null for non-existent phone', async () => {
      const result = await repo.findByPhone('+59170000000');
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('finds a loan application by ID', async () => {
      const app = LoanApplication.create({
        phone: '+59171234567',
        amount: 5000,
        termMonths: 12,
        purpose: 'Negocio',
      });
      await repo.save(app);

      const retrieved = await repo.findById(app.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(app.id);
    });

    it('returns null when ID does not exist', async () => {
      const result = await repo.findById('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('overwrite', () => {
    it('overwrites an existing loan application for the same phone', async () => {
      const app1 = LoanApplication.create({
        phone: '+59171234567',
        amount: 3000,
        termMonths: 6,
        purpose: 'Salud',
      });
      await repo.save(app1);

      const app2 = LoanApplication.create({
        phone: '+59171234567',
        amount: 10000,
        termMonths: 24,
        purpose: 'Educación',
      });
      await repo.save(app2);

      const retrieved = await repo.findByPhone('+59171234567');
      expect(retrieved!.amount).toBe(10000);
      expect(retrieved!.purpose).toBe('Educación');
    });
  });
});
