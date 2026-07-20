import type { Meta, StoryObj } from '@storybook/react';
import { PublicSimulatorSection } from '../features/landing/components/public-simulator-section';

const meta = {
  title: 'Landing/PublicSimulatorSection',
  component: PublicSimulatorSection,
} satisfies Meta<typeof PublicSimulatorSection>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
