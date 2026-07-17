import { RouteIntentHandler } from './route-intent.handler';
import { ChatbotSession } from '../domain/chatbot-session.entity';
import type { AIServicePort } from './ports/ai-service.port';
import type { SessionStore } from '../domain/session-store.port';

describe('RouteIntentHandler', () => {
  let aiService: jest.Mocked<AIServicePort>;
  let sessionStore: jest.Mocked<SessionStore>;
  let handler: RouteIntentHandler;

  beforeEach(() => {
    aiService = { classifyIntent: jest.fn().mockResolvedValue(null) };
    sessionStore = {
      get: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    handler = new RouteIntentHandler(aiService, sessionStore);
  });

  // Helper to create handler with CheckStatusHandler — used in CHECK_STATUS tests below

  describe('keyword matching', () => {
    it('routes "registro" to REGISTER', async () => {
      const session = ChatbotSession.create('+59171234567', 'HELP');
      const result = await handler.execute(session, 'Me quiero registrar');
      expect(result.intent).toBe('REGISTER');
    });

    it('routes "préstamo" to APPLY_LOAN', async () => {
      const session = ChatbotSession.create('+59171234567', 'HELP');
      const result = await handler.execute(session, 'Necesito un préstamo');
      expect(result.intent).toBe('APPLY_LOAN');
    });

    it('routes "estado" to CHECK_STATUS', async () => {
      const session = ChatbotSession.create('+59171234567', 'HELP');
      const result = await handler.execute(session, 'Cuál es el estado de mi solicitud');
      expect(result.intent).toBe('CHECK_STATUS');
    });

    it('routes unrecognized to HELP', async () => {
      const session = ChatbotSession.create('+59171234567', 'HELP');
      const result = await handler.execute(session, 'xyzzy');
      expect(result.intent).toBe('HELP');
    });

    it('routes number "2" to APPLY_LOAN', async () => {
      const session = ChatbotSession.create('+59171234567', 'HELP');
      const result = await handler.execute(session, '2');
      expect(result.intent).toBe('APPLY_LOAN');
    });
  });

  describe('CHECK_STATUS with CheckStatusHandler', () => {
    it('uses CheckStatusHandler when available for CHECK_STATUS intent', async () => {
      const mockCheckStatus = {
        execute: jest.fn().mockResolvedValue({
          hasApplication: true,
          message: '✅ Tu solicitud está en revisión.',
        }),
      };
      const handlerWithCS = new RouteIntentHandler(aiService, sessionStore, mockCheckStatus as any);
      const session = ChatbotSession.create('+59171234567', 'HELP');

      const result = await handlerWithCS.execute(session, 'estado');

      expect(mockCheckStatus.execute).toHaveBeenCalledWith('+59171234567');
      expect(result.intent).toBe('CHECK_STATUS');
      expect(result.reply).toContain('revisión');
    });

    it('falls back to static reply when CheckStatusHandler is not provided', async () => {
      const session = ChatbotSession.create('+59171234567', 'HELP');
      const result = await handler.execute(session, 'estado');

      expect(result.intent).toBe('CHECK_STATUS');
      expect(result.reply).toBeDefined();
    });

    it('uses CheckStatusHandler response from AI classification too', async () => {
      aiService.classifyIntent.mockResolvedValue({
        intent: 'CHECK_STATUS',
        reply: 'AI thinks this is status',
      });
      const mockCheckStatus = {
        execute: jest.fn().mockResolvedValue({
          hasApplication: false,
          message: 'No tienes solicitudes activas.',
        }),
      };
      const handlerWithCS = new RouteIntentHandler(aiService, sessionStore, mockCheckStatus as any);
      const session = ChatbotSession.create('+59171234567', 'HELP');

      const result = await handlerWithCS.execute(session, 'quiero saber mi estado');

      expect(mockCheckStatus.execute).toHaveBeenCalled();
      expect(result.reply).toContain('No tienes solicitudes');
    });
  });

  describe('AI fallback', () => {
    it('tries AI first, falls back to keyword when AI returns null', async () => {
      aiService.classifyIntent.mockResolvedValue(null);
      const session = ChatbotSession.create('+59171234567', 'HELP');
      const result = await handler.execute(session, 'Quiero registrarme');

      expect(aiService.classifyIntent).toHaveBeenCalledWith(
        'Quiero registrarme',
        [],
      );
      expect(result.intent).toBe('REGISTER');
    });

    it('uses AI result when AI returns an intent', async () => {
      aiService.classifyIntent.mockResolvedValue({
        intent: 'CHECK_STATUS',
        reply: 'Tu solicitud está en proceso.',
      });
      const session = ChatbotSession.create('+59171234567', 'HELP');
      const result = await handler.execute(session, 'some message');

      expect(result.intent).toBe('CHECK_STATUS');
      expect(result.reply).toBe('Tu solicitud está en proceso.');
    });
  });
});