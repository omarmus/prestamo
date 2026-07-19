'use client';

import { useCallback, useState } from 'react';
import type { CreateSimulationInput } from '@prestamos/shared';
import { api, ApiError } from '@/lib/api-client';

interface SimulationResult {
  id: string;
  amount: number;
  termMonths: number;
  annualRate: number;
  monthlyPayment: number;
  totalInterest: number;
  totalPayment: number;
  schedule: Array<{
    period: number;
    payment: number;
    interest: number;
    principal: number;
    balance: number;
  }>;
  createdAt: string;
}

export function useSimulator() {
  const [simulations, setSimulations] = useState<SimulationResult[]>([]);
  const [lastResult, setLastResult] = useState<SimulationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSimulations = useCallback(async () => {
    setIsLoading(true);
    try {
      setError(null);
      const data = await api.get<SimulationResult[]>('/api/customers/me/simulations');
      setSimulations(data);
      return data;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al cargar simulaciones';
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const simulate = useCallback(async (input: CreateSimulationInput) => {
    setIsLoading(true);
    try {
      setError(null);
      const data = await api.post<SimulationResult>('/api/customers/me/simulations', input as unknown as Record<string, unknown>);
      setLastResult(data);
      setSimulations((prev) => [data, ...prev]);
      return data;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al simular';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { simulations, lastResult, isLoading, error, fetchSimulations, simulate };
}
