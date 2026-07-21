import type { Meta, StoryObj } from '@storybook/react';
import { ActiveLoanDetail } from '../features/loans/components/active-loan-detail';

function makeInstallment(num: number, overrides: Record<string, unknown> = {}) {
  return {
    id: `inst-${num}`,
    installmentNumber: num,
    dueDate: new Date(2026, 6 + num, 20).toISOString(),
    totalAmount: 888.49,
    principalAmount: 788.49 - (num - 1) * 10,
    interestAmount: 100.00 + (num - 1) * 10,
    paidTotal: num <= 3 ? 0 : 9211.51 - (num - 1) * 700,
    status: num <= 3 ? 'PAID' : 'PENDING',
    paidAt: num <= 3 ? new Date(2026, 5 + num, 20).toISOString() : null,
    ...overrides,
  };
}

function makeTx(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    type: 'DISBURSEMENT' as const,
    amount: 10000,
    balanceAfter: 10000,
    description: 'Desembolso inicial',
    reference: null,
    createdAt: '2026-07-20T10:00:00Z',
    ...overrides,
  };
}

const detail = {
  id: 'loan-1',
  amount: 10000,
  outstandingBalance: 7000,
  status: 'ACTIVE',
  nextPaymentDate: '2026-08-20T00:00:00Z',
  nextPaymentAmount: 888.49,
  paidInstallments: 3,
  totalInstallments: 12,
  disbursedAt: '2026-07-20T00:00:00Z',
  applicationId: 'app-1',
  monthlyPayment: 888.49,
  annualRate: 12,
  termMonths: 12,
  totalInterest: 661.85,
  totalPayment: 10661.85,
  installments: [
    ...Array.from({ length: 3 }, (_, i) => makeInstallment(i + 1, { status: 'PAID', paidAt: new Date(2026, 6 + (i + 1), 20).toISOString() })),
    ...Array.from({ length: 9 }, (_, i) => makeInstallment(i + 4, { status: 'PENDING' })),
  ],
  transactions: [
    makeTx('tx-1'),
  ],
};

const closedDetail = {
  ...detail,
  id: 'loan-2',
  status: 'CLOSED' as const,
  outstandingBalance: 0,
  nextPaymentDate: null,
  nextPaymentAmount: null,
  paidInstallments: 12,
  installments: Array.from({ length: 12 }, (_, i) => makeInstallment(i + 1, { status: 'PAID', paidAt: new Date(2026, 6 + (i + 1), 20).toISOString() })),
};

const meta: Meta<typeof ActiveLoanDetail> = {
  title: 'Loans/ActiveLoanDetail',
  component: ActiveLoanDetail,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ActiveLoanDetail>;

export const Default: Story = {
  args: { detail },
};

export const Closed: Story = {
  args: { detail: closedDetail },
};
