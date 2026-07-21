import type { FullCustomerProfile } from './customer.types';

// === Dashboard ===
export interface AdminStatsResponse {
  totalApplications: number;
  pendingApplications: number;
  totalLoans: number;
  activeLoans: number;
  totalDisbursed: number;
  totalCustomers: number;
}

// === Customers ===
export interface AdminCustomerListItem {
  id: string;
  firstName: string;
  lastName: string | null;
  documentType: string | null;
  documentNumber: string | null;
  email: string | null;
  phone: string;
  status: string;
  kycStatus: string;
  createdAt: string;
}

export interface AdminCustomerListResponse {
  data: AdminCustomerListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminCustomerDetailResponse {
  customer: FullCustomerProfile & { user: { email: string | null; phone: string; name: string } };
  loans: Array<{
    id: string;
    amount: number;
    status: string;
    outstandingBalance: number;
    disbursedAt: string;
  }>;
  applications: Array<{
    id: string;
    amount: number;
    status: string;
    createdAt: string;
  }>;
}

// === Notes ===
export interface AdminNoteResponse {
  id: string;
  authorId: string;
  authorName: string;
  entityType: string;
  entityId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminNoteListResponse {
  data: AdminNoteResponse[];
}

export interface CreateNoteInput {
  entityType: 'CUSTOMER' | 'LOAN' | 'APPLICATION';
  entityId: string;
  content: string;
}

// === Admin Users ===
export interface AdminUserListItem {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: string;
  createdAt: string;
}

export interface AdminUserListResponse {
  data: AdminUserListItem[];
}

export interface CreateAdminUserInput {
  email: string;
  name: string;
  phone: string;
  password: string;
}
