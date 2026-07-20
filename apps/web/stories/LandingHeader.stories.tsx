import type { Meta, StoryObj } from '@storybook/react';
import { LandingHeader } from '../features/landing/components/landing-header';

const meta = {
  title: 'Landing/Header',
  component: LandingHeader,
} satisfies Meta<typeof LandingHeader>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
