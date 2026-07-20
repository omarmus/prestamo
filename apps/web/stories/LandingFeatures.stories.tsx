import type { Meta, StoryObj } from '@storybook/react';
import { LandingFeatures } from '../features/landing/components/landing-features';

const meta = {
  title: 'Landing/Features',
  component: LandingFeatures,
} satisfies Meta<typeof LandingFeatures>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
