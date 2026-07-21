'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { AdminActiveLoanDetail } from '@prestamos/shared';
import { useAdminPayments } from '@/features/admin/hooks/use-admin-payments';
import { AdminLoanActiveDetail } from '@/features/admin/components/admin-loan-active-detail';
import { Button } from '@/components/atoms/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function AdminActiveLoanDetailPage() {
  const params = useParams();
  const { isLoading, error, getDetail, registerPayment } = useAdminPayments();
  const [detail, setDetail] = useState<AdminActiveLoanDetail | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (params.id) {
      getDetail(params.id as string).then(setDetail);
    }
  }, [params.id, getDetail]);

  const handleRegisterPayment = async (installmentId: string, data: { method: 'CASH' | 'TRANSFER'; reference?: string; notes?: string }) => {
    if (!detail) return false;
    setIsProcessing(true);
    try {
      const result = await registerPayment({
        loanId: detail.loan.id,
        amount: data.method === 'CASH' ? detail.loan.monthlyPayment : detail.loan.monthlyPayment,
        method: data.method,
        reference: data.reference,
        notes: data.notes,
      });
      if (result) {
        // Reload detail
        await getDetail(params.id as string).then(setDetail);
        return true;
      }
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

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
        <Button variant="ghost" onClick={() => window.location.href = '/admin/loans/active'}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>
      <AdminLoanActiveDetail
        detail={detail}
        onRegisterPayment={handleRegisterPayment}
        isProcessing={isProcessing}
      />
    </main>
  );
}
