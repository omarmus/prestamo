import type {
  AdminCustomerListItem,
  AdminCustomerDetailResponse,
} from '@prestamos/shared';

export const ADMIN_CUSTOMER_QUERY = Symbol('ADMIN_CUSTOMER_QUERY');

export interface AdminCustomerListFilters {
  search?: string;
  page: number;
  limit: number;
}

export interface AdminCustomerQuery {
  list(filters: AdminCustomerListFilters): Promise<{
    data: AdminCustomerListItem[];
    total: number;
  }>;
  getById(id: string): Promise<AdminCustomerDetailResponse | null>;
}
