'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAdminCustomers } from '@/features/admin/hooks/use-admin-customers';
import { AdminCustomerTable } from '@/features/admin/components/admin-customer-table';

export default function AdminCustomersPage() {
  const { list, pagination, isLoading, error, search } = useAdminCustomers();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (!hasLoaded.current) {
      hasLoaded.current = true;
      search({ page: 1 });
    }
  }, [search]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setPage(1);
    search({ search: value || undefined, page: 1 });
  }, [search]);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    search({ search: searchQuery || undefined, page: newPage });
  }, [search, searchQuery]);

  if (error) {
    return (
      <div className="p-8">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
        <p className="text-muted-foreground">Buscar y gestionar clientes</p>
      </div>
      <AdminCustomerTable
        customers={list}
        isLoading={isLoading}
        pagination={pagination}
        onSearchChange={handleSearchChange}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
