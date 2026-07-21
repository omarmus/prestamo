'use client';

import { useCallback, useState } from 'react';
import type { ActiveLoanSummary, ActiveLoanDetail } from '@prestamos/shared';
import { api, ApiError } from '@/lib/api-client';

export function useActiveLoans() {
  const [loans, setLoans] = useState<ActiveLoanSummary[]>([]);
  const [detail, setDetail] = useState<ActiveLoanDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const list = useCallback(async () => {
    setIsLoading(true);
    try {
      setError(null);
      const res = await api.get<{ data: ActiveLoanSummary[] }>('/api/loans/active');
      setLoans(res.data);
      return res.data;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al cargar préstamos');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getDetail = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      setError(null);
      const res = await api.get<ActiveLoanDetail>(`/api/loans/active/${id}`);
      setDetail(res);
      return res;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al cargar detalle');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { loans, detail, isLoading, error, list, getDetail };
}
