import type { Meta, StoryObj } from "@storybook/react";
import { WhatsAppFloat } from "../components/molecules/whatsapp-float";

const meta: Meta<typeof WhatsAppFloat> = {
  title: "Molecules/WhatsAppFloat",
  component: WhatsAppFloat,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof WhatsAppFloat>;

export const Default: Story = {};

export const CustomPosition: Story = {
  parameters: {
    layout: "centered",
  },
};
