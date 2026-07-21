'use client';

import { useCallback, useState } from 'react';
import type { AdminActiveLoanListItem, AdminActiveLoanDetail, RegisterPaymentInput, RegisterPaymentResponse, DisburseLoanResponse } from '@prestamos/shared';
import { api, ApiError } from '@/lib/api-client';

export function useAdminPayments() {
  const [loans, setLoans] = useState<AdminActiveLoanListItem[]>([]);
  const [detail, setDetail] = useState<AdminActiveLoanDetail | null>(null);
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; totalPages: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listActive = useCallback(async (params?: Record<string, string>) => {
    setIsLoading(true);
    try {
      setError(null);
      const query = new URLSearchParams(params ?? {});
      const res = await api.get<{ data: AdminActiveLoanListItem[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(`/api/admin/loans/active?${query}`);
      setLoans(res.data);
      setPagination(res.pagination);
      return res;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al cargar');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getDetail = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      setError(null);
      const res = await api.get<AdminActiveLoanDetail>(`/api/admin/loans/active/${id}`);
      setDetail(res);
      return res;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al cargar');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disburse = useCallback(async (applicationId: string) => {
    setIsLoading(true);
    try {
      setError(null);
      return await api.post<DisburseLoanResponse>(`/api/admin/loans/${applicationId}/disburse`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al desembolsar');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const registerPayment = useCallback(async (input: RegisterPaymentInput) => {
    setIsLoading(true);
    try {
      setError(null);
      return await api.post<RegisterPaymentResponse>('/api/admin/payments', input as unknown as Record<string, unknown>);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al registrar pago');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { loans, detail, pagination, isLoading, error, listActive, getDetail, disburse, registerPayment };
}
