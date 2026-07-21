'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAdminLoans } from '@/features/admin/hooks/use-admin-loans';
import { AdminLoanTable } from '@/features/admin/components/admin-loan-table';

export default function AdminLoanListPage() {
  const { list, pagination, isLoading, error, listPending } = useAdminLoans();
  const [filters, setFilters] = useState<Record<string, string>>({});

  useEffect(() => {
    listPending(filters);
  }, [listPending, filters]);

  const handleFilterChange = useCallback((newFilters: Record<string, string>) => {
    setFilters({ ...newFilters, page: '1' });
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page: String(page) }));
  }, []);

  if (error) {
    return (
      <main className="p-8">
        <p className="text-destructive">{error}</p>
      </main>
    );
  }

  return (
    <main className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Gestión de Préstamos</h1>
        <p className="text-muted-foreground">Revisá y administrá las solicitudes de préstamo</p>
      </div>
      <AdminLoanTable
        applications={list}
        isLoading={isLoading}
        pagination={pagination}
        onFilterChange={handleFilterChange}
        onPageChange={handlePageChange}
      />
    </main>
  );
}
