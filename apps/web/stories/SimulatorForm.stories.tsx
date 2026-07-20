import type { Meta, StoryObj } from "@storybook/react";
import { SimulatorForm } from "../features/portal/components/simulator-form";

const meta: Meta<typeof SimulatorForm> = {
  title: "Portal/SimulatorForm",
  component: SimulatorForm,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof SimulatorForm>;

export const Default: Story = {
  args: {
    onSimulate: async () => {},
    isLoading: false,
  },
};

export const Loading: Story = {
  args: {
    onSimulate: async () => {},
    isLoading: true,
  },
};

export const WithInitialValues: Story = {
  args: {
    onSimulate: async () => {},
    isLoading: false,
    initialValues: { amount: "50000", termMonths: "24", annualRate: "8.5" },
  },
};
