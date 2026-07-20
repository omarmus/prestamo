'use client';

import { useState } from 'react';
import type { CreateSimulationInput } from '@prestamos/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/ui/card';
import { Button } from '@/components/atoms/ui/button';
import { Input } from '@/components/atoms/ui/input';
import { Label } from '@/components/atoms/ui/label';
import { Calculator, Loader2 } from 'lucide-react';

export interface SimulatorFormProps {
  onSimulate: (input: CreateSimulationInput) => Promise<unknown>;
  isLoading: boolean;
  initialValues?: { amount: string; termMonths: string; annualRate: string };
}

export function SimulatorForm({ onSimulate, isLoading, initialValues }: SimulatorFormProps) {
  const [amount, setAmount] = useState(initialValues?.amount ?? '10000');
  const [termMonths, setTermMonths] = useState(initialValues?.termMonths ?? '12');
  const [annualRate, setAnnualRate] = useState(initialValues?.annualRate ?? '12');

  // ponytail: sync when initialValues changes (e.g. history selection)
  // Using a key on the parent to remount is cleaner, but this works for now
  const handleSimulate = async () => {
    await onSimulate({
      amount: Number(amount),
      termMonths: Number(termMonths),
      annualRate: Number(annualRate),
    });
  };

  return (
    <Card>
      <CardHeader><CardTitle>Datos del Préstamo</CardTitle></CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Monto (Bs.)</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min={100} />
          </div>
          <div className="space-y-2">
            <Label>Plazo (meses)</Label>
            <Input type="number" value={termMonths} onChange={(e) => setTermMonths(e.target.value)} min={1} max={120} />
          </div>
          <div className="space-y-2">
            <Label>Tasa Anual (%)</Label>
            <Input type="number" value={annualRate} onChange={(e) => setAnnualRate(e.target.value)} min={0.1} step={0.1} />
          </div>
        </div>
        <Button className="mt-4" onClick={handleSimulate} disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calculator className="mr-2 h-4 w-4" />}
          Simular
        </Button>
      </CardContent>
    </Card>
  );
}
