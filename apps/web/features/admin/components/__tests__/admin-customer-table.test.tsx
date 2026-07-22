import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminCustomerTable } from '../admin-customer-table';
import type { AdminCustomerListItem } from '@prestamos/shared';

afterEach(cleanup);

const mockCustomers: AdminCustomerListItem[] = [
  {
    id: '1',
    firstName: 'Juan',
    lastName: 'Pérez',
    documentType: 'CI',
    documentNumber: '1234567',
    email: 'juan@example.com',
    phone: '77123456',
    status: 'ACTIVE',
    kycStatus: 'APPROVED',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    firstName: 'María',
    lastName: 'García',
    documentType: 'CI',
    documentNumber: '7654321',
    email: 'maria@example.com',
    phone: '77123457',
    status: 'ACTIVE',
    kycStatus: 'PENDING',
    createdAt: '2024-02-01T00:00:00Z',
  },
];

const pagination = { page: 1, limit: 20, total: 2, totalPages: 1 };

describe('AdminCustomerTable', () => {
  it('renders customer rows', () => {
    render(
      <AdminCustomerTable
        customers={mockCustomers}
        isLoading={false}
        pagination={pagination}
        onSearchChange={() => {}}
        onPageChange={() => {}}
      />,
    );
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('María García')).toBeInTheDocument();
  });

  it('shows loading skeleton when isLoading', () => {
    const { container } = render(
      <AdminCustomerTable
        customers={[]}
        isLoading={true}
        pagination={null}
        onSearchChange={() => {}}
        onPageChange={() => {}}
      />,
    );
    // Should show skeleton elements
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('shows empty state when no customers', () => {
    render(
      <AdminCustomerTable
        customers={[]}
        isLoading={false}
        pagination={null}
        onSearchChange={() => {}}
        onPageChange={() => {}}
      />,
    );
    expect(screen.getByText('No se encontraron clientes')).toBeInTheDocument();
  });

  it('calls onSearchChange when typing in search', async () => {
    const onSearchChange = vi.fn();
    render(
      <AdminCustomerTable
        customers={mockCustomers}
        isLoading={false}
        pagination={pagination}
        onSearchChange={onSearchChange}
        onPageChange={() => {}}
      />,
    );
    const input = screen.getByPlaceholderText('Buscar por nombre, documento o email...');
    await userEvent.type(input, 'Juan');
    // Wait for debounce (300ms)
    await waitFor(() => expect(onSearchChange).toHaveBeenCalled());
  });
});
