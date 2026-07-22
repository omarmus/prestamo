'use client';

import {
  FileText,
  Clock,
  CreditCard,
  DollarSign,
  Users,
} from 'lucide-react';
import { useAdminStats } from '@/features/admin/hooks/use-admin-stats';
import { MetricCard, MetricCardSkeleton, MetricCardGrid } from './metric-card';

export function DashboardMetrics() {
  const { stats, isLoading, error } = useAdminStats();

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (isLoading || !stats) {
    return (
      <MetricCardGrid>
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </MetricCardGrid>
    );
  }

  return (
    <MetricCardGrid>
      <MetricCard
        title="Total Solicitudes"
        value={String(stats.totalApplications)}
        icon={FileText}
      />
      <MetricCard
        title="Pendientes"
        value={String(stats.pendingApplications)}
        icon={Clock}
        description="Solicitudes por revisar"
      />
      <MetricCard
        title="Préstamos Activos"
        value={String(stats.activeLoans)}
        icon={CreditCard}
        description={`${stats.totalLoans} préstamos totales`}
      />
      <MetricCard
        title="Total Desembolsado"
        value={`$${stats.totalDisbursed.toLocaleString('es-PY')}`}
        icon={DollarSign}
      />
      <MetricCard
        title="Clientes Registrados"
        value={String(stats.totalCustomers)}
        icon={Users}
      />
    </MetricCardGrid>
  );
}
