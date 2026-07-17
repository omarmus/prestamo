import { MetaHttpService } from './meta-http.service';

function createMockConfig() {
  return {
    getOrThrow: jest.fn((key: string) => {
      if (key === 'WHATSAPP_PHONE_ID') return 'test-phone-id';
      if (key === 'WHATSAPP_TOKEN') return 'test-token';
      throw new Error(`Missing config: ${key}`);
    }),
    get: jest.fn(),
  };
}

function mockFetch(response: Partial<Response>) {
  const mockFn = jest.fn().mockResolvedValue(response);
  (globalThis as any).fetch = mockFn;
  return mockFn;
}

function okResponse(body: unknown): Partial<Response> {
  return {
    ok: true,
    status: 200,
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn(),
  };
}

function errorResponse(status: number, body: string): Partial<Response> {
  return {
    ok: false,
    status,
    text: jest.fn().mockResolvedValue(body),
    json: jest.fn(),
  };
}

describe('MetaHttpService', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe('sendMessage', () => {
    it('sends a message successfully and returns metaId', async () => {
      const fetchMock = mockFetch(
        okResponse({ messages: [{ id: 'wamid.test123' }] }),
      );

      const service = new MetaHttpService(createMockConfig() as any);
      const result = await service.sendMessage('+59171234567', 'Hola');

      expect(result.metaId).toBe('wamid.test123');
      expect(fetchMock).toHaveBeenCalledTimes(1);

      const callUrl = fetchMock.mock.calls[0][0];
      expect(callUrl).toContain('graph.facebook.com/v22.0');
      expect(callUrl).toContain('test-phone-id/messages');

      const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(callBody.to).toBe('+59171234567');
      expect(callBody.text.body).toBe('Hola');
    });

    it('retries up to 3 times on failure then throws last error', async () => {
      const fetchMock = mockFetch(errorResponse(500, 'Internal Server Error'));

      const service = new MetaHttpService(createMockConfig() as any);

      await expect(service.sendMessage('+59171234567', 'Hola')).rejects.toThrow(
        'Meta API error 500',
      );

      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('throws the last error after exhausting retries on timeout', async () => {
      const fetchMock = mockFetch(errorResponse(408, 'Request Timeout'));

      const service = new MetaHttpService(createMockConfig() as any);

      await expect(service.sendMessage('+59171234567', 'Hola')).rejects.toThrow(
        'Meta API error 408',
      );

      expect(fetchMock).toHaveBeenCalledTimes(3);
    });
  });
});
