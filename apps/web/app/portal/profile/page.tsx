'use client';

import { useEffect } from 'react';
import { useCustomer } from '@/features/portal/hooks/use-customer';
import { Skeleton } from '@/components/atoms/ui/skeleton';
import { CustomerForm } from '@/features/portal/components/customer-form';

export default function ProfilePage() {
  const {
    profile, fullProfile, isLoading, error,
    fetchFullProfile, updateProfile,
    createSubEntity, updateSubEntity, deleteSubEntity,
  } = useCustomer();

  useEffect(() => {
    fetchFullProfile();
  }, [fetchFullProfile]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (error) return <p className="text-destructive">{error}</p>;
  if (!profile) return null;

  return (
    <CustomerForm
      profile={profile}
      fullProfile={fullProfile}
      onUpdate={updateProfile}
      onCreateSubEntity={createSubEntity}
      onUpdateSubEntity={updateSubEntity}
      onDeleteSubEntity={deleteSubEntity}
    />
  );
}
