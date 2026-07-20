import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../redis.provider';
import type { RefreshTokenService, ConsumeResult } from '../../application/ports/refresh-token-service.port';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class RefreshTokenServiceImpl implements RefreshTokenService {
  private readonly TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async generate(userId: string): Promise<string> {
    // Look up role so consume() can return it
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    const role = user?.role.name ?? 'USER';

    const tokenId = randomUUID();
    const familyId = randomUUID();
    const key = `refresh:${tokenId}`;

    await this.redis.setex(
      key,
      this.TOKEN_TTL,
      JSON.stringify({ userId, familyId, role, used: false }),
    );

    // Track token in family set for bulk revocation
    const familyKey = `family:${familyId}`;
    await this.redis.sadd(familyKey, tokenId);
    await this.redis.expire(familyKey, this.TOKEN_TTL);

    return tokenId;
  }

  async consume(token: string): Promise<ConsumeResult | null> {
    const key = `refresh:${token}`;
    const raw = await this.redis.get(key);

    if (!raw) return null; // expired or never existed

    const data = JSON.parse(raw);

    if (data.used) {
      // Reuse detected — revoke entire family, then return null
      await this.revokeFamily(data.familyId);
      return null;
    }

    // Mark as consumed
    data.used = true;
    await this.redis.setex(key, this.TOKEN_TTL, JSON.stringify(data));

    return {
      userId: data.userId,
      familyId: data.familyId,
      role: data.role,
    };
  }

  async revokeFamily(familyId: string): Promise<void> {
    const familyKey = `family:${familyId}`;
    const members = await this.redis.smembers(familyKey);

    if (members.length === 0) return;

    const pipeline = this.redis.pipeline();
    for (const tokenId of members) {
      pipeline.del(`refresh:${tokenId}`);
    }
    pipeline.del(familyKey);
    await pipeline.exec();
  }
}
