import type { Meta, StoryObj } from "@storybook/react";
import { AdminLoanReview } from "../features/admin/components/admin-loan-review";
import type { AdminApplicationDetail } from "@prestamos/shared";

const baseCustomer = {
  id: "cust-1",
  firstName: "Juan",
  lastName: "Pérez",
  documentType: "CI",
  documentNumber: "12345678",
  status: "ACTIVE",
  kycStatus: "COMPLETED",
  addresses: [],
  phones: [],
  incomes: [
    { id: "inc-1", source: "Salario", amount: 8000, frequency: "MONTHLY", monthlyAmount: 8000, createdAt: "2026-01-01T00:00:00Z" },
  ],
  employments: [],
  bankAccounts: [],
  documents: [
    { id: "doc-1", type: "CI_FRONT", filename: "ci-front.jpg", status: "VERIFIED" },
    { id: "doc-2", type: "CI_BACK", filename: "ci-back.jpg", status: "VERIFIED" },
    { id: "doc-3", type: "SELFIE", filename: "selfie.jpg", status: "PENDING" },
  ],
};

const baseApp = {
  id: "loan-1",
  amount: 15000,
  termMonths: 24,
  annualRate: 12,
  monthlyPayment: 706.11,
  totalInterest: 1946.64,
  totalPayment: 16946.64,
  purpose: "NEGOCIO",
  status: "PENDING",
  riskScore: null,
  simulationId: null,
  reviewerId: null,
  reviewNotes: null,
  reviewedAt: null,
  createdAt: "2026-07-01T10:00:00Z",
  updatedAt: "2026-07-01T10:00:00Z",
  timeline: [
    { fromStatus: null, toStatus: "DRAFT", changedBy: "customer" as const, changedAt: "2026-07-01T10:00:00Z" },
    { fromStatus: "DRAFT", toStatus: "PENDING", changedBy: "customer" as const, changedAt: "2026-07-01T10:05:00Z" },
  ],
};

const defaultDetail: AdminApplicationDetail = {
  application: baseApp,
  customer: baseCustomer,
  totalMonthlyIncome: 8000,
  dti: 0.20,
  timeline: baseApp.timeline,
};

const lowIncomeDetail: AdminApplicationDetail = {
  ...defaultDetail,
  totalMonthlyIncome: 3000,
  dti: 0.55,
  customer: {
    ...baseCustomer,
    incomes: [
      { id: "inc-1", source: "Freelance", amount: 3000, frequency: "MONTHLY", monthlyAmount: 3000, createdAt: "2026-01-01T00:00:00Z" },
    ],
  },
};

const meta: Meta<typeof AdminLoanReview> = {
  title: "Admin/AdminLoanReview",
  component: AdminLoanReview,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof AdminLoanReview>;

export const Default: Story = {
  args: {
    detail: defaultDetail,
    onApprove: async () => {},
    onReject: async () => {},
    onRequestInfo: async () => {},
    onAssign: async () => {},
    isProcessing: false,
  },
};

export const LowIncome: Story = {
  args: {
    detail: lowIncomeDetail,
    onApprove: async () => {},
    onReject: async () => {},
    onRequestInfo: async () => {},
    onAssign: async () => {},
    isProcessing: false,
  },
};
