'use client';

import type { ActiveLoanDetail } from '@prestamos/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/ui/card';
import { Badge } from '@/components/atoms/ui/badge';
import { buttonVariants } from '@/components/atoms/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/atoms/ui/table';
import { Download } from 'lucide-react';

const installmentStatusConfig: Record<string, { label: string; className: string }> = {
  PAID:    { label: 'Pagado', className: 'bg-green-100 text-green-700' },
  PENDING: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-700' },
  OVERDUE: { label: 'Vencido', className: 'bg-red-100 text-red-700' },
};

export interface ActiveLoanDetailProps {
  detail: ActiveLoanDetail;
}

export function ActiveLoanDetail({ detail }: ActiveLoanDetailProps) {
  const paid = detail.installments.filter((i) => i.status === 'PAID').length;
  const total = detail.installments.length;
  const progress = total > 0 ? Math.round((paid / total) * 100) : 0;
  const nextPending = detail.installments.find((i) => i.status === 'PENDING' || i.status === 'OVERDUE');

  return (
    <div className="space-y-6">
      {/* Loan Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle del Préstamo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Monto</p>
              <p className="text-lg font-semibold">
                Bs. {detail.amount.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cuota Mensual</p>
              <p className="text-lg font-semibold">
                Bs. {detail.monthlyPayment.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Plazo</p>
              <p className="text-lg font-semibold">{detail.termMonths} meses</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tasa</p>
              <p className="text-lg font-semibold">{detail.annualRate}% anual</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Interés</p>
              <p className="font-medium">
                Bs. {detail.totalInterest.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total a Pagar</p>
              <p className="font-medium">
                Bs. {detail.totalPayment.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Saldo Pendiente</p>
              <p className="font-medium text-destructive">
                Bs. {detail.outstandingBalance.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Desembolsado</p>
              <p className="font-medium">
                {new Date(detail.disbursedAt).toLocaleDateString('es-BO')}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progreso de pagos</span>
              <span className="font-medium">{paid}/{total} cuotas ({progress}%)</span>
            </div>
            <div className="h-2.5 rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Next Installment Highlight */}
          {nextPending && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
              <p className="text-xs font-medium text-yellow-800">Próxima cuota</p>
              <p className="text-sm text-yellow-900">
                Cuota #{nextPending.installmentNumber} — 
                Bs. {nextPending.totalAmount.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                {' '}— Vence {new Date(nextPending.dueDate).toLocaleDateString('es-BO')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contract Download */}
      {detail.status === 'ACTIVE' && (
        <div className="flex justify-end">
          <a
            href={`/api/loans/${detail.id}/contract`}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: 'outline' })}
          >
            <Download className="mr-2 h-4 w-4" />
            Descargar Contrato
          </a>
        </div>
      )}

      {/* Installments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Cronograma de Cuotas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Capital</TableHead>
                <TableHead>Interés</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Pagado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.installments.map((inst) => {
                const cfg = installmentStatusConfig[inst.status] ?? { label: inst.status, className: '' };
                return (
                  <TableRow key={inst.id}>
                    <TableCell className="font-medium">{inst.installmentNumber}</TableCell>
                    <TableCell>{new Date(inst.dueDate).toLocaleDateString('es-BO')}</TableCell>
                    <TableCell>
                      Bs. {inst.principalAmount.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      Bs. {inst.interestAmount.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="font-medium">
                      Bs. {inst.totalAmount.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Badge className={cfg.className} variant="outline">{cfg.label}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {inst.paidAt ? new Date(inst.paidAt).toLocaleDateString('es-BO') : '—'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Transactions Timeline */}
      {detail.transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Transacciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {detail.transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="text-sm font-medium">
                      {tx.type === 'DISBURSEMENT' ? 'Desembolso' :
                       tx.type === 'PAYMENT' ? 'Pago' : 'Ajuste'}
                    </p>
                    {tx.reference && (
                      <p className="text-xs text-muted-foreground">Ref: {tx.reference}</p>
                    )}
                    {tx.description && (
                      <p className="text-xs text-muted-foreground">{tx.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      Bs. {tx.amount.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleDateString('es-BO')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
