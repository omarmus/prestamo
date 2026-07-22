import { DashboardMetrics } from '@/features/admin/components/dashboard-metrics';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Resumen general del sistema</p>
      </div>
      <DashboardMetrics />
    </div>
  );
}
