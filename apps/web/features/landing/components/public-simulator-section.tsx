'use client';

import { usePublicSimulator } from '@/features/landing/hooks/use-public-simulator';
import { SimulatorForm } from '@/features/portal/components/simulator-form';
import { AmortizationTable } from '@/features/portal/components/amortization-table';

export function PublicSimulatorSection() {
  const { result, lastInput, isLoading, error, calculate } = usePublicSimulator();

  return (
    <section className="py-16 md:py-24 px-4 bg-muted/50">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">Simulá tu préstamo</h2>
        <p className="text-center text-muted-foreground mb-8">
          Calculá tus cuotas mensuales al instante, sin compromiso.
        </p>
        <SimulatorForm onSimulate={calculate} isLoading={isLoading} />
        {error && (
          <p className="text-destructive text-center mt-4">{error}</p>
        )}
        {result && lastInput && !isLoading && (
          <div className="mt-8 space-y-6">
            <AmortizationTable
              result={{
                amount: lastInput.amount,
                termMonths: lastInput.termMonths,
                annualRate: lastInput.annualRate,
                ...result,
              }}
            />
          </div>
        )}
      </div>
    </section>
  );
}
