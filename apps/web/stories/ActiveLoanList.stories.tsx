import type { Meta, StoryObj } from '@storybook/react';
import { ActiveLoanList } from '../features/loans/components/active-loan-list';

function makeLoan(overrides: Record<string, unknown> = {}) {
  return {
    id: 'loan-' + Math.random().toString(36).slice(2, 6),
    amount: 10000,
    outstandingBalance: 9211.51,
    status: 'ACTIVE',
    nextPaymentDate: '2026-08-20T00:00:00Z',
    nextPaymentAmount: 888.49,
    paidInstallments: 1,
    totalInstallments: 12,
    disbursedAt: '2026-07-20T00:00:00Z',
    ...overrides,
  };
}

const sampleLoans = [
  makeLoan({ id: '1', amount: 15000, outstandingBalance: 14000, paidInstallments: 2, totalInstallments: 24, nextPaymentDate: '2026-09-15T00:00:00Z', nextPaymentAmount: 706.11 }),
  makeLoan({ id: '2', amount: 5000, outstandingBalance: 3500, paidInstallments: 5, totalInstallments: 18, nextPaymentDate: '2026-08-10T00:00:00Z', nextPaymentAmount: 315.00 }),
];

const meta: Meta<typeof ActiveLoanList> = {
  title: 'Loans/ActiveLoanList',
  component: ActiveLoanList,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ActiveLoanList>;

export const Default: Story = {
  args: { loans: sampleLoans },
};

export const SingleLoan: Story = {
  args: {
    loans: [
      makeLoan({ id: '3', amount: 20000, outstandingBalance: 18000, paidInstallments: 3, totalInstallments: 12 }),
    ],
  },
};

export const Empty: Story = {
  args: { loans: [] },
};
