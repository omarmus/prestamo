import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../components/atoms/ui/button';
import { PaymentDialog } from '../features/admin/components/payment-dialog';

const meta: Meta<typeof PaymentDialog> = {
  title: 'Admin/PaymentDialog',
  component: PaymentDialog,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PaymentDialog>;

export const Default: Story = {
  args: {
    loanId: 'loan-1',
    installmentNumber: 4,
    amount: 888.49,
    dueDate: '2026-08-20T00:00:00Z',
    onConfirm: async () => true,
    children: <Button size="sm">Registrar Pago</Button>,
  },
};

export const WithReference: Story = {
  args: {
    loanId: 'loan-1',
    installmentNumber: 5,
    amount: 888.49,
    dueDate: '2026-09-20T00:00:00Z',
    onConfirm: async () => true,
    children: <Button size="sm">Registrar Pago</Button>,
  },
};
