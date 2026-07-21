'use client';

import { useState } from 'react';
import type { AdminActiveLoanListItem } from '@prestamos/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/ui/card';
import { Badge } from '@/components/atoms/ui/badge';
import { Button } from '@/components/atoms/ui/button';
import { Input } from '@/components/atoms/ui/input';
import { Label } from '@/components/atoms/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/atoms/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/atoms/ui/table';
import { Search, Loader2 } from 'lucide-react';

const statusConfig: Record<string, { label: string; className: string }> = {
  ACTIVE:    { label: 'Activo', className: 'bg-green-100 text-green-700' },
  CLOSED:    { label: 'Pagado', className: 'bg-blue-100 text-blue-700' },
  DEFAULTED: { label: 'Moroso', className: 'bg-red-100 text-red-700' },
};

export interface AdminLoanActiveTableProps {
  loans: AdminActiveLoanListItem[];
  isLoading: boolean;
  pagination: { page: number; limit: number; total: number; totalPages: number } | null;
  onFilterChange: (filters: Record<string, string>) => void;
  onPageChange: (page: number) => void;
}

export function AdminLoanActiveTable({ loans, isLoading, pagination, onFilterChange, onPageChange }: AdminLoanActiveTableProps) {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  const handleSearch = () => {
    const filters: Record<string, string> = {};
    if (status) filters.status = status;
    if (search) filters.search = search;
    onFilterChange(filters);
  };

  const handleReset = () => {
    setStatus('');
    setSearch('');
    onFilterChange({});
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Préstamos Activos</CardTitle>
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
                <SelectItem value="ACTIVE">Activo</SelectItem>
                <SelectItem value="CLOSED">Pagado</SelectItem>
                <SelectItem value="DEFAULTED">Moroso</SelectItem>
              </SelectContent>
            </Select>
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
        ) : loans.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12">
            <p className="text-muted-foreground">No hay préstamos activos</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Saldo</TableHead>
                  <TableHead>Cuotas</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.map((loan) => {
                  const cfg = statusConfig[loan.status] ?? { label: loan.status, className: '' };
                  return (
                    <TableRow
                      key={loan.id}
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => window.location.href = `/admin/loans/active/${loan.id}`}
                    >
                      <TableCell className="font-medium">
                        {loan.customer.firstName} {loan.customer.lastName ?? ''}
                      </TableCell>
                      <TableCell>{loan.customer.documentNumber ?? '—'}</TableCell>
                      <TableCell>
                        Bs. {loan.amount.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        Bs. {loan.outstandingBalance.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${loan.progress.totalCount > 0 ? (loan.progress.paidCount / loan.progress.totalCount) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {loan.progress.paidCount}/{loan.progress.totalCount}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cfg.className} variant="outline">{cfg.label}</Badge>
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
                  Página {pagination.page} de {pagination.totalPages} ({pagination.total} préstamos)
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
