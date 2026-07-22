'use client';

import { useEffect, useRef, useState } from 'react';
import { useAdminUsers } from '@/features/admin/hooks/use-admin-users';
import { AdminUsersTable } from '@/features/admin/components/admin-users-table';
import { CreateUserForm } from '@/features/admin/components/create-user-form';
import { Button } from '@/components/atoms/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/atoms/ui/dialog';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminUsersPage() {
  const { list, isLoading, error, load, create } = useAdminUsers();
  const [open, setOpen] = useState(false);
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (!hasLoaded.current) {
      hasLoaded.current = true;
      load();
    }
  }, [load]);

  const handleCreateSuccess = () => {
    setOpen(false);
    toast.success('Usuario creado correctamente');
    load();
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usuarios Administradores</h1>
          <p className="text-muted-foreground">Gestionar usuarios del sistema</p>
        </div>
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usuarios Administradores</h1>
          <p className="text-muted-foreground">Gestionar usuarios del sistema</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Usuario
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Usuario</DialogTitle>
              <DialogDescription>Agregar un nuevo administrador</DialogDescription>
            </DialogHeader>
            <CreateUserForm onSubmit={create} onSuccess={handleCreateSuccess} />
          </DialogContent>
        </Dialog>
      </div>
      <AdminUsersTable users={list} isLoading={isLoading} />
    </div>
  );
}
