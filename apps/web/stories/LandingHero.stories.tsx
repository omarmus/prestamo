import type { Meta, StoryObj } from '@storybook/react';
import { LandingHero } from '../features/landing/components/landing-hero';

const meta = {
  title: 'Landing/Hero',
  component: LandingHero,
} satisfies Meta<typeof LandingHero>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
