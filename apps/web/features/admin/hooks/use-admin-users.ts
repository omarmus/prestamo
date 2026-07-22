'use client';

import { useCallback, useState } from 'react';
import type { AdminUserListItem, AdminUserListResponse, CreateAdminUserInput, UserProfile } from '@prestamos/shared';
import { api, ApiError } from '@/lib/api-client';

export function useAdminUsers() {
  const [list, setList] = useState<AdminUserListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setError(null);
      const data = await api.get<AdminUserListResponse>('/api/admin/users');
      setList(data.data);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al cargar usuarios';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const create = useCallback(async (input: CreateAdminUserInput): Promise<UserProfile | null> => {
    setCreateLoading(true);
    setCreateError(null);
    try {
      const data = await api.post<UserProfile>('/api/admin/users', input);
      return data;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al crear usuario';
      setCreateError(message);
      return null;
    } finally {
      setCreateLoading(false);
    }
  }, []);

  return { list, isLoading, error, load, create, createLoading, createError };
}
