import { describe, it, expect, vi } from 'vitest';

// Mock Next.js modules used by layout.tsx
vi.mock('next/font/google', () => ({
  Geist: () => ({ variable: '--font-sans' }),
}));

// Mock the bones registry
vi.mock('../../bones/registry', () => ({}));

// Mock the auth provider — just a pass-through
vi.mock('../../providers/auth-provider', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock whatsapp-float since it imports 'react' as client component
vi.mock('../../components/molecules/whatsapp-float', () => ({
  WhatsAppFloat: () => null,
}));

const mod = await import('../layout');

describe('RootLayout metadata', () => {
  const { metadata } = mod;

  it('has Open Graph title', () => {
    expect(metadata.openGraph?.title).toBeTruthy();
  });

  it('has Open Graph description', () => {
    expect(metadata.openGraph?.description).toBeTruthy();
  });

  it('has Open Graph url', () => {
    expect(metadata.openGraph?.url).toBeTruthy();
  });

  it('has Open Graph type=website', () => {
    // Use assertion on the raw object since TS union doesn't expose `type`
    const og = metadata.openGraph as Record<string, unknown>;
    expect(og?.type).toBe('website');
  });

  it('has Twitter card type', () => {
    const tw = metadata.twitter as Record<string, unknown>;
    expect(tw?.card).toBeTruthy();
  });

  it('has Twitter title', () => {
    expect(metadata.twitter?.title).toBeTruthy();
  });

  it('has description containing "préstamo"', () => {
    expect(metadata.description?.toLowerCase()).toContain('préstamo');
  });
});
