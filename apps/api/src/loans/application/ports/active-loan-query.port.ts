// ponytail: Query interfaces return plain objects, not entities. The implementations (Prisma queries)
// map directly to the response shape. Add pagination params when the list grows.

export const ACTIVE_LOAN_QUERY = Symbol('ACTIVE_LOAN_QUERY');
export const ADMIN_ACTIVE_LOAN_QUERY = Symbol('ADMIN_ACTIVE_LOAN_QUERY');

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
    paidTotal: number;
    status: string;
    paidAt: string | null;
  }>;
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    createdAt: string;
  }>;
}

export interface ActiveLoanQuery {
  findByCustomerId(customerId: string): Promise<ActiveLoanSummary[]>;
  findById(id: string): Promise<ActiveLoanDetail | null>;
  findByIdAndCustomer(customerId: string, id: string): Promise<ActiveLoanDetail | null>;
}

export interface AdminActiveLoanQuery {
  list(params: {
    page: number;
    limit: number;
    status?: string;
    search?: string;
  }): Promise<{ data: ActiveLoanSummary[]; total: number }>;
  getDetail(id: string): Promise<ActiveLoanDetail | null>;
}
