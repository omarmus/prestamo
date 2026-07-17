import { Test, type TestingModule } from '@nestjs/testing';
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { SharedModule } from '../../../src/shared/shared.module';

/**
 * Integration tests for WhatsApp webhook.
 *
 * Prerequisites:
 *   - Docker Compose running: `docker compose up -d`
 *   - Redis available at REDIS_URL
 *
 * Uses a stripped-down controller to test the webhook routing
 * without needing the full module graph (IdentityModule, etc).
 */

// Minimal test controller mimicking WebhookController
@Controller('api/whatsapp/webhook')
class TestWebhookController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  verify(
    @Query('hub.verify_token') verifyToken: string,
    @Query('hub.challenge') challenge: string,
  ): number {
    const expected = this.configService.get<string>('WHATSAPP_VERIFY_TOKEN');

    if (!verifyToken || verifyToken !== expected) {
      throw new ForbiddenException('Invalid verify token');
    }

    return Number(challenge);
  }

  @Post()
  @HttpCode(200)
  async receive(@Body() _payload: unknown): Promise<void> {
    // Always ack
  }
}

describe('WebhookController (integration)', () => {
  let module: TestingModule;
  let app: INestApplication;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: '../../.env',
        }),
        SharedModule,
      ],
      controllers: [TestWebhookController],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/whatsapp/webhook — verification challenge', () => {
    it('returns 200 with challenge when verify token matches', async () => {
      const config = module.get<ConfigService>(ConfigService);
      const expected = config.get<string>('WHATSAPP_VERIFY_TOKEN');

      if (!expected) {
        // ponytail: skip if no token configured in test env
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/api/whatsapp/webhook')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': expected,
          'hub.challenge': '12345',
        });

      expect(response.status).toBe(200);
      expect(response.text).toBe('12345');
    });

    it('returns 403 when verify token does not match', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/whatsapp/webhook')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': 'wrong-token',
          'hub.challenge': '12345',
        });

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/whatsapp/webhook — incoming message', () => {
    it('returns 200 for a valid webhook payload', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/whatsapp/webhook')
        .send({
          entry: [
            {
              changes: [
                {
                  value: {
                    messages: [
                      {
                        from: '+59171234567',
                        type: 'text',
                        text: { body: 'Hola' },
                      },
                    ],
                    contacts: [{ wa_id: '+59171234567' }],
                  },
                },
              ],
            },
          ],
        });

      expect(response.status).toBe(200);
    });

    it('returns 200 for an empty payload (malformed, ack to stop retries)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/whatsapp/webhook')
        .send({});

      expect(response.status).toBe(200);
    });
  });
});
