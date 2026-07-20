import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { MetaHttpPort } from '../application/ports/meta-http.port';

@Injectable()
export class MetaHttpService implements MetaHttpPort {
  private readonly baseUrl = 'https://graph.facebook.com/v22.0';
  private readonly phoneId: string;
  private readonly token: string;

  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {
    this.phoneId = this.configService.getOrThrow<string>('WHATSAPP_PHONE_ID');
    this.token = this.configService.getOrThrow<string>('WHATSAPP_TOKEN');
  }

  async sendMessage(to: string, text: string): Promise<{ metaId: string }> {
    const url = `${this.baseUrl}/${this.phoneId}/messages`;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to,
            type: 'text',
            text: { body: text },
          }),
          // ponytail: 10s timeout via AbortSignal
          signal: AbortSignal.timeout(10_000),
        });

        if (!response.ok) {
          const body = await response.text().catch(() => '');
          throw new Error(`Meta API error ${response.status}: ${body}`);
        }

        const data: unknown = await response.json();
        const metaId =
          (data as { messages?: Array<{ id: string }> }).messages?.[0]?.id ?? '';

        return { metaId };
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < 2) {
          // ponytail: exponential backoff 1s, 2s
          await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
        }
      }
    }

    // ponytail: throw the last error so callers see what went wrong
    if (lastError) {
      throw lastError;
    }
    throw new Error('Failed to send message after 3 retries');
  }
}
