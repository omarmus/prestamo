import type { Meta, StoryObj } from "@storybook/react";
import { CustomerForm } from "../features/portal/components/customer-form";
import type { CustomerProfile, FullCustomerProfile } from "@prestamos/shared";

const baseProfile: CustomerProfile = {
  id: "cust-1",
  userId: "user-1",
  firstName: "Juan",
  lastName: "Pérez",
  documentType: "CI",
  documentNumber: "1234567",
  birthDate: "1990-05-15",
  gender: "male",
  maritalStatus: "single",
  occupation: "Developer",
  monthlyIncome: 5000,
  status: "ACTIVE",
  kycStatus: "PENDING",
  createdAt: "2026-01-10T08:00:00Z",
  updatedAt: "2026-06-15T10:00:00Z",
};

const fullProfile: FullCustomerProfile = {
  ...baseProfile,
  kycStatus: "COMPLETED",
  addresses: [
    { id: "addr-1", type: "HOME", country: "Bolivia", department: "La Paz", city: "La Paz", zone: "Sopocachi", street: "Av. 6 de Agosto", number: "123", isPrimary: true, createdAt: "2026-01-10T08:00:00Z" },
  ],
  phones: [
    { id: "ph-1", phone: "+591 71234567", isWhatsApp: true, isPrimary: true, createdAt: "2026-01-10T08:00:00Z" },
  ],
  emails: [
    { id: "em-1", email: "juan@example.com", isPrimary: true, createdAt: "2026-01-10T08:00:00Z" },
  ],
  employment: {
    id: "emp-1", employer: "Tech Corp", position: "Senior Developer", employmentStatus: "ACTIVE", monthlySalary: 8000, yearsWorking: 3, createdAt: "2026-02-01T08:00:00Z",
  },
  incomes: [],
  bankAccounts: [
    { id: "bank-1", bank: "Banco Nacional", accountType: "SAVINGS", accountNumber: "****1234", holderName: "Juan Pérez", isPrimary: true, createdAt: "2026-01-15T08:00:00Z" },
  ],
  documents: [],
  simulations: [],
  portalActions: [],
};

const meta: Meta<typeof CustomerForm> = {
  title: "Portal/CustomerForm",
  component: CustomerForm,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof CustomerForm>;

export const Default: Story = {
  args: {
    profile: baseProfile,
    fullProfile: null,
    onUpdate: async () => {},
    onCreateSubEntity: async () => {},
    onUpdateSubEntity: async () => {},
    onDeleteSubEntity: async () => {},
  },
};

export const WithFullProfile: Story = {
  args: {
    profile: fullProfile,
    fullProfile,
    onUpdate: async () => {},
    onCreateSubEntity: async () => {},
    onUpdateSubEntity: async () => {},
    onDeleteSubEntity: async () => {},
  },
};
