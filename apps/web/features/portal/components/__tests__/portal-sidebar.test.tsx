import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { PortalSidebar } from '../portal-sidebar';

afterEach(cleanup);

describe('PortalSidebar', () => {
  it('renders user name and email', () => {
    render(
      <PortalSidebar
        user={{ name: 'Juan Pérez', email: 'juan@example.com' }}
        pathname="/portal/dashboard"
        onLogout={() => {}}
      />,
    );
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('juan@example.com')).toBeInTheDocument();
  });

  it('highlights the active nav item', () => {
    render(
      <PortalSidebar
        user={{ name: 'Test', email: 'test@test.com' }}
        pathname="/portal/profile"
        onLogout={() => {}}
      />,
    );
    // Links render twice (desktop + mobile); find the desktop active link
    const links = screen.getAllByRole('link');
    const profileLink = links.find((l) => l.getAttribute('href') === '/portal/profile');
    expect(profileLink?.className).toContain('bg-primary');
  });

  it('renders all 4 nav links (each appears twice: desktop + mobile)', () => {
    render(
      <PortalSidebar
        user={{ name: 'Test', email: 'test@test.com' }}
        pathname="/portal/dashboard"
        onLogout={() => {}}
      />,
    );
    const labels = ['Dashboard', 'Mi Perfil', 'Documentos', 'Simulador'];
    for (const label of labels) {
      const matches = screen.getAllByText(label);
      expect(matches.length).toBe(2);
    }
  });
});
