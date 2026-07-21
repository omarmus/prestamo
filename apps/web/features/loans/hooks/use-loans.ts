'use client';

import { useCallback, useState } from 'react';
import type { CreateLoanApplicationInput, LoanApplicationResponse } from '@prestamos/shared';
import { api, ApiError } from '@/lib/api-client';

export function useLoans() {
  const [applications, setApplications] = useState<LoanApplicationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const list = useCallback(async () => {
    setIsLoading(true);
    try {
      setError(null);
      const data = await api.get<LoanApplicationResponse[]>('/api/loans/applications');
      setApplications(data);
      return data;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al cargar solicitudes';
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const create = useCallback(async (input: CreateLoanApplicationInput & { submit?: boolean }) => {
    setIsLoading(true);
    try {
      setError(null);
      const data = await api.post<LoanApplicationResponse>('/api/loans/applications', input as unknown as Record<string, unknown>);
      setApplications((prev) => [data, ...prev]);
      return data;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al crear solicitud';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const get = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      setError(null);
      return await api.get<LoanApplicationResponse>(`/api/loans/applications/${id}`);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al cargar solicitud';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const cancel = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      setError(null);
      const data = await api.delete<LoanApplicationResponse>(`/api/loans/applications/${id}`);
      setApplications((prev) => prev.map(a => a.id === id ? { ...a, status: 'CANCELLED' } : a));
      return data;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al cancelar solicitud';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { applications, isLoading, error, list, create, get, cancel };
}
