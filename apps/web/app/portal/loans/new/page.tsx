'use client';

import { useSearchParams } from 'next/navigation';
import { LoanForm } from '@/features/loans/components/loan-form';
import { useLoans } from '@/features/loans/hooks/use-loans';

export default function LoanFormPage() {
  const searchParams = useSearchParams();
  const simulationId = searchParams.get('simulationId') ?? undefined;
  const { create } = useLoans();

  return (
    <main className="p-8">
      <LoanForm simulationId={simulationId} onSubmit={create} />
    </main>
  );
}
