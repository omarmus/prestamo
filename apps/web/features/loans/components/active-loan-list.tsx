'use client';

import type { ActiveLoanSummary } from '@prestamos/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/ui/card';
import { Badge } from '@/components/atoms/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/atoms/ui/table';

const statusConfig: Record<string, { label: string; className: string }> = {
  ACTIVE:    { label: 'Activo', className: 'bg-green-100 text-green-700' },
  CLOSED:    { label: 'Pagado', className: 'bg-blue-100 text-blue-700' },
  DEFAULTED: { label: 'Moroso', className: 'bg-red-100 text-red-700' },
};

export interface ActiveLoanListProps {
  loans: ActiveLoanSummary[];
}

export function ActiveLoanList({ loans }: ActiveLoanListProps) {
  if (loans.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Préstamos Activos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <p className="text-center text-muted-foreground">No tenés préstamos activos</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Préstamos Activos</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Monto Original</TableHead>
              <TableHead>Saldo Pendiente</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Progreso</TableHead>
              <TableHead>Próximo Pago</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loans.map((loan) => {
              const cfg = statusConfig[loan.status] ?? { label: loan.status, className: '' };
              const progress = loan.totalInstallments > 0
                ? Math.round((loan.paidInstallments / loan.totalInstallments) * 100)
                : 0;
              return (
                <TableRow
                  key={loan.id}
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => window.location.href = `/portal/loans/active/${loan.id}`}
                >
                  <TableCell className="font-medium">
                    Bs. {loan.amount.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    Bs. {loan.outstandingBalance.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <Badge className={cfg.className} variant="outline">{cfg.label}</Badge>
                  </TableCell>
                  <TableCell className="min-w-[140px]">
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {loan.paidInstallments}/{loan.totalInstallments}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {loan.nextPaymentDate && loan.nextPaymentAmount ? (
                      <>
                        {new Date(loan.nextPaymentDate).toLocaleDateString('es-BO')}
                        <br />
                        <span className="text-xs">
                          Bs. {loan.nextPaymentAmount.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
