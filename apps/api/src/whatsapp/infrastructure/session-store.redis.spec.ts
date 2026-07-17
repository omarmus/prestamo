import { ChatbotSessionRedisStore } from './session-store.redis';
import { ChatbotSession } from '../domain/chatbot-session.entity';

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
  };
}

describe('ChatbotSessionRedisStore', () => {
  let store: ChatbotSessionRedisStore;
  let mockRedis: ReturnType<typeof createMockRedis>;

  beforeEach(() => {
    mockRedis = createMockRedis();
    store = new ChatbotSessionRedisStore(mockRedis as any);
  });

  describe('save and get', () => {
    it('persists a session and retrieves it', async () => {
      const session = ChatbotSession.create('+59171234567', 'HELP');
      await store.save(session);

      const retrieved = await store.get('+59171234567');
      expect(retrieved).not.toBeNull();
      expect(retrieved!.phone).toBe('+59171234567');
      expect(retrieved!.intent).toBe('HELP');
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'session:+59171234567',
        1800,
        expect.any(String),
      );
    });

    it('overwrites an existing session', async () => {
      const session1 = ChatbotSession.create('+59171234567', 'HELP');
      await store.save(session1);

      const session2 = ChatbotSession.create('+59171234567', 'REGISTER');
      await store.save(session2);

      const retrieved = await store.get('+59171234567');
      expect(retrieved!.intent).toBe('REGISTER');
    });

    it('returns null for non-existent phone', async () => {
      const result = await store.get('+59170000000');
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('removes a session from Redis', async () => {
      const session = ChatbotSession.create('+59171234567', 'HELP');
      await store.save(session);

      await store.delete('+59171234567');

      const retrieved = await store.get('+59171234567');
      expect(retrieved).toBeNull();
      expect(mockRedis.del).toHaveBeenCalledWith('session:+59171234567');
    });
  });
});
