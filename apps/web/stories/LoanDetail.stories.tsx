import type { Meta, StoryObj } from "@storybook/react";
import { LoanDetail } from "../features/loans/components/loan-detail";

function makeApp(overrides: Record<string, unknown> = {}) {
  return {
    id: "loan-1",
    amount: 15000,
    termMonths: 24,
    annualRate: 12,
    monthlyPayment: 706.11,
    totalInterest: 1946.64,
    totalPayment: 16946.64,
    purpose: "NEGOCIO",
    status: "DRAFT",
    riskScore: null,
    simulationId: null,
    reviewerId: null,
    reviewNotes: null,
    reviewedAt: null,
    createdAt: "2026-07-01T10:00:00Z",
    updatedAt: "2026-07-01T10:00:00Z",
    timeline: [
      { fromStatus: null, toStatus: "DRAFT", changedBy: "customer" as const, changedAt: "2026-07-01T10:00:00Z" },
    ],
    ...overrides,
  };
}

const approvedApp = makeApp({
  status: "APPROVED",
  riskScore: "LOW",
  reviewNotes: "Solicitud aprobada. Cliente cumple con todos los requisitos.",
  reviewedAt: "2026-07-05T14:00:00Z",
  timeline: [
    { fromStatus: null, toStatus: "DRAFT", changedBy: "customer" as const, changedAt: "2026-07-01T10:00:00Z" },
    { fromStatus: "DRAFT", toStatus: "PENDING", changedBy: "customer" as const, changedAt: "2026-07-01T10:05:00Z" },
    { fromStatus: "PENDING", toStatus: "IN_REVIEW", changedBy: "admin" as const, changedAt: "2026-07-02T09:00:00Z" },
    { fromStatus: "IN_REVIEW", toStatus: "APPROVED", changedBy: "admin" as const, changedAt: "2026-07-05T14:00:00Z", notes: "Cliente cumple requisitos" },
  ],
});

const meta: Meta<typeof LoanDetail> = {
  title: "Loans/LoanDetail",
  component: LoanDetail,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof LoanDetail>;

export const Approved: Story = {
  args: {
    application: approvedApp,
  },
};

export const WithCancelButton: Story = {
  args: {
    application: makeApp({ status: "DRAFT" }),
    onCancel: async () => {},
  },
};

export const FullTimeline: Story = {
  args: {
    application: makeApp({
      status: "INFO_REQUESTED",
      timeline: [
        { fromStatus: null, toStatus: "DRAFT", changedBy: "customer" as const, changedAt: "2026-06-20T10:00:00Z" },
        { fromStatus: "DRAFT", toStatus: "PENDING", changedBy: "customer" as const, changedAt: "2026-06-20T10:05:00Z" },
        { fromStatus: "PENDING", toStatus: "IN_REVIEW", changedBy: "admin" as const, changedAt: "2026-06-21T09:00:00Z" },
        { fromStatus: "IN_REVIEW", toStatus: "INFO_REQUESTED", changedBy: "admin" as const, changedAt: "2026-06-22T14:00:00Z", notes: "Solicitamos comprobante de ingresos adicional" },
      ],
    }),
  },
};
