import { Test, type TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { Redis } from 'ioredis';

import { RefreshTokenServiceImpl } from '../../../src/identity/infrastructure/auth/refresh-token.service';
import { REDIS_CLIENT } from '../../../src/identity/infrastructure/redis.provider';
import { PrismaService } from '../../../src/identity/infrastructure/persistence/prisma/prisma.service';
import { REFRESH_TOKEN_SERVICE } from '../../../src/identity/identity.module';

/**
 * Integration tests for RefreshTokenService.
 *
 * Prerequisites:
 *   - Docker Compose running: `docker compose up -d`
 *   - Redis 7 available on localhost:6379 (or REDIS_URL env var)
 *   - Prisma migration applied, seed run
 *
 * These tests hit a real Redis instance and database.
 */

describe('RefreshTokenService (integration)', () => {
  let module: TestingModule;
  let service: RefreshTokenServiceImpl;
  let redis: Redis;
  let prisma: PrismaService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: '../../.env',
        }),
      ],
      providers: [
        PrismaService,
        {
          provide: REDIS_CLIENT,
          useFactory: () => new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379'),
        },
        { provide: REFRESH_TOKEN_SERVICE, useClass: RefreshTokenServiceImpl },
      ],
    }).compile();

    service = module.get<RefreshTokenServiceImpl>(REFRESH_TOKEN_SERVICE);
    redis = module.get<Redis>(REDIS_CLIENT);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    // Clean up any test keys
    const keys = await redis.keys('refresh:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    const familyKeys = await redis.keys('family:*');
    if (familyKeys.length > 0) {
      await redis.del(...familyKeys);
    }
    await module.close();
  });

  describe('generate', () => {
    it('creates a valid refresh token for an existing user', async () => {
      // Need an existing user — find the seeded admin/user
      const user = await prisma.user.findFirst();
      if (!user) {
        // ponytail: skip if no users seeded — run seed first
        console.warn('No users found — run seed before this test');
        return;
      }

      const token = await service.generate(user.id);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);

      // Verify token exists in Redis
      const raw = await redis.get(`refresh:${token}`);
      expect(raw).not.toBeNull();

      const data = JSON.parse(raw!);
      expect(data.userId).toBe(user.id);
      expect(data.used).toBe(false);
    });
  });

  describe('consume', () => {
    it('marks a token as used and returns user data', async () => {
      const user = await prisma.user.findFirst();
      if (!user) return;

      const token = await service.generate(user.id);
      const result = await service.consume(token);

      expect(result).not.toBeNull();
      expect(result!.userId).toBe(user.id);
      expect(result!.familyId).toBeDefined();

      // Token should be marked as used
      const raw = await redis.get(`refresh:${token}`);
      const data = JSON.parse(raw!);
      expect(data.used).toBe(true);
    });

    it('returns null for an unknown token', async () => {
      const result = await service.consume('nonexistent-token-id');
      expect(result).toBeNull();
    });

    it('triggers family revocation on reuse', async () => {
      const user = await prisma.user.findFirst();
      if (!user) return;

      // Generate and consume a token (first use)
      const token = await service.generate(user.id);
      const firstResult = await service.consume(token);
      expect(firstResult).not.toBeNull();

      // Reuse the same token — should return null and revoke family
      const secondResult = await service.consume(token);
      expect(secondResult).toBeNull();

      // The family key should be deleted
      const familyKey = `family:${firstResult!.familyId}`;
      const familyMembers = await redis.smembers(familyKey);
      expect(familyMembers).toHaveLength(0);
    });
  });
});
