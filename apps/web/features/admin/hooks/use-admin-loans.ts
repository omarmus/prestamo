'use client';

import { useCallback, useState } from 'react';
import type { AdminListResponse, AdminApplicationDetail } from '@prestamos/shared';
import { api, ApiError } from '@/lib/api-client';

export function useAdminLoans() {
  const [list, setList] = useState<AdminListResponse['data']>([]);
  const [pagination, setPagination] = useState<AdminListResponse['pagination'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listPending = useCallback(async (params?: Record<string, string>) => {
    setIsLoading(true);
    try {
      setError(null);
      const query = new URLSearchParams(params ?? {});
      const data = await api.get<AdminListResponse>(`/api/admin/loans?${query}`);
      setList(data.data);
      setPagination(data.pagination);
      return data;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al cargar solicitudes';
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
      return await api.get<AdminApplicationDetail>(`/api/admin/loans/${id}`);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al cargar detalle';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const approve = useCallback(async (id: string, notes?: string) => {
    setIsLoading(true);
    try {
      setError(null);
      return await api.post<AdminApplicationDetail>(`/api/admin/loans/${id}/approve`, { notes });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al aprobar';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reject = useCallback(async (id: string, reason: string) => {
    setIsLoading(true);
    try {
      setError(null);
      return await api.post<AdminApplicationDetail>(`/api/admin/loans/${id}/reject`, { reason });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al rechazar';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const requestInfo = useCallback(async (id: string, message: string) => {
    setIsLoading(true);
    try {
      setError(null);
      return await api.post<AdminApplicationDetail>(`/api/admin/loans/${id}/request-info`, { message });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al solicitar información';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const assignReview = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      setError(null);
      return await api.post<AdminApplicationDetail>(`/api/admin/loans/${id}/review`);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al asignar';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { list, pagination, isLoading, error, listPending, getDetail, approve, reject, requestInfo, assignReview };
}
