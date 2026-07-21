'use client';

import { useEffect } from 'react';
import { useLoans } from '@/features/loans/hooks/use-loans';
import { LoanList } from '@/features/loans/components/loan-list';
import { Loader2 } from 'lucide-react';

export default function LoanListPage() {
  const { applications, isLoading, error, list } = useLoans();

  useEffect(() => {
    list();
  }, [list]);

  if (isLoading) {
    return (
      <main className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-8">
        <p className="text-destructive">{error}</p>
      </main>
    );
  }

  return (
    <main className="p-8">
      <LoanList applications={applications} />
    </main>
  );
}
