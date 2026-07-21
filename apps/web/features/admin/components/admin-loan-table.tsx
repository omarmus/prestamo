'use client';

import { useState } from 'react';
import type { AdminApplicationListItem } from '@prestamos/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/ui/card';
import { Badge } from '@/components/atoms/ui/badge';
import { Button } from '@/components/atoms/ui/button';
import { Input } from '@/components/atoms/ui/input';
import { Label } from '@/components/atoms/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/atoms/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/atoms/ui/table';
import { Search, Loader2 } from 'lucide-react';

const statusConfig: Record<string, { label: string; className: string }> = {
  DRAFT:          { label: 'Borrador', className: 'bg-gray-100 text-gray-700' },
  PENDING:        { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-700' },
  IN_REVIEW:      { label: 'En Revisión', className: 'bg-blue-100 text-blue-700' },
  INFO_REQUESTED: { label: 'Info. Requerida', className: 'bg-orange-100 text-orange-700' },
  APPROVED:       { label: 'Aprobado', className: 'bg-green-100 text-green-700' },
  REJECTED:       { label: 'Rechazado', className: 'bg-red-100 text-red-700' },
  CANCELLED:      { label: 'Cancelado', className: 'bg-gray-300 text-gray-800' },
};

export interface AdminLoanTableProps {
  applications: AdminApplicationListItem[];
  isLoading: boolean;
  pagination: { page: number; limit: number; total: number; totalPages: number } | null;
  onFilterChange: (filters: Record<string, string>) => void;
  onPageChange: (page: number) => void;
}

export function AdminLoanTable({ applications, isLoading, pagination, onFilterChange, onPageChange }: AdminLoanTableProps) {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const handleSearch = () => {
    const filters: Record<string, string> = {};
    if (status) filters.status = status;
    if (search) filters.search = search;
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;
    onFilterChange(filters);
  };

  const handleReset = () => {
    setStatus('');
    setSearch('');
    setDateFrom('');
    setDateTo('');
    onFilterChange({});
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Solicitudes de Préstamo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <Label className="text-xs">Estado</Label>
            <Select value={status} onValueChange={(v) => setStatus(v ?? '')}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">Todos</SelectItem>
                <SelectItem value="PENDING">Pendiente</SelectItem>
                <SelectItem value="IN_REVIEW">En Revisión</SelectItem>
                <SelectItem value="INFO_REQUESTED">Info. Requerida</SelectItem>
                <SelectItem value="APPROVED">Aprobado</SelectItem>
                <SelectItem value="REJECTED">Rechazado</SelectItem>
                <SelectItem value="CANCELLED">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Desde</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-[160px]" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Hasta</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-[160px]" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Nombre o DNI"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-[200px] pl-8"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
          </div>
          <Button size="sm" onClick={handleSearch}>
            <Search className="mr-1 h-4 w-4" />
            Filtrar
          </Button>
          <Button size="sm" variant="ghost" onClick={handleReset}>
            Limpiar
          </Button>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : applications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12">
            <p className="text-muted-foreground">No hay solicitudes pendientes</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Monto</TableHead>
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
                      onClick={() => window.location.href = `/admin/loans/${app.id}`}
                    >
                      <TableCell className="font-medium">
                        {app.customer.firstName} {app.customer.lastName ?? ''}
                      </TableCell>
                      <TableCell>{app.customer.documentNumber ?? '—'}</TableCell>
                      <TableCell>Bs. {app.amount.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell>
                        <Badge className={cfg.className} variant="outline">{cfg.label}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(app.createdAt).toLocaleDateString('es-BO')}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  Página {pagination.page} de {pagination.totalPages} ({pagination.total} solicitudes)
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Siguiente
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
