import { Inject, Injectable } from '@nestjs/common';
import type { Redis } from 'ioredis';

import { REDIS_CLIENT } from '../../identity/infrastructure/redis.provider';
import { LoanApplication } from '../domain/loan-application.entity';
import type { LoanApplicationRepository } from '../domain/loan-application-repository.port';

@Injectable()
export class RedisLoanApplicationRepository implements LoanApplicationRepository {
  private readonly TTL = 7 * 24 * 60 * 60; // 7 days

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async save(app: LoanApplication): Promise<void> {
    await this.redis.setex(
      `loan:${app.phone}`,
      this.TTL,
      JSON.stringify(app),
    );
  }

  async findByPhone(phone: string): Promise<LoanApplication | null> {
    const raw = await this.redis.get(`loan:${phone}`);
    if (!raw) return null;
    return LoanApplication.fromPersistence(JSON.parse(raw) as Record<string, unknown>);
  }

  async findById(id: string): Promise<LoanApplication | null> {
    // ponytail: scan all loan keys to find by ID. O(n) but fine for MVP volumes.
    const keys = await this.redis.keys('loan:*');
    for (const key of keys) {
      const raw = await this.redis.get(key);
      if (!raw) continue;
      const parsed = LoanApplication.fromPersistence(JSON.parse(raw) as Record<string, unknown>);
      if (parsed.id === id) return parsed;
    }
    return null;
  }
}
