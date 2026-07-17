import { AIService } from './ai-http.service';
import type { Redis } from 'ioredis';

function createMockRedis(): jest.Mocked<Redis> {
  const store = new Map<string, { value: number; ttl: number }>();
  return {
    incr: jest.fn(async (key: string) => {
      const current = store.get(key);
      const next = (current?.value ?? 0) + 1;
      store.set(key, { value: next, ttl: 300 });
      return next;
    }),
    expire: jest.fn(async () => 1),
  } as unknown as jest.Mocked<Redis>;
}

describe('AIService', () => {
  let service: AIService;
  let mockRedis: jest.Mocked<Redis>;

  beforeEach(() => {
    mockRedis = createMockRedis();
    service = new AIService(
      mockRedis,
      { get: jest.fn((key: string) => {
        if (key === 'AI_API_KEY') return 'test-key';
        if (key === 'AI_API_URL') return 'https://api.example.com/chat';
        if (key === 'AI_MODEL') return 'gpt-4o-mini';
        return undefined;
      }),
        getOrThrow: jest.fn((key: string) => {
          if (key === 'AI_API_KEY') return 'test-key';
          throw new Error(`Missing env var: ${key}`);
        }),
      } as any,
    );
  });

  describe('rate limiting', () => {
    it('returns null when rate limit exceeded', async () => {
      // Simulate rate limit: make incr return > 10
      mockRedis.incr.mockResolvedValue(11);
      const result = await service.classifyIntent('test message', []);
      expect(result).toBeNull();
    });
  });

  describe('AI call', () => {
    it('returns null when AI API fails (timeout/error)', async () => {
      // Rate limit OK, but fetch will fail in test env
      mockRedis.incr.mockResolvedValue(1);
      const result = await service.classifyIntent('test message', []);
      // Should fall back gracefully
      expect(result).toBeNull();
    });
  });
});