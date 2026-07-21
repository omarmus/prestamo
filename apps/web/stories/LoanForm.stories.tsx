import type { Meta, StoryObj } from "@storybook/react";
import { LoanForm } from "../features/loans/components/loan-form";

const meta: Meta<typeof LoanForm> = {
  title: "Loans/LoanForm",
  component: LoanForm,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof LoanForm>;

export const Direct: Story = {
  args: {
    onSubmit: async () => null,
  },
};

export const FromSimulation: Story = {
  args: {
    simulationId: "sim-123",
    initialValues: {
      amount: 10000,
      termMonths: 12,
      annualRate: 12,
      monthlyPayment: 888.49,
    },
    onSubmit: async () => null,
  },
};

export const ValidationError: Story = {
  args: {
    onSubmit: async () => null,
  },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    // ponytail: story play functions are evaluated in the browser,
    // clicking submit without fields triggers validation
    const button = canvasElement.querySelector("button");
    button?.click();
  },
};
