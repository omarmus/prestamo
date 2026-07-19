export interface CustomerProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string | null;
  documentType: string | null;
  documentNumber: string | null;
  birthDate: string | null;
  gender: string | null;
  maritalStatus: string | null;
  occupation: string | null;
  monthlyIncome: number | null;
  status: string;
  kycStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface AddressResponse {
  id: string;
  type: string | null;
  country: string | null;
  department: string | null;
  city: string | null;
  zone: string | null;
  street: string | null;
  number: string | null;
  isPrimary: boolean;
  createdAt: string;
}

export interface PhoneResponse {
  id: string;
  phone: string;
  isWhatsApp: boolean;
  isPrimary: boolean;
  createdAt: string;
}

export interface EmailResponse {
  id: string;
  email: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface EmploymentResponse {
  id: string;
  employer: string | null;
  position: string | null;
  employmentStatus: string | null;
  monthlySalary: number | null;
  yearsWorking: number | null;
  createdAt: string;
}

export interface IncomeResponse {
  id: string;
  source: string | null;
  amount: number;
  frequency: string | null;
  createdAt: string;
}

export interface BankAccountResponse {
  id: string;
  bank: string | null;
  accountType: string | null;
  accountNumber: string | null;
  holderName: string | null;
  isPrimary: boolean;
  createdAt: string;
}

export interface DocumentResponse {
  id: string;
  type: string;
  fileName: string | null;
  mimeType: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
}

export interface SimulationResponse {
  id: string;
  amount: number;
  termMonths: number;
  annualRate: number;
  monthlyPayment: number | null;
  schedule: unknown | null;
  createdAt: string;
}

export interface PortalActionResponse {
  id: string;
  action: string;
  metadata: unknown | null;
  createdAt: string;
}

export interface FullCustomerProfile extends CustomerProfile {
  addresses: AddressResponse[];
  phones: PhoneResponse[];
  emails: EmailResponse[];
  employment: EmploymentResponse | null;
  incomes: IncomeResponse[];
  bankAccounts: BankAccountResponse[];
  documents: DocumentResponse[];
  simulations: SimulationResponse[];
  portalActions: PortalActionResponse[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
