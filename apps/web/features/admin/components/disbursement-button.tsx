'use client';

import { useState } from 'react';
import type { DisburseLoanResponse } from '@prestamos/shared';
import { Button } from '@/components/atoms/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/atoms/ui/dialog';
import { Loader2, HandCoins } from 'lucide-react';

export interface DisbursementButtonProps {
  applicationId: string;
  amount: number;
  onDisburse: (applicationId: string) => Promise<DisburseLoanResponse | null>;
}

export function DisbursementButton({ applicationId, amount, onDisburse }: DisbursementButtonProps) {
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const result = await onDisburse(applicationId);
      if (result) {
        setOpen(false);
        window.location.href = `/admin/loans/active/${result.loan.id}`;
      } else {
        setError('Error al desembolsar el préstamo');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button className="w-full" size="lg">
          <HandCoins className="mr-2 h-5 w-5" />
          Desembolsar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar Desembolso</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de desembolsar este préstamo por{' '}
            <strong>Bs. {amount.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</strong>?
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="text-sm font-medium text-destructive">{error}</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isProcessing}>
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Confirmar Desembolso
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
