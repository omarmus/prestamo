import type { CanActivate } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';

import { PrismaService } from '../../../src/identity/infrastructure/persistence/prisma/prisma.service';
import { PrismaUserRepository } from '../../../src/identity/infrastructure/persistence/prisma-user.repository';
import { User } from '../../../src/identity/domain/user.entity';
import { Email } from '../../../src/identity/domain/email.value-object';
import { Phone } from '../../../src/identity/domain/phone.value-object';
import { USER_REPOSITORY } from '../../../src/identity/identity.module';

/**
 * Integration tests for PrismaUserRepository.
 *
 * Prerequisites:
 *   - Docker Compose running: `docker compose up -d`
 *   - Prisma migration applied: `pnpm --filter @prestamos/api prisma:migrate`
 *   - Seed run: `pnpm --filter @prestamos/api seed`
 *
 * These tests hit a real PostgreSQL database via PrismaService.
 */

describe('PrismaUserRepository (integration)', () => {
  let module: TestingModule;
  let repo: PrismaUserRepository;
  let prisma: PrismaService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: '../../.env',
        }),
      ],
      providers: [PrismaService, { provide: USER_REPOSITORY, useClass: PrismaUserRepository }],
    })
      // ponytail: override global guards to skip auth in integration tests
      .overrideGuard({ canActivate: true } as unknown as new () => CanActivate)
      .useValue({ canActivate: () => true })
      .compile();

    prisma = module.get<PrismaService>(PrismaService);
    repo = module.get<PrismaUserRepository>(USER_REPOSITORY);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.user.deleteMany({ where: { email: { contains: 'test-integration' } } });
  });

  describe('save', () => {
    it('persists a user and returns it with an id', async () => {
      const user = User.create({
        email: Email.create('test-integration@example.com'),
        name: 'Integration Test',
        phone: Phone.create('+59171234567'),
        passwordHash: 'argon2_integration_test_hash_placeholder',
      });

      const saved = await repo.save(user);

      expect(saved.id).toBeDefined();
      expect(saved.email.getValue()).toBe('test-integration@example.com');
      expect(saved.name).toBe('Integration Test');
      expect(saved.role).toBe('USER');
    });
  });

  describe('findByEmail', () => {
    it('finds a user by email', async () => {
      const user = User.create({
        email: Email.create('test-integration-find@example.com'),
        name: 'Find Test',
        phone: Phone.create('+59161234567'),
        passwordHash: 'argon2_integration_test_hash_placeholder',
      });

      await repo.save(user);

      const found = await repo.findByEmail(Email.create('test-integration-find@example.com'));

      expect(found).not.toBeNull();
      expect(found!.email.getValue()).toBe('test-integration-find@example.com');
      expect(found!.name).toBe('Find Test');
    });

    it('returns null when email does not exist', async () => {
      const result = await repo.findByEmail(Email.create('nonexistent@test-integration.com'));
      expect(result).toBeNull();
    });
  });
});
