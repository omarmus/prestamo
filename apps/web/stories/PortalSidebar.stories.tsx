import type { Meta, StoryObj } from "@storybook/react";
import { PortalSidebar } from "../features/portal/components/portal-sidebar";

const meta: Meta<typeof PortalSidebar> = {
  title: "Portal/PortalSidebar",
  component: PortalSidebar,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof PortalSidebar>;

export const Default: Story = {
  args: {
    user: { name: "Juan Pérez", email: "juan@example.com" },
    pathname: "/portal/dashboard",
    onLogout: () => {},
  },
};

export const ActiveProfile: Story = {
  args: {
    user: { name: "María García", email: "maria@example.com" },
    pathname: "/portal/profile",
    onLogout: () => {},
  },
};

export const Mobile: Story = {
  args: {
    user: { name: "Mobile User", email: "mobile@example.com" },
    pathname: "/portal/dashboard",
    onLogout: () => {},
  },
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
};
