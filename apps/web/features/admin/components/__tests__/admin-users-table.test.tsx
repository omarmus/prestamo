import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdminUsersTable } from '../admin-users-table';
import type { AdminUserListItem } from '@prestamos/shared';

const mockUsers: AdminUserListItem[] = [
  {
    id: '1',
    email: 'admin1@example.com',
    name: 'Admin Uno',
    phone: '77123456',
    role: 'ADMIN',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    email: 'admin2@example.com',
    name: 'Admin Dos',
    phone: '77123457',
    role: 'ADMIN',
    createdAt: '2024-02-01T00:00:00Z',
  },
];

describe('AdminUsersTable', () => {
  it('renders user rows', () => {
    render(<AdminUsersTable users={mockUsers} isLoading={false} />);
    expect(screen.getByText('Admin Uno')).toBeInTheDocument();
    expect(screen.getByText('Admin Dos')).toBeInTheDocument();
    expect(screen.getByText('admin1@example.com')).toBeInTheDocument();
  });

  it('shows loading skeleton when isLoading', () => {
    const { container } = render(<AdminUsersTable users={[]} isLoading={true} />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('shows empty state when no users', () => {
    render(<AdminUsersTable users={[]} isLoading={false} />);
    expect(screen.getByText('No hay usuarios administradores')).toBeInTheDocument();
  });
});
