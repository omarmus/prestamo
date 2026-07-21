import type { Meta, StoryObj } from '@storybook/react';
import { DisbursementButton } from '../features/admin/components/disbursement-button';

const meta: Meta<typeof DisbursementButton> = {
  title: 'Admin/DisbursementButton',
  component: DisbursementButton,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DisbursementButton>;

export const Default: Story = {
  args: {
    applicationId: 'app-1',
    amount: 10000,
    onDisburse: async () => null,
  },
};
