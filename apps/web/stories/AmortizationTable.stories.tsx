import type { Meta, StoryObj } from "@storybook/react";
import { AmortizationTable } from "../features/portal/components/amortization-table";
import type { SimulationResult } from "../features/portal/components/amortization-table";

function generateSchedule(periods: number, payment: number, rate: number, principal: number) {
  const monthlyRate = rate / 100 / 12;
  let balance = principal;
  const schedule = [];
  for (let i = 1; i <= periods; i++) {
    const interest = balance * monthlyRate;
    const principalPaid = payment - interest;
    balance = Math.max(0, balance - principalPaid);
    schedule.push({
      period: i,
      payment: Math.round(payment * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      principal: Math.round(principalPaid * 100) / 100,
      balance: Math.round(balance * 100) / 100,
    });
  }
  return schedule;
}

const defaultResult: SimulationResult = {
  id: "sim-1",
  amount: 10000,
  termMonths: 12,
  annualRate: 12,
  monthlyPayment: 888.49,
  totalInterest: 661.85,
  totalPayment: 10661.85,
  schedule: generateSchedule(12, 888.49, 12, 10000),
  createdAt: "2026-06-15T10:30:00Z",
};

const longResult: SimulationResult = {
  id: "sim-2",
  amount: 50000,
  termMonths: 36,
  annualRate: 9.5,
  monthlyPayment: 1601.08,
  totalInterest: 7638.88,
  totalPayment: 57638.88,
  schedule: generateSchedule(36, 1601.08, 9.5, 50000),
  createdAt: "2026-07-01T14:00:00Z",
};

const meta: Meta<typeof AmortizationTable> = {
  title: "Portal/AmortizationTable",
  component: AmortizationTable,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof AmortizationTable>;

export const Default: Story = {
  args: { result: defaultResult },
};

export const LongerSchedule: Story = {
  args: { result: longResult },
};
