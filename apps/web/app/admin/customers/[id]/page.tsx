'use client';

import { useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useAdminCustomers } from '@/features/admin/hooks/use-admin-customers';
import { AdminCustomerDetail } from '@/features/admin/components/admin-customer-detail';

export default function AdminCustomerDetailPage() {
  const params = useParams();
  const { detail, isLoading, error, getDetail } = useAdminCustomers();
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (params.id && !hasLoaded.current) {
      hasLoaded.current = true;
      getDetail(params.id as string);
    }
  }, [params.id, getDetail]);

  return (
    <div className="space-y-6">
      <AdminCustomerDetail
        customer={detail}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
}
