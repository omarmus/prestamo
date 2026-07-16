import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "../components/atoms/ui/input";

const meta: Meta<typeof Input> = {
  title: "UI/Input",
  component: Input,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "tel", "url"],
    },
    placeholder: { control: "text" },
    disabled: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: { placeholder: "Enter text..." },
};

export const Email: Story = {
  args: { type: "email", placeholder: "email@example.com" },
};

export const Password: Story = {
  args: { type: "password", placeholder: "Enter password" },
};

export const Disabled: Story = {
  args: { placeholder: "Disabled input", disabled: true },
};
