'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAdminPayments } from '@/features/admin/hooks/use-admin-payments';
import { AdminLoanActiveTable } from '@/features/admin/components/admin-loan-active-table';

export default function AdminActiveLoanListPage() {
  const { loans, pagination, isLoading, error, listActive } = useAdminPayments();
  const [filters, setFilters] = useState<Record<string, string>>({});

  useEffect(() => {
    listActive(filters);
  }, [listActive, filters]);

  const handleFilterChange = useCallback((newFilters: Record<string, string>) => {
    setFilters({ ...newFilters, page: '1' });
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page: String(page) }));
  }, []);

  if (error) {
    return (
      <div className="p-8">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Gestión de Pagos</h1>
        <p className="text-muted-foreground">Administrá los préstamos activos y registrá pagos</p>
      </div>
      <AdminLoanActiveTable
        loans={loans}
        isLoading={isLoading}
        pagination={pagination}
        onFilterChange={handleFilterChange}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
