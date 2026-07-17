import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';

const ENV_KEY = 'NEXT_PUBLIC_WHATSAPP_PHONE';

describe('WhatsAppFloat', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('renders a link when env var is set', async () => {
    vi.stubEnv(ENV_KEY, '59171234567');

    const { WhatsAppFloat } = await import('../whatsapp-float');
    const html = renderToString(<WhatsAppFloat />);

    expect(html).toContain('wa.me/59171234567');
    expect(html).toContain('Chatear por WhatsApp');
  });

  it('renders nothing when env var is not set', async () => {
    // Empty string is falsy, component checks `!WHATSAPP_PHONE`
    vi.stubEnv(ENV_KEY, '');

    const { WhatsAppFloat } = await import('../whatsapp-float');
    const html = renderToString(<WhatsAppFloat />);

    expect(html).toBe('');
  });

  it('has correct WhatsApp link with custom phone', async () => {
    vi.stubEnv(ENV_KEY, '59179876543');

    const { WhatsAppFloat } = await import('../whatsapp-float');
    const html = renderToString(<WhatsAppFloat />);

    expect(html).toContain('https://wa.me/59179876543');
    expect(html).toContain('text=');
    expect(html).toContain('pr%C3%A9stamo');
  });
});
