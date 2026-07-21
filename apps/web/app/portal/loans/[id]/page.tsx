'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { LoanApplicationResponse } from '@prestamos/shared';
import { useLoans } from '@/features/loans/hooks/use-loans';
import { LoanDetail } from '@/features/loans/components/loan-detail';
import { Loader2 } from 'lucide-react';

export default function LoanDetailPage() {
  const params = useParams();
  const { get, cancel, isLoading, error } = useLoans();
  const [application, setApplication] = useState<LoanApplicationResponse | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (params.id) {
      get(params.id as string).then(setApplication);
    }
  }, [params.id, get]);

  const handleCancel = useCallback(async () => {
    if (!application) return;
    setIsCancelling(true);
    try {
      const result = await cancel(application.id);
      if (result) {
        setApplication(result);
      }
    } finally {
      setIsCancelling(false);
    }
  }, [application, cancel]);

  if (isLoading) {
    return (
      <main className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </main>
    );
  }

  if (error || !application) {
    return (
      <main className="p-8">
        <p className="text-destructive">{error ?? 'Solicitud no encontrada'}</p>
      </main>
    );
  }

  return (
    <main className="p-8">
      <LoanDetail application={application} onCancel={handleCancel} isCancelling={isCancelling} />
    </main>
  );
}
