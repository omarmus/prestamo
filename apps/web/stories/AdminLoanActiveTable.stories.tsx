import type { Meta, StoryObj } from '@storybook/react';
import type { AdminActiveLoanListItem } from '@prestamos/shared';
import { AdminLoanActiveTable } from '../features/admin/components/admin-loan-active-table';

function makeLoan(overrides: Partial<AdminActiveLoanListItem> = {}): AdminActiveLoanListItem {
  return {
    id: 'loan-' + Math.random().toString(36).slice(2, 6),
    amount: 10000,
    monthlyPayment: 888.49,
    outstandingBalance: 9211.51,
    status: 'ACTIVE' as const,
    disbursedAt: '2026-07-20T00:00:00Z',
    termMonths: 12,
    customer: {
      id: 'cust-1',
      firstName: 'Juan',
      lastName: 'Pérez',
      documentNumber: '12345678',
    },
    progress: {
      paidCount: 1,
      totalCount: 12,
    },
    ...overrides,
  };
}

const sampleLoans = [
  makeLoan({
    id: '1',
    amount: 15000,
    outstandingBalance: 14000,
    customer: { id: 'c1', firstName: 'María', lastName: 'García', documentNumber: '87654321' },
    progress: { paidCount: 2, totalCount: 24 },
  }),
  makeLoan({
    id: '2',
    amount: 5000,
    outstandingBalance: 3500,
    status: 'CLOSED',
    customer: { id: 'c2', firstName: 'Carlos', lastName: 'López', documentNumber: '11223344' },
    progress: { paidCount: 18, totalCount: 18 },
  }),
  makeLoan({
    id: '3',
    amount: 8000,
    outstandingBalance: 6000,
    customer: { id: 'c3', firstName: 'Ana', lastName: 'Martínez', documentNumber: '99887766' },
    progress: { paidCount: 4, totalCount: 15 },
  }),
];

const meta: Meta<typeof AdminLoanActiveTable> = {
  title: 'Admin/AdminLoanActiveTable',
  component: AdminLoanActiveTable,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AdminLoanActiveTable>;

export const Default: Story = {
  args: {
    loans: sampleLoans,
    isLoading: false,
    pagination: { page: 1, limit: 20, total: 3, totalPages: 1 },
    onFilterChange: () => {},
    onPageChange: () => {},
  },
};

export const Loading: Story = {
  args: {
    loans: [],
    isLoading: true,
    pagination: null,
    onFilterChange: () => {},
    onPageChange: () => {},
  },
};

export const Empty: Story = {
  args: {
    loans: [],
    isLoading: false,
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    onFilterChange: () => {},
    onPageChange: () => {},
  },
};
