'use client';

import { useCallback, useState } from 'react';
import type { SimulateLoanInput } from '@prestamos/shared';

export interface PublicSimulationResult {
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
}

export function usePublicSimulator() {
  const [result, setResult] = useState<PublicSimulationResult | null>(null);
  const [lastInput, setLastInput] = useState<SimulateLoanInput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculate = useCallback(async (input: SimulateLoanInput) => {
    setIsLoading(true);
    setError(null);
    setLastInput(input);
    try {
      const res = await fetch('/api/simulations/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? 'Error al calcular');
      }
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al calcular');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setLastInput(null);
    setError(null);
  }, []);

  return { result, lastInput, isLoading, error, calculate, reset };
}
