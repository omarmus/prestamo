import type { Meta, StoryObj } from '@storybook/react';
import { LandingFooter } from '../features/landing/components/landing-footer';

const meta = {
  title: 'Landing/Footer',
  component: LandingFooter,
} satisfies Meta<typeof LandingFooter>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
