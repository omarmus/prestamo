'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { CreateLoanApplicationInput, LoanApplicationResponse } from '@prestamos/shared';
import { CreateLoanApplicationSchema } from '@prestamos/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/ui/card';
import { Button } from '@/components/atoms/ui/button';
import { Input } from '@/components/atoms/ui/input';
import { Label } from '@/components/atoms/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/atoms/ui/select';
import { Loader2 } from 'lucide-react';

type LoanPurpose = 'NEGOCIO' | 'EDUCACION' | 'SALUD' | 'VIAJE' | 'OTRO';

export interface LoanFormProps {
  simulationId?: string;
  initialValues?: {
    amount?: number;
    termMonths?: number;
    annualRate?: number;
    monthlyPayment?: number;
  };
  onSubmit: (input: CreateLoanApplicationInput & { submit?: boolean }) => Promise<LoanApplicationResponse | null>;
}

export function LoanForm({ simulationId, initialValues, onSubmit }: LoanFormProps) {
  const router = useRouter();
  const [amount, setAmount] = useState(String(initialValues?.amount ?? ''));
  const [termMonths, setTermMonths] = useState(String(initialValues?.termMonths ?? ''));
  const [annualRate, setAnnualRate] = useState(String(initialValues?.annualRate ?? ''));
  const [purpose, setPurpose] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialValues) {
      setAmount(String(initialValues.amount ?? ''));
      setTermMonths(String(initialValues.termMonths ?? ''));
      setAnnualRate(String(initialValues.annualRate ?? ''));
    }
  }, [initialValues]);

  const handleSubmit = async () => {
    const input = {
      ...(simulationId
        ? { simulationId }
        : {
            amount: amount ? Number(amount) : undefined,
            termMonths: termMonths ? Number(termMonths) : undefined,
            annualRate: annualRate ? Number(annualRate) : undefined,
          }),
      purpose: (purpose as LoanPurpose) || undefined,
      submit: true,
    } as CreateLoanApplicationInput & { submit?: boolean };

    const result = CreateLoanApplicationSchema.safeParse(input);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join('.');
        fieldErrors[path] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setSaving(true);
    try {
      const data = await onSubmit(input);
      if (data) {
        router.push(`/portal/loans/${data.id}`);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{simulationId ? 'Solicitar desde Simulación' : 'Nueva Solicitud de Préstamo'}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {simulationId && initialValues && (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Monto (Bs.)</Label>
                <Input value={String(initialValues.amount ?? '')} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Plazo (meses)</Label>
                <Input value={String(initialValues.termMonths ?? '')} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Tasa Anual (%)</Label>
                <Input value={String(initialValues.annualRate ?? '')} readOnly />
              </div>
            </div>
          )}

          {!simulationId && (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Monto (Bs.)</Label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min={100}
                    max={500000}
                  />
                  {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Plazo (meses)</Label>
                  <Input
                    type="number"
                    value={termMonths}
                    onChange={(e) => setTermMonths(e.target.value)}
                    min={3}
                    max={120}
                  />
                  {errors.termMonths && <p className="text-xs text-destructive">{errors.termMonths}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Tasa Anual (%)</Label>
                  <Input
                    type="number"
                    value={annualRate}
                    onChange={(e) => setAnnualRate(e.target.value)}
                    min={0.1}
                    step={0.1}
                    max={36}
                  />
                  {errors.annualRate && <p className="text-xs text-destructive">{errors.annualRate}</p>}
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Propósito del Préstamo</Label>
            <Select value={purpose} onValueChange={(v) => v && setPurpose(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar propósito" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NEGOCIO">Negocio</SelectItem>
                <SelectItem value="EDUCACION">Educación</SelectItem>
                <SelectItem value="SALUD">Salud</SelectItem>
                <SelectItem value="VIAJE">Viaje</SelectItem>
                <SelectItem value="OTRO">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {errors.simulationId && (
            <p className="text-sm text-destructive">{errors.simulationId}</p>
          )}

          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Enviar solicitud
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
