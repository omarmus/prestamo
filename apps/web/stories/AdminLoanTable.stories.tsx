import type { Meta, StoryObj } from "@storybook/react";
import { AdminLoanTable } from "../features/admin/components/admin-loan-table";

function makeItem(overrides: Record<string, unknown> = {}) {
  return {
    id: "loan-" + Math.random().toString(36).slice(2, 6),
    amount: 10000,
    termMonths: 12,
    annualRate: 12,
    monthlyPayment: 888.49,
    purpose: "NEGOCIO",
    status: "PENDING",
    riskScore: null,
    createdAt: "2026-07-01T10:00:00Z",
    customer: {
      id: "cust-1",
      firstName: "Juan",
      lastName: "Pérez",
      documentNumber: "12345678",
    },
    reviewer: null,
    ...overrides,
  };
}

const sampleItems = [
  makeItem({ id: "1", amount: 15000, status: "PENDING", customer: { id: "c1", firstName: "María", lastName: "García", documentNumber: "87654321" } }),
  makeItem({ id: "2", amount: 50000, status: "IN_REVIEW", customer: { id: "c2", firstName: "Carlos", lastName: "López", documentNumber: "11223344" } }),
  makeItem({ id: "3", amount: 8000, status: "APPROVED", customer: { id: "c3", firstName: "Ana", lastName: "Martínez", documentNumber: "55667788" } }),
];

const meta: Meta<typeof AdminLoanTable> = {
  title: "Admin/AdminLoanTable",
  component: AdminLoanTable,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof AdminLoanTable>;

export const Default: Story = {
  args: {
    applications: sampleItems,
    isLoading: false,
    pagination: { page: 1, limit: 20, total: 3, totalPages: 1 },
    onFilterChange: () => {},
    onPageChange: () => {},
  },
};

export const Loading: Story = {
  args: {
    applications: [],
    isLoading: true,
    pagination: null,
    onFilterChange: () => {},
    onPageChange: () => {},
  },
};

export const Empty: Story = {
  args: {
    applications: [],
    isLoading: false,
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    onFilterChange: () => {},
    onPageChange: () => {},
  },
};
