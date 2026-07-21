'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { ActiveLoanDetail } from '@prestamos/shared';
import { useActiveLoans } from '@/features/loans/hooks/use-active-loans';
import { ActiveLoanDetail as ActiveLoanDetailComponent } from '@/features/loans/components/active-loan-detail';
import { Button } from '@/components/atoms/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function ActiveLoanDetailPage() {
  const params = useParams();
  const { isLoading, error, getDetail } = useActiveLoans();
  const [detail, setDetail] = useState<ActiveLoanDetail | null>(null);

  useEffect(() => {
    if (params.id) {
      getDetail(params.id as string).then(setDetail);
    }
  }, [params.id, getDetail]);

  if (isLoading) {
    return (
      <main className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </main>
    );
  }

  if (error || !detail) {
    return (
      <main className="p-8">
        <p className="text-destructive">{error ?? 'Préstamo no encontrado'}</p>
      </main>
    );
  }

  return (
    <main className="p-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => window.location.href = '/portal/loans'}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>
      <ActiveLoanDetailComponent detail={detail} />
    </main>
  );
}
