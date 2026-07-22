'use client';

import { useCallback, useRef } from 'react';
import type { AdminCustomerListItem } from '@prestamos/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/ui/card';
import { Badge } from '@/components/atoms/ui/badge';
import { Button } from '@/components/atoms/ui/button';
import { Input } from '@/components/atoms/ui/input';
import { Skeleton } from '@/components/atoms/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/atoms/ui/table';
import { Search, UserCircle } from 'lucide-react';

const kycConfig: Record<string, { label: string; className: string }> = {
  APPROVED:  { label: 'Aprobado', className: 'bg-green-100 text-green-700' },
  PENDING:   { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-700' },
  REJECTED:  { label: 'Rechazado', className: 'bg-red-100 text-red-700' },
  NOT_SENT:  { label: 'No Enviado', className: 'bg-gray-100 text-gray-700' },
};

const statusConfig: Record<string, { label: string; className: string }> = {
  ACTIVE:   { label: 'Activo', className: 'bg-green-100 text-green-700' },
  INACTIVE: { label: 'Inactivo', className: 'bg-gray-100 text-gray-700' },
  BLOCKED:  { label: 'Bloqueado', className: 'bg-red-100 text-red-700' },
};

export interface AdminCustomerTableProps {
  customers: AdminCustomerListItem[];
  isLoading: boolean;
  pagination: { page: number; limit: number; total: number; totalPages: number } | null;
  onSearchChange: (search: string) => void;
  onPageChange: (page: number) => void;
}

function SkeletonRow() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-4 w-36" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
    </TableRow>
  );
}

export function AdminCustomerTable({
  customers,
  isLoading,
  pagination,
  onSearchChange,
  onPageChange,
}: AdminCustomerTableProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(() => {
        onSearchChange(value);
      }, 300);
    },
    [onSearchChange],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clientes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, documento o email..."
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Table */}
        {isLoading ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>KYC</TableHead>
                <TableHead>Registro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </TableBody>
          </Table>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12">
            <UserCircle className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No se encontraron clientes</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>KYC</TableHead>
                  <TableHead>Registro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => {
                  const kycCfg = kycConfig[customer.kycStatus] ?? { label: customer.kycStatus, className: '' };
                  const statusCfg = statusConfig[customer.status] ?? { label: customer.status, className: '' };
                  return (
                    <TableRow
                      key={customer.id}
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => window.location.href = `/admin/customers/${customer.id}`}
                    >
                      <TableCell className="font-medium">
                        {customer.firstName} {customer.lastName ?? ''}
                      </TableCell>
                      <TableCell>{customer.documentNumber ?? '—'}</TableCell>
                      <TableCell>{customer.email ?? '—'}</TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell>
                        <Badge className={statusCfg.className} variant="outline">{statusCfg.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={kycCfg.className} variant="outline">{kycCfg.label}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(customer.createdAt).toLocaleDateString('es-BO')}
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
                  Página {pagination.page} de {pagination.totalPages} ({pagination.total} clientes)
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
