'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/ui/card';
import { Badge } from '@/components/atoms/ui/badge';
import { Skeleton } from '@/components/atoms/ui/skeleton';
import { cn } from '@/lib/utils';
import { Clock, ChevronDown } from 'lucide-react';

// ponytail: matches the shape returned by useSimulator hook
interface AmortizationRow {
  period: number;
  payment: number;
  interest: number;
  principal: number;
  balance: number;
}

export interface SimulationResult {
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

export interface SimulationHistoryProps {
  simulations: SimulationResult[];
  isLoading: boolean;
  onSelect: (simulation: SimulationResult) => void;
}

export function SimulationHistory({ simulations, isLoading, onSelect }: SimulationHistoryProps) {
  const [expanded, setExpanded] = useState(false);

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Simulaciones Anteriores</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (simulations.length === 0) return null;

  const recent = simulations.slice(0, 5);

  return (
    <Card>
      <CardHeader
        className="flex cursor-pointer flex-row items-center justify-between"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm">Simulaciones Anteriores</CardTitle>
          <Badge variant="secondary" className="text-xs">{simulations.length}</Badge>
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-muted-foreground transition-transform',
            expanded && 'rotate-180',
          )}
        />
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-2 pt-0">
          {recent.map((sim) => (
            <div
              key={sim.id}
              className="flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent"
              onClick={() => onSelect(sim)}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  Bs. {sim.amount.toLocaleString('es-BO')} — {sim.termMonths} meses
                </p>
                <p className="text-xs text-muted-foreground">
                  Cuota: Bs. {sim.monthlyPayment.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs text-muted-foreground">
                  {new Date(sim.createdAt).toLocaleDateString('es-BO')}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}
