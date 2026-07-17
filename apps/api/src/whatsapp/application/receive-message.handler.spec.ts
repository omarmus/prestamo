import { ReceiveMessageHandler } from './receive-message.handler';
import type { ContactRepository } from '../domain/contact-repository.port';
import type { ConversationRepository } from '../domain/conversation-repository.port';
import type { MessageRepository } from '../domain/message-repository.port';
import type { SessionStore } from '../domain/session-store.port';
import type { MetaHttpPort } from './ports/meta-http.port';
import { RouteIntentHandler } from './route-intent.handler';
import type { AIServicePort } from './ports/ai-service.port';

function createMocks() {
  const contactRepo: jest.Mocked<ContactRepository> = {
    save: jest.fn(),
    findByPhone: jest.fn(),
    findById: jest.fn(),
  };
  const conversationRepo: jest.Mocked<ConversationRepository> = {
    save: jest.fn(),
    findActiveByContact: jest.fn(),
    findById: jest.fn(),
  };
  const messageRepo: jest.Mocked<MessageRepository> = {
    save: jest.fn(),
  };
  const sessionStore: jest.Mocked<SessionStore> = {
    get: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };
  const metaHttp: jest.Mocked<MetaHttpPort> = {
    sendMessage: jest.fn(),
  };
  const aiService: jest.Mocked<AIServicePort> = {
    classifyIntent: jest.fn(),
  };

  const routeIntent = new RouteIntentHandler(aiService, sessionStore);

  return {
    contactRepo,
    conversationRepo,
    messageRepo,
    sessionStore,
    metaHttp,
    aiService,
    routeIntent,
  };
}

describe('ReceiveMessageHandler', () => {
  describe('parsePayload', () => {
    it('extracts text message from a valid payload', () => {
      const mocks = createMocks();
      const handler = new ReceiveMessageHandler(
        mocks.contactRepo,
        mocks.conversationRepo,
        mocks.messageRepo,
        mocks.sessionStore,
        mocks.metaHttp,
        mocks.routeIntent,
      );

      const payload = {
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    {
                      from: '+59171234567',
                      id: 'wamid.abc123',
                      type: 'text',
                      text: { body: 'Hola, quiero un préstamo' },
                    },
                  ],
                  contacts: [{ wa_id: '+59171234567' }],
                },
              },
            ],
          },
        ],
      };

      const result = handler.parsePayload(payload);

      expect(result).not.toBeNull();
      expect(result!.phone).toBe('+59171234567');
      expect(result!.text).toBe('Hola, quiero un préstamo');
      expect(result!.messageId).toBe('wamid.abc123');
      expect(result!.messageType).toBe('text');
    });

    it('extracts interactive button reply', () => {
      const mocks = createMocks();
      const handler = new ReceiveMessageHandler(
        mocks.contactRepo,
        mocks.conversationRepo,
        mocks.messageRepo,
        mocks.sessionStore,
        mocks.metaHttp,
        mocks.routeIntent,
      );

      const payload = {
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    {
                      from: '+59171234567',
                      id: 'wamid.interactive',
                      type: 'interactive',
                      interactive: {
                        button_reply: { title: 'Sí, registrarme' },
                      },
                    },
                  ],
                  contacts: [{ wa_id: '+59171234567' }],
                },
              },
            ],
          },
        ],
      };

      const result = handler.parsePayload(payload);
      expect(result!.text).toBe('Sí, registrarme');
      expect(result!.messageType).toBe('interactive');
    });

    it('extracts interactive list reply', () => {
      const mocks = createMocks();
      const handler = new ReceiveMessageHandler(
        mocks.contactRepo,
        mocks.conversationRepo,
        mocks.messageRepo,
        mocks.sessionStore,
        mocks.metaHttp,
        mocks.routeIntent,
      );

      const payload = {
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    {
                      from: '+59171234567',
                      id: 'wamid.list',
                      type: 'interactive',
                      interactive: {
                        list_reply: { title: 'Registrarme' },
                      },
                    },
                  ],
                  contacts: [{ wa_id: '+59171234567' }],
                },
              },
            ],
          },
        ],
      };

      const result = handler.parsePayload(payload);
      expect(result!.text).toBe('Registrarme');
      expect(result!.messageType).toBe('interactive');
    });

    it('returns null for malformed payload (missing messages)', () => {
      const mocks = createMocks();
      const handler = new ReceiveMessageHandler(
        mocks.contactRepo,
        mocks.conversationRepo,
        mocks.messageRepo,
        mocks.sessionStore,
        mocks.metaHttp,
        mocks.routeIntent,
      );

      const result = handler.parsePayload({ entry: [] });
      expect(result).toBeNull();
    });

    it('returns null for completely empty payload', () => {
      const mocks = createMocks();
      const handler = new ReceiveMessageHandler(
        mocks.contactRepo,
        mocks.conversationRepo,
        mocks.messageRepo,
        mocks.sessionStore,
        mocks.metaHttp,
        mocks.routeIntent,
      );

      const result = handler.parsePayload(null);
      expect(result).toBeNull();
    });
  });
});
