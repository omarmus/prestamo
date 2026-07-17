import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigurationNotFoundError } from './configuration-not-found.error';

@Injectable()
export class ConfigurationService {
  private cache = new Map<string, { value: unknown; expiresAt: number }>();
  private readonly defaultTtlMs = 60_000; // 1 minute

  constructor(private readonly prisma: PrismaService) {}

  async get<T = unknown>(key: string, defaultValue?: T): Promise<T> {
    // Check cache first
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value as T;
    }

    const config = await this.prisma.systemConfiguration.findUnique({
      where: { key },
    });

    if (!config) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new ConfigurationNotFoundError(key);
    }

    // Cache and return
    this.cache.set(key, { value: config.value, expiresAt: Date.now() + this.defaultTtlMs });
    return config.value as T;
  }

  async set(key: string, value: unknown, description?: string, updatedById?: string): Promise<void> {
    const data = {
      value,
      description,
      // ponytail: default to "system" for seed/admin operations
      updatedById: updatedById ?? 'system',
    };

    await this.prisma.systemConfiguration.upsert({
      where: { key },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      create: { key, ...data } as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      update: data as any,
    });

    // Invalidate cache
    this.cache.delete(key);
  }
}
