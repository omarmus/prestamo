'use client';

import { useEffect, useState } from 'react';
import { useSimulator } from '@/features/portal/hooks/use-simulator';
import { Skeleton } from '@/components/atoms/ui/skeleton';
import { SimulatorForm } from '@/features/portal/components/simulator-form';
import { AmortizationTable } from '@/features/portal/components/amortization-table';
import { SimulationHistory } from '@/features/portal/components/simulation-history';
import type { CreateSimulationInput } from '@prestamos/shared';

// ponytail: matches the shape returned by useSimulator hook
interface AmortizationRow {
  period: number;
  payment: number;
  interest: number;
  principal: number;
  balance: number;
}

interface SimulationResult {
  id: string;
  amount: number;
  termMonths: number;
  annualRate: number;
  monthlyPayment: number;
  totalInterest: number;
  totalPayment: number;
  schedule: AmortizationRow[];
  createdAt: string;
}

export default function SimulatorPage() {
  const { simulations, lastResult, isLoading, error, fetchSimulations, simulate } = useSimulator();
  const [selectedSim, setSelectedSim] = useState<SimulationResult | null>(null);

  useEffect(() => {
    fetchSimulations();
  }, [fetchSimulations]);

  const initialValues = selectedSim
    ? {
        amount: String(selectedSim.amount),
        termMonths: String(selectedSim.termMonths),
        annualRate: String(selectedSim.annualRate),
      }
    : undefined;

  const handleSimulate = async (input: CreateSimulationInput) => {
    await simulate(input);
    setSelectedSim(null);
  };

  const handleSelect = (sim: SimulationResult) => {
    setSelectedSim(sim);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Simulador de Préstamos</h1>
        <p className="text-muted-foreground">Calculá tus cuotas mensuales simulando un préstamo</p>
      </div>

      <SimulatorForm
        key={selectedSim?.id ?? 'default'}
        initialValues={initialValues}
        onSimulate={handleSimulate}
        isLoading={isLoading}
      />

      {error && <p className="text-destructive">{error}</p>}

      {isLoading && !lastResult && (
        <div className="space-y-2">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      )}

      {lastResult && !isLoading && (
        <AmortizationTable result={lastResult} />
      )}

      <SimulationHistory
        simulations={simulations}
        isLoading={isLoading}
        onSelect={handleSelect}
      />
    </div>
  );
}
