'use client';

import type { AdminUserListItem } from '@prestamos/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/ui/card';
import { Skeleton } from '@/components/atoms/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/atoms/ui/table';
import { Shield } from 'lucide-react';

export interface AdminUsersTableProps {
  users: AdminUserListItem[];
  isLoading: boolean;
}

function SkeletonRow() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
      <TableCell><Skeleton className="h-4 w-36" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
    </TableRow>
  );
}

export function AdminUsersTable({ users, isLoading }: AdminUsersTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Usuarios Administradores</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Registrado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </TableBody>
          </Table>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12">
            <Shield className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No hay usuarios administradores</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Registrado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString('es-BO')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
