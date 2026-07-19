'use client';

import { useEffect, useState } from 'react';
import { useCustomer } from '@/features/portal/hooks/use-customer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/ui/card';
import { Badge } from '@/components/atoms/ui/badge';
import { Skeleton } from '@/components/atoms/ui/skeleton';
import { UserCircle, FileText, Calculator, CreditCard } from 'lucide-react';

const statusLabels: Record<string, string> = {
  REGISTERED: 'Registrado',
  VERIFIED: 'Verificado',
  APPROVED: 'Aprobado',
};

const kycLabels: Record<string, string> = {
  NOT_STARTED: 'Sin iniciar',
  IN_PROGRESS: 'En progreso',
  COMPLETED: 'Completado',
};

export default function DashboardPage() {
  const { profile, isLoading, error, fetchFullProfile, fullProfile } = useCustomer();

  useEffect(() => {
    fetchFullProfile();
  }, [fetchFullProfile]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (!profile) return null;

  type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';
  const cards: Array<{ title: string; icon: typeof UserCircle; value: string; badge: BadgeVariant; badgeLabel: string }> = [
    {
      title: 'Estado',
      icon: UserCircle,
      value: statusLabels[profile.status] ?? profile.status,
      badge: 'default',
      badgeLabel: profile.kycStatus === 'COMPLETED' ? 'Activo' : 'Pendiente',
    },
    {
      title: 'Documentos',
      icon: FileText,
      value: `${fullProfile?.documents.length ?? 0} subidos`,
      badge: 'default',
      badgeLabel: '',
    },
    {
      title: 'Simulaciones',
      icon: Calculator,
      value: `${fullProfile?.simulations.length ?? 0} realizadas`,
      badge: 'default',
      badgeLabel: '',
    },
    {
      title: 'KYC',
      icon: CreditCard,
      value: kycLabels[profile.kycStatus] ?? profile.kycStatus,
      badge: 'secondary',
      badgeLabel: profile.kycStatus === 'COMPLETED' ? 'Completo' : 'Pendiente',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenido, {profile.firstName}. Este es tu panel de cliente.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{card.value}</p>
                  <Badge variant={card.badge}>{card.badgeLabel}</Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
