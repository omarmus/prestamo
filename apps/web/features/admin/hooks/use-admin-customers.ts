'use client';

import { useCallback, useState } from 'react';
import type { AdminCustomerListItem, AdminCustomerListResponse, AdminCustomerDetailResponse } from '@prestamos/shared';
import { api, ApiError } from '@/lib/api-client';

export function useAdminCustomers() {
  const [list, setList] = useState<AdminCustomerListItem[]>([]);
  const [detail, setDetail] = useState<AdminCustomerDetailResponse | null>(null);
  const [pagination, setPagination] = useState<AdminCustomerListResponse['pagination'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (params?: { search?: string; page?: number; limit?: number }) => {
    setIsLoading(true);
    try {
      setError(null);
      const query = new URLSearchParams();
      if (params?.search) query.set('search', params.search);
      query.set('page', String(params?.page ?? 1));
      query.set('limit', String(params?.limit ?? 20));
      const data = await api.get<AdminCustomerListResponse>(`/api/admin/customers?${query}`);
      setList(data.data);
      setPagination(data.pagination);
      return data;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al cargar clientes';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getDetail = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      setError(null);
      const data = await api.get<AdminCustomerDetailResponse>(`/api/admin/customers/${id}`);
      setDetail(data);
      return data;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al cargar detalle del cliente';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { list, detail, pagination, isLoading, error, search, getDetail };
}
