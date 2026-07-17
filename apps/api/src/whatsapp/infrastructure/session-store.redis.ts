import { Inject, Injectable } from '@nestjs/common';
import type { Redis } from 'ioredis';

import { REDIS_CLIENT } from '../../identity/infrastructure/redis.provider';
import { ChatbotSession } from '../domain/chatbot-session.entity';
import type { SessionStore } from '../domain/session-store.port';

@Injectable()
export class ChatbotSessionRedisStore implements SessionStore {
  private readonly TTL = 1800; // 30 minutes

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async get(phone: string): Promise<ChatbotSession | null> {
    const raw = await this.redis.get(`session:${phone}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ChatbotSession;
    return Object.assign(new ChatbotSession('', 'HELP', '', {}), parsed);
  }

  async save(session: ChatbotSession): Promise<void> {
    await this.redis.setex(`session:${session.phone}`, this.TTL, JSON.stringify(session));
  }

  async delete(phone: string): Promise<void> {
    await this.redis.del(`session:${phone}`);
  }
}
