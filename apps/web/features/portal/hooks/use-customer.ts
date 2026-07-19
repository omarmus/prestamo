'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CustomerProfile, FullCustomerProfile } from '@prestamos/shared';
import { api, ApiError } from '@/lib/api-client';

// ponytail: single hook for customer profile + sub-entities CRUD

export function useCustomer() {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [fullProfile, setFullProfile] = useState<FullCustomerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setError(null);
      const data = await api.get<CustomerProfile>('/api/customers/me');
      setProfile(data);
      return data;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al cargar perfil';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchFullProfile = useCallback(async () => {
    try {
      setError(null);
      const data = await api.get<FullCustomerProfile>('/api/customers/me/full');
      setFullProfile(data);
      return data;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al cargar perfil completo';
      setError(message);
      return null;
    }
  }, []);

  const updateProfile = useCallback(async (data: Record<string, unknown>) => {
    const updated = await api.put<CustomerProfile>('/api/customers/me', data);
    setProfile(updated);
    return updated;
  }, []);

  // Sub-entity CRUD helpers
  const createSubEntity = useCallback(async (endpoint: string, data: Record<string, unknown>) => {
    return api.post(`/api/customers/me/${endpoint}`, data);
  }, []);

  const updateSubEntity = useCallback(async (endpoint: string, id: string, data: Record<string, unknown>) => {
    return api.put(`/api/customers/me/${endpoint}/${id}`, data);
  }, []);

  const deleteSubEntity = useCallback(async (endpoint: string, id: string) => {
    return api.delete(`/api/customers/me/${endpoint}/${id}`);
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    fullProfile,
    isLoading,
    error,
    fetchProfile,
    fetchFullProfile,
    updateProfile,
    createSubEntity,
    updateSubEntity,
    deleteSubEntity,
  };
}
