import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

export const redisProvider = {
  provide: REDIS_CLIENT,
  useFactory: (configService: ConfigService): Redis => {
    return new Redis(configService.get<string>('REDIS_URL') ?? 'redis://localhost:6379');
  },
  inject: [ConfigService],
};
