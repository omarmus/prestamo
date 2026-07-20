import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Redis } from 'ioredis';
import type { AIServicePort } from '../application/ports/ai-service.port';
import { REDIS_CLIENT } from '../../identity/infrastructure/redis.provider';

@Injectable()
export class AIService implements AIServicePort {
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly model: string;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {
    this.apiUrl =
      this.configService.get<string>('AI_API_URL') ??
      'https://api.openai.com/v1/chat/completions';
    this.apiKey = this.configService.getOrThrow<string>('AI_API_KEY');
    this.model = this.configService.get<string>('AI_MODEL') ?? 'gpt-4o-mini';
  }

  async classifyIntent(
    message: string,
    _history: unknown[],
  ): Promise<{ intent: string; reply: string } | null> {
    // ponytail: rate limit 10 req / 5 min per session — keyed by message hash
    // as a proxy. The caller should pass a session identifier for precise limiting.
    const rateKey = `rate:ai:${this.hashMessage(message)}`;
    const count = await this.redis.incr(rateKey);
    if (count === 1) {
      await this.redis.expire(rateKey, 300); // 5 min TTL
    }
    if (count > 10) {
      return null; // rate limit exceeded → fallback to keyword
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content:
                'Eres un asistente de préstamos en Bolivia. Clasifica el mensaje en uno de estos intents: REGISTER, APPLY_LOAN, CHECK_STATUS, HELP. Responde SOLO con JSON: {"intent": "...", "reply": "..."}. La reply debe ser en español, amigable y corta.',
            },
            { role: 'user', content: message },
          ],
          max_tokens: 150,
        }),
        signal: AbortSignal.timeout(5_000),
      });

      if (!response.ok) {
        return null; // fallback to keyword matching
      }

      const data: unknown = await response.json();
      const content = (
        data as {
          choices?: Array<{ message?: { content?: string } }>;
        }
      ).choices?.[0]?.message?.content;

      if (!content) return null;

      const parsed = JSON.parse(content) as { intent?: string; reply?: string };
      if (parsed.intent && parsed.reply) {
        return { intent: parsed.intent, reply: parsed.reply };
      }

      return null;
    } catch {
      // ponytail: timeout or network error → fallback to keyword matching
      return null;
    }
  }

  private hashMessage(message: string): string {
    let hash = 0;
    for (let i = 0; i < message.length; i++) {
      const char = message.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  }
}