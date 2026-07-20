'use client';

import type { DocumentResponse } from '@prestamos/shared';
import { CardContent } from '@/components/atoms/ui/card';
import { Badge } from '@/components/atoms/ui/badge';
import { Skeleton } from '@/components/atoms/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/atoms/ui/table';
import { FileText } from 'lucide-react';

const docTypeLabels: Record<string, string> = {
  CI_FRONT: 'Cédula Frente',
  CI_BACK: 'Cédula Reverso',
  SELFIE: 'Selfie',
  PAYSLIP: 'Recibo de Sueldo',
  BANK_STATEMENT: 'Estado de Cuenta',
  SERVICE_BILL: 'Factura de Servicio',
};

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PENDING: 'secondary',
  VERIFIED: 'default',
  REJECTED: 'destructive',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  VERIFIED: 'Verificado',
  REJECTED: 'Rechazado',
};

export interface DocumentListProps {
  documents: DocumentResponse[];
  isLoading: boolean;
  error?: string | null;
}

export function DocumentList({ documents, isLoading, error }: DocumentListProps) {
  if (isLoading) {
    return (
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </CardContent>
    );
  }

  if (error) {
    return (
      <CardContent>
        <p className="text-destructive">{error}</p>
      </CardContent>
    );
  }

  if (documents.length === 0) {
    return (
      <CardContent>
        <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
          <FileText className="h-12 w-12" />
          <p>No subiste documentos todavía</p>
        </div>
      </CardContent>
    );
  }

  return (
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo</TableHead>
            <TableHead>Archivo</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fecha</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell>{docTypeLabels[doc.type] ?? doc.type}</TableCell>
              <TableCell className="max-w-40 truncate">{doc.fileName ?? '—'}</TableCell>
              <TableCell>
                <Badge variant={statusVariant[doc.status] ?? 'outline'}>
                  {statusLabels[doc.status] ?? doc.status}
                </Badge>
              </TableCell>
              <TableCell>{new Date(doc.createdAt).toLocaleDateString('es-BO')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  );
}
