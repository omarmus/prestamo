'use client';

import { useState } from 'react';
import { Button } from '@/components/atoms/ui/button';
import { Input } from '@/components/atoms/ui/input';
import { Label } from '@/components/atoms/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/atoms/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/atoms/ui/dialog';
import { Loader2 } from 'lucide-react';

export interface PaymentDialogProps {
  loanId: string;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  onConfirm: (data: { method: 'CASH' | 'TRANSFER'; reference?: string; notes?: string }) => Promise<boolean>;
  children?: React.ReactNode;
}

export function PaymentDialog({ loanId, installmentNumber, amount, dueDate, onConfirm, children }: PaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<'CASH' | 'TRANSFER'>('CASH');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<'idle' | 'success' | 'error'>('idle');

  const handleConfirm = async () => {
    setIsProcessing(true);
    setResult('idle');
    try {
      const ok = await onConfirm({ method, reference: reference || undefined, notes: notes || undefined });
      if (ok) {
        setResult('success');
        setTimeout(() => setOpen(false), 1000);
      } else {
        setResult('error');
      }
    } catch {
      setResult('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setMethod('CASH');
      setReference('');
      setNotes('');
      setResult('idle');
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger>
        {children ?? <Button size="sm">Registrar Pago</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Pago</DialogTitle>
          <DialogDescription>
            Cuota #{installmentNumber} — Bs. {amount.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Vencimiento</p>
            <p className="font-medium">{new Date(dueDate).toLocaleDateString('es-BO')}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Monto a pagar</p>
            <p className="text-lg font-semibold">
              Bs. {amount.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Método de pago</Label>
            <Select value={method} onValueChange={(v) => setMethod(v as 'CASH' | 'TRANSFER')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Efectivo</SelectItem>
                <SelectItem value="TRANSFER">Transferencia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Referencia (opcional)</Label>
            <Input
              placeholder="Nº de recibo o referencia"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Input
              placeholder="Notas adicionales..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
            />
          </div>

          {result === 'success' && (
            <p className="text-sm font-medium text-green-600">Pago registrado exitosamente</p>
          )}
          {result === 'error' && (
            <p className="text-sm font-medium text-destructive">Error al registrar el pago</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isProcessing}>
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Registrar Pago
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
