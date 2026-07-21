'use client';

import { useEffect } from 'react';
import { useLoans } from '@/features/loans/hooks/use-loans';
import { useActiveLoans } from '@/features/loans/hooks/use-active-loans';
import { LoanList } from '@/features/loans/components/loan-list';
import { ActiveLoanList } from '@/features/loans/components/active-loan-list';
import { Loader2 } from 'lucide-react';

export default function LoanListPage() {
  const { applications, isLoading: appsLoading, error: appsError, list } = useLoans();
  const { loans, isLoading: activeLoading, error: activeError, list: listActive } = useActiveLoans();

  useEffect(() => {
    list();
    listActive();
  }, [list, listActive]);

  return (
    <main className="space-y-8 p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mis Préstamos</h1>
        <p className="text-muted-foreground">Administrá tus préstamos y solicitudes</p>
      </div>

      {/* Active Loans */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Préstamos Activos</h2>
        </div>
        {activeLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : activeError ? (
          <p className="text-destructive">{activeError}</p>
        ) : (
          <ActiveLoanList loans={loans} />
        )}
      </section>

      {/* Applications */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Mis Solicitudes</h2>
        </div>
        {appsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : appsError ? (
          <p className="text-destructive">{appsError}</p>
        ) : (
          <LoanList applications={applications} />
        )}
      </section>
    </main>
  );
}
