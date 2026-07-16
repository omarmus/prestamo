import type { Meta, StoryObj } from "@storybook/react";
import { RegisterForm } from "../features/auth/components/register-form";
import { AuthContext } from "../providers/auth-provider";

const mockRegister = async () => {};

const meta: Meta<typeof RegisterForm> = {
  title: "Auth/RegisterForm",
  component: RegisterForm,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <AuthContext.Provider
        value={{
          user: null,
          isLoading: false,
          isAuthenticated: false,
          login: async () => {},
          register: mockRegister,
          logout: () => {},
        }}
      >
        <Story />
      </AuthContext.Provider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof RegisterForm>;

export const Default: Story = {};
