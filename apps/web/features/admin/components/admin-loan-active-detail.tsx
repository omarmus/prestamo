'use client';

import type { AdminActiveLoanDetail } from '@prestamos/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/ui/card';
import { Badge } from '@/components/atoms/ui/badge';
import { Button } from '@/components/atoms/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/atoms/ui/table';
import { PaymentDialog } from './payment-dialog';

const statusConfig: Record<string, { label: string; className: string }> = {
  ACTIVE:    { label: 'Activo', className: 'bg-green-100 text-green-700' },
  CLOSED:    { label: 'Pagado', className: 'bg-blue-100 text-blue-700' },
  DEFAULTED: { label: 'Moroso', className: 'bg-red-100 text-red-700' },
};

const installmentStatusConfig: Record<string, { label: string; className: string }> = {
  PAID:    { label: 'Pagado', className: 'bg-green-100 text-green-700' },
  PENDING: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-700' },
  OVERDUE: { label: 'Vencido', className: 'bg-red-100 text-red-700' },
};

export interface AdminLoanActiveDetailProps {
  detail: AdminActiveLoanDetail;
  onRegisterPayment: (installmentId: string, data: { method: 'CASH' | 'TRANSFER'; reference?: string; notes?: string }) => Promise<boolean>;
  isProcessing: boolean;
}

export function AdminLoanActiveDetail({ detail, onRegisterPayment, isProcessing }: AdminLoanActiveDetailProps) {
  const { loan, customer, installments, transactions } = detail;
  const loanCfg = statusConfig[loan.status] ?? { label: loan.status, className: '' };
  const paid = installments.filter((i) => i.status === 'PAID').length;
  const total = installments.length;
  const progress = total > 0 ? Math.round((paid / total) * 100) : 0;
  const nextPending = installments.find((i) => i.status === 'PENDING' || i.status === 'OVERDUE');

  return (
    <div className="space-y-6">
      {/* Loan + Customer Info */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Datos del Préstamo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Monto</p>
                <p className="font-medium">Bs. {loan.amount.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Saldo Pendiente</p>
                <p className="font-medium">Bs. {loan.outstandingBalance.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cuota Mensual</p>
                <p className="font-medium">Bs. {loan.monthlyPayment.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Plazo</p>
                <p className="font-medium">{loan.termMonths} meses</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tasa Anual</p>
                <p className="font-medium">{loan.annualRate}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Estado</p>
                <Badge className={loanCfg.className} variant="outline">{loanCfg.label}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Desembolsado</p>
                <p className="font-medium">{new Date(loan.disbursedAt).toLocaleDateString('es-BO')}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Interés</p>
                <p className="font-medium">Bs. {loan.totalInterest.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Datos del Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Nombre</p>
                <p className="font-medium">{customer.firstName} {customer.lastName ?? ''}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Documento</p>
                <p className="font-medium">{customer.documentNumber ?? '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Progreso de Pagos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{paid} de {total} cuotas pagadas</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardContent>
      </Card>

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
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {installments.map((inst) => {
                const cfg = installmentStatusConfig[inst.status] ?? { label: inst.status, className: '' };
                const isNextPending = nextPending?.id === inst.id;
                return (
                  <TableRow key={inst.id} className={isNextPending ? 'bg-yellow-50/50' : ''}>
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
                    <TableCell>
                      {isNextPending && loan.status === 'ACTIVE' && (
                        <PaymentDialog
                          loanId={loan.id}
                          installmentNumber={inst.installmentNumber}
                          amount={inst.totalAmount}
                          dueDate={inst.dueDate}
                          onConfirm={(data) => onRegisterPayment(inst.id, data)}
                        >
                          <Button size="sm" disabled={isProcessing}>
                            Cobrar
                          </Button>
                        </PaymentDialog>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Transactions */}
      {transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Transacciones</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <Badge variant="outline">
                        {tx.type === 'DISBURSEMENT' ? 'Desembolso' :
                         tx.type === 'PAYMENT' ? 'Pago' : 'Ajuste'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      Bs. {tx.amount.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{tx.reference ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{tx.description ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleDateString('es-BO')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
