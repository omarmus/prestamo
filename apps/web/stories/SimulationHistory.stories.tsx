import type { Meta, StoryObj } from "@storybook/react";
import { SimulationHistory } from "../features/portal/components/simulation-history";
import type { SimulationResult } from "../features/portal/components/simulation-history";

function makeSim(overrides: Partial<SimulationResult>): SimulationResult {
  return {
    id: "sim-" + Math.random().toString(36).slice(2, 6),
    amount: 10000,
    termMonths: 12,
    annualRate: 12,
    monthlyPayment: 888.49,
    totalInterest: 661.85,
    totalPayment: 10661.85,
    schedule: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

const sampleSimulations = [
  makeSim({ id: "1", amount: 15000, termMonths: 24, monthlyPayment: 706.11, createdAt: "2026-06-10T10:00:00Z" }),
  makeSim({ id: "2", amount: 50000, termMonths: 36, monthlyPayment: 1601.08, createdAt: "2026-06-08T14:30:00Z" }),
  makeSim({ id: "3", amount: 8000, termMonths: 6, monthlyPayment: 1379.14, createdAt: "2026-05-25T09:00:00Z" }),
];

const meta: Meta<typeof SimulationHistory> = {
  title: "Portal/SimulationHistory",
  component: SimulationHistory,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof SimulationHistory>;

export const Default: Story = {
  args: {
    simulations: sampleSimulations,
    isLoading: false,
    onSelect: () => {},
  },
};

export const Loading: Story = {
  args: {
    simulations: [],
    isLoading: true,
    onSelect: () => {},
  },
};

export const Empty: Story = {
  args: {
    simulations: [],
    isLoading: false,
    onSelect: () => {},
  },
};
