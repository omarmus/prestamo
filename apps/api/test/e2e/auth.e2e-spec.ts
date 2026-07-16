import type { INestApplication, CanActivate } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { ConfigModule } from '@nestjs/config';

import { IdentityModule } from '../../src/identity/identity.module';
import { PrismaService } from '../../src/identity/infrastructure/persistence/prisma/prisma.service';
import { DomainErrorFilter } from '../../src/shared/filters/domain-error.filter';
import { JwtAuthGuard } from '../../src/shared/guards/jwt-auth.guard';

/**
 * E2E tests for the auth endpoints.
 *
 * Prerequisites:
 *   - Docker Compose running: `docker compose up -d`
 *   - Prisma migration applied: `pnpm --filter @prestamos/api prisma:migrate`
 *   - Seed run: `pnpm --filter @prestamos/api seed`
 */

describe('Auth API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: '../../.env',
          isGlobal: true,
        }),
        IdentityModule,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true } as CanActivate)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new DomainErrorFilter());
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    // Clean test users before each test
    await prisma.user.deleteMany({ where: { email: { contains: 'e2e-test' } } });
  });

  afterAll(async () => {
    await app.close();
  });

  const testUser = {
    email: 'e2e-test@example.com',
    password: 'ValidPass123',
    name: 'E2E Test User',
    phone: '+59161234567',
  };

  // ── Scenario 1: Successful registration ──

  describe('POST /api/auth/register', () => {
    it('should return 201 with tokens (scenario 1)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user.email).toBe(testUser.email);
      expect(res.body.user.role).toBe('USER');
    });

    // ── Scenario 2: Duplicate email → 409 ──

    it('should return 409 for duplicate email (scenario 2)', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser)
        .expect(409);

      expect(res.body.message).toContain(testUser.email);
    });
  });

  // ── Scenario 5: Successful login ──

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Register a user before login tests
      await request(app.getHttpServer()).post('/api/auth/register').send(testUser);
    });

    it('should return 200 with tokens (scenario 5)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user.email).toBe(testUser.email);
    });

    // ── Scenario 6: Wrong password → 401 ──

    it('should return 401 for wrong password (scenario 6)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'WrongPassword!' })
        .expect(401);

      expect(res.body.message).toBeDefined();
    });
  });

  // ── Scenario 7: Token refresh rotation ──

  describe('POST /api/auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      // Register and login to get a refresh token
      await request(app.getHttpServer()).post('/api/auth/register').send(testUser);
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password });
      refreshToken = loginRes.body.refreshToken;
    });

    it('should return 200 with rotated tokens (scenario 7)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      // Token should be different from the original
      expect(res.body.refreshToken).not.toBe(refreshToken);
    });

    it('should return 401 when refresh token is reused (scenario 8)', async () => {
      // First use — consume the token
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      // Second use — should be detected as reuse
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(401);
    });
  });

  // ── Scenario 9: Authenticated profile request ──

  describe('GET /api/auth/me', () => {
    let accessToken: string;

    beforeEach(async () => {
      await request(app.getHttpServer()).post('/api/auth/register').send(testUser);
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password });
      accessToken = loginRes.body.accessToken;
    });

    it('should return 200 with user profile (scenario 9)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.id).toBeDefined();
      expect(res.body.email).toBe(testUser.email);
      expect(res.body.name).toBe(testUser.name);
      expect(res.body.phone).toBe(testUser.phone);
      expect(res.body.role).toBeDefined();
      expect(res.body.createdAt).toBeDefined();
    });

    // ── Scenario 10: No token → 401 ──

    it('should return 401 without token (scenario 10)', async () => {
      await request(app.getHttpServer()).get('/api/auth/me').expect(401);
    });
  });
});
