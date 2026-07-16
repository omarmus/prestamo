import type { Meta, StoryObj } from "@storybook/react";
import { LoginForm } from "../features/auth/components/login-form";
import { AuthContext } from "../providers/auth-provider";

const mockLogin = async () => {};

const meta: Meta<typeof LoginForm> = {
  title: "Auth/LoginForm",
  component: LoginForm,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <AuthContext.Provider
        value={{
          user: null,
          isLoading: false,
          isAuthenticated: false,
          login: mockLogin,
          register: async () => {},
          logout: () => {},
        }}
      >
        <Story />
      </AuthContext.Provider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof LoginForm>;

export const Default: Story = {};
