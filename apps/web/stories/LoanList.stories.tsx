import type { Meta, StoryObj } from "@storybook/react";
import { LoanList } from "../features/loans/components/loan-list";

function makeApp(overrides: Record<string, unknown> = {}) {
  return {
    id: "loan-" + Math.random().toString(36).slice(2, 6),
    amount: 10000,
    termMonths: 12,
    annualRate: 12,
    monthlyPayment: 888.49,
    totalInterest: 661.85,
    totalPayment: 10661.85,
    purpose: "NEGOCIO",
    status: "DRAFT",
    riskScore: null,
    simulationId: null,
    reviewerId: null,
    reviewNotes: null,
    reviewedAt: null,
    createdAt: "2026-07-01T10:00:00Z",
    updatedAt: "2026-07-01T10:00:00Z",
    timeline: [],
    ...overrides,
  };
}

const sampleApplications = [
  makeApp({ id: "1", amount: 15000, termMonths: 24, monthlyPayment: 706.11, status: "APPROVED", purpose: "NEGOCIO", createdAt: "2026-07-01T10:00:00Z" }),
  makeApp({ id: "2", amount: 50000, termMonths: 36, monthlyPayment: 1601.08, status: "PENDING", purpose: "EDUCACION", createdAt: "2026-06-28T14:30:00Z" }),
  makeApp({ id: "3", amount: 8000, termMonths: 6, monthlyPayment: 1379.14, status: "DRAFT", purpose: "SALUD", createdAt: "2026-06-25T09:00:00Z" }),
  makeApp({ id: "4", amount: 25000, termMonths: 18, monthlyPayment: 1525.00, status: "IN_REVIEW", purpose: "VIAJE", createdAt: "2026-06-20T11:00:00Z" }),
  makeApp({ id: "5", amount: 3000, termMonths: 3, monthlyPayment: 1020.00, status: "REJECTED", purpose: "OTRO", createdAt: "2026-06-15T16:00:00Z" }),
];

const meta: Meta<typeof LoanList> = {
  title: "Loans/LoanList",
  component: LoanList,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof LoanList>;

export const Default: Story = {
  args: { applications: sampleApplications },
};

export const WithPending: Story = {
  args: {
    applications: [
      makeApp({ id: "6", amount: 20000, termMonths: 12, monthlyPayment: 1776.98, status: "PENDING", purpose: "NEGOCIO" }),
    ],
  },
};

export const Empty: Story = {
  args: { applications: [] },
};
