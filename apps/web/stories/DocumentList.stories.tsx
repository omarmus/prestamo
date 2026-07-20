import type { Meta, StoryObj } from "@storybook/react";
import { DocumentList } from "../features/portal/components/document-list";
import type { DocumentResponse } from "@prestamos/shared";

const sampleDocs: DocumentResponse[] = [
  {
    id: "doc-1",
    type: "CI_FRONT",
    fileName: "cedula_frente.jpg",
    mimeType: "image/jpeg",
    notes: null,
    status: "VERIFIED",
    createdAt: "2026-05-10T08:00:00Z",
  },
  {
    id: "doc-2",
    type: "CI_BACK",
    fileName: "cedula_reverso.jpg",
    mimeType: "image/jpeg",
    notes: null,
    status: "PENDING",
    createdAt: "2026-05-10T08:00:00Z",
  },
  {
    id: "doc-3",
    type: "PAYSLIP",
    fileName: "recibo_sueldo_abril.pdf",
    mimeType: "application/pdf",
    notes: null,
    status: "REJECTED",
    createdAt: "2026-05-12T09:30:00Z",
  },
];

const meta: Meta<typeof DocumentList> = {
  title: "Portal/DocumentList",
  component: DocumentList,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof DocumentList>;

export const Default: Story = {
  args: {
    documents: sampleDocs,
    isLoading: false,
  },
};

export const Loading: Story = {
  args: {
    documents: [],
    isLoading: true,
  },
};

export const Empty: Story = {
  args: {
    documents: [],
    isLoading: false,
  },
};

export const Error: Story = {
  args: {
    documents: [],
    isLoading: false,
    error: "Error al cargar documentos. Intentá de nuevo.",
  },
};
