'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { AdminApplicationDetail } from '@prestamos/shared';
import { useAdminLoans } from '@/features/admin/hooks/use-admin-loans';
import { useAdminPayments } from '@/features/admin/hooks/use-admin-payments';
import { AdminLoanReview } from '@/features/admin/components/admin-loan-review';
import { Loader2 } from 'lucide-react';

export default function AdminLoanReviewPage() {
  const params = useParams();
  const { getDetail, approve, reject, requestInfo, assignReview, isLoading, error } = useAdminLoans();
  const { disburse } = useAdminPayments();
  const [detail, setDetail] = useState<AdminApplicationDetail | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (params.id) {
      getDetail(params.id as string).then(setDetail);
    }
  }, [params.id, getDetail]);

  const handleApprove = useCallback(async (notes?: string) => {
    if (!detail) return;
    setIsProcessing(true);
    try {
      const result = await approve(detail.application.id, notes);
      if (result) setDetail(result);
    } finally {
      setIsProcessing(false);
    }
  }, [detail, approve]);

  const handleReject = useCallback(async (reason: string) => {
    if (!detail) return;
    setIsProcessing(true);
    try {
      const result = await reject(detail.application.id, reason);
      if (result) setDetail(result);
    } finally {
      setIsProcessing(false);
    }
  }, [detail, reject]);

  const handleRequestInfo = useCallback(async (message: string) => {
    if (!detail) return;
    setIsProcessing(true);
    try {
      const result = await requestInfo(detail.application.id, message);
      if (result) setDetail(result);
    } finally {
      setIsProcessing(false);
    }
  }, [detail, requestInfo]);

  const handleAssign = useCallback(async () => {
    if (!detail) return;
    setIsProcessing(true);
    try {
      const result = await assignReview(detail.application.id);
      if (result) setDetail(result);
    } finally {
      setIsProcessing(false);
    }
  }, [detail, assignReview]);

  const handleDisburse = useCallback(async (applicationId: string) => {
    setIsProcessing(true);
    try {
      return await disburse(applicationId);
    } finally {
      setIsProcessing(false);
    }
  }, [disburse]);

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
        <p className="text-destructive">{error ?? 'Solicitud no encontrada'}</p>
      </main>
    );
  }

  return (
    <main className="p-8">
      <AdminLoanReview
        detail={detail}
        onApprove={handleApprove}
        onReject={handleReject}
        onRequestInfo={handleRequestInfo}
        onAssign={handleAssign}
        onDisburse={handleDisburse}
        isProcessing={isProcessing}
      />
    </main>
  );
}
