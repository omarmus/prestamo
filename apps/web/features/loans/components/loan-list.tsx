'use client';

import Link from 'next/link';
import type { LoanApplicationResponse } from '@prestamos/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/ui/card';
import { Badge } from '@/components/atoms/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/atoms/ui/table';
import { buttonVariants } from '@/components/atoms/ui/button';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; className: string }> = {
  DRAFT:          { label: 'Borrador', className: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
  PENDING:        { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
  IN_REVIEW:      { label: 'En Revisión', className: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
  INFO_REQUESTED: { label: 'Info. Requerida', className: 'bg-orange-100 text-orange-700 hover:bg-orange-200' },
  APPROVED:       { label: 'Aprobado', className: 'bg-green-100 text-green-700 hover:bg-green-200' },
  REJECTED:       { label: 'Rechazado', className: 'bg-red-100 text-red-700 hover:bg-red-200' },
  CANCELLED:      { label: 'Cancelado', className: 'bg-gray-300 text-gray-800 hover:bg-gray-400' },
};

const purposeLabels: Record<string, string> = {
  NEGOCIO: 'Negocio',
  EDUCACION: 'Educación',
  SALUD: 'Salud',
  VIAJE: 'Viaje',
  OTRO: 'Otro',
};

export interface LoanListProps {
  applications: LoanApplicationResponse[];
}

export function LoanList({ applications }: LoanListProps) {
  if (applications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mis Préstamos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <p className="text-center text-muted-foreground">No tienes solicitudes de préstamo</p>
          <Link
            href="/portal/simulator"
            className={cn(buttonVariants({ variant: 'default' }), 'cursor-pointer')}
          >
            Simular un préstamo
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mis Préstamos</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Monto</TableHead>
              <TableHead>Plazo</TableHead>
              <TableHead>Cuota Mensual</TableHead>
              <TableHead>Propósito</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((app) => {
              const cfg = statusConfig[app.status] ?? { label: app.status, className: '' };
              return (
                <TableRow
                  key={app.id}
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => window.location.href = `/portal/loans/${app.id}`}
                >
                  <TableCell className="font-medium">
                    Bs. {app.amount.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>{app.termMonths} meses</TableCell>
                  <TableCell>
                    Bs. {app.monthlyPayment.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>{purposeLabels[app.purpose ?? ''] ?? app.purpose ?? '—'}</TableCell>
                  <TableCell>
                    <Badge className={cfg.className} variant="outline">
                      {cfg.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(app.createdAt).toLocaleDateString('es-BO')}
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
