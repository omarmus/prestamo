export interface TimelineEntryResponse {
  fromStatus: string | null;
  toStatus: string;
  changedBy: 'customer' | 'admin';
  changedAt: string;
  notes?: string;
}

export interface LoanApplicationResponse {
  id: string;
  amount: number;
  termMonths: number;
  annualRate: number;
  monthlyPayment: number;
  totalInterest: number;
  totalPayment: number;
  purpose: string | null;
  status: string;
  riskScore: string | null;
  simulationId: string | null;
  reviewerId: string | null;
  reviewNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  timeline: TimelineEntryResponse[];
}

export interface LoanApplicationSummary {
  id: string;
  amount: number;
  termMonths: number;
  annualRate: number;
  monthlyPayment: number;
  purpose: string | null;
  status: string;
  riskScore: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IncomeResponseWithMonthly {
  id: string;
  source: string | null;
  amount: number;
  frequency: string | null;
  monthlyAmount: number;
  createdAt: string;
}

export interface AdminApplicationListItem {
  id: string;
  amount: number;
  termMonths: number;
  annualRate: number;
  monthlyPayment: number;
  purpose: string | null;
  status: string;
  riskScore: string | null;
  createdAt: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string | null;
    documentNumber: string | null;
  };
  reviewer: { id: string; name: string } | null;
}

export interface AdminApplicationDetail {
  application: LoanApplicationResponse;
  customer: {
    id: string;
    firstName: string;
    lastName: string | null;
    documentType: string | null;
    documentNumber: string | null;
    status: string;
    kycStatus: string;
    addresses: unknown[];
    phones: unknown[];
    incomes: IncomeResponseWithMonthly[];
    employments: unknown[];
    bankAccounts: unknown[];
    documents: unknown[];
  };
  totalMonthlyIncome: number;
  dti: number;
  timeline: TimelineEntryResponse[];
}

export interface AdminListResponse {
  data: AdminApplicationListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
