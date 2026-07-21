export type ActiveLoanStatus = 'ACTIVE' | 'CLOSED' | 'DEFAULTED';

export interface ActiveLoanSummary {
  id: string;
  amount: number;
  outstandingBalance: number;
  status: string;
  nextPaymentDate: string | null;
  nextPaymentAmount: number | null;
  paidInstallments: number;
  totalInstallments: number;
  disbursedAt: string;
}

export interface ActiveLoanDetail extends ActiveLoanSummary {
  applicationId: string;
  monthlyPayment: number;
  annualRate: number;
  termMonths: number;
  totalInterest: number;
  totalPayment: number;
  installments: Array<{
    id: string;
    installmentNumber: number;
    dueDate: string;
    totalAmount: number;
    principalAmount: number;
    interestAmount: number;
    paidTotal: number;
    status: string;
    paidAt: string | null;
  }>;
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    balanceAfter: number;
    description: string | null;
    reference: string | null;
    createdAt: string;
  }>;
}

export interface RegisterPaymentInput {
  loanId: string;
  amount: number;
  method: 'CASH' | 'TRANSFER';
  reference?: string;
  notes?: string;
}

export interface RegisterPaymentResponse {
  transaction: {
    id: string;
    loanId: string;
    type: 'PAYMENT';
    amount: number;
    balanceAfter: number;
    createdAt: string;
  };
  installmentsPaid: Array<{
    id: string;
    number: number;
    status: 'PAID';
    paidAt: string;
  }>;
  loanStatus: 'ACTIVE' | 'CLOSED';
  outstandingBalance: number;
}

export interface AdminActiveLoanListResponse {
  data: AdminActiveLoanListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminActiveLoanListItem {
  id: string;
  amount: number;
  monthlyPayment: number;
  outstandingBalance: number;
  status: ActiveLoanStatus;
  disbursedAt: string;
  termMonths: number;
  customer: {
    id: string;
    firstName: string;
    lastName: string | null;
    documentNumber: string | null;
  };
  progress: {
    paidCount: number;
    totalCount: number;
  };
}

export interface AdminActiveLoanDetail {
  loan: {
    id: string;
    applicationId: string;
    amount: number;
    termMonths: number;
    annualRate: number;
    monthlyPayment: number;
    totalInterest: number;
    totalPayment: number;
    outstandingBalance: number;
    status: ActiveLoanStatus;
    disbursedAt: string;
    closedAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
  customer: {
    id: string;
    firstName: string;
    lastName: string | null;
    documentNumber: string | null;
  };
  installments: Array<{
    id: string;
    installmentNumber: number;
    dueDate: string;
    totalAmount: number;
    principalAmount: number;
    interestAmount: number;
    paidTotal: number;
    status: string;
    paidAt: string | null;
  }>;
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    balanceAfter: number;
    description: string | null;
    reference: string | null;
    createdAt: string;
  }>;
}

export interface DisburseLoanResponse {
  loan: {
    id: string;
    applicationId: string;
    customerId: string;
    amount: number;
    termMonths: number;
    annualRate: number;
    monthlyPayment: number;
    totalInterest: number;
    totalPayment: number;
    outstandingBalance: number;
    status: string;
    disbursedAt: string;
  };
  installments: InstallmentItemResponse[];
  transaction: {
    id: string;
    type: string;
    amount: number;
    balanceAfter: number;
    createdAt: string;
  };
}

export interface InstallmentItemResponse {
  id: string;
  installmentNumber: number;
  dueDate: string;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  status: string;
  paidAt: string | null;
}

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
