'use client';

import { useState } from 'react';
import { Input } from '@/components/atoms/ui/input';
import { Label } from '@/components/atoms/ui/label';
import { Button } from '@/components/atoms/ui/button';
import { CreateAdminUserSchema } from '@prestamos/shared';
import type { CreateAdminUserInput, UserProfile } from '@prestamos/shared';
import { Loader2 } from 'lucide-react';

interface CreateUserFormProps {
  onSubmit: (input: CreateAdminUserInput) => Promise<UserProfile | null>;
  onSuccess?: () => void;
}

export function CreateUserForm({ onSubmit, onSuccess }: CreateUserFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const parsed = CreateAdminUserSchema.safeParse({ name, email, phone, password });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? 'Datos inválidos');
      return;
    }

    setIsLoading(true);
    try {
      const result = await onSubmit(parsed.data);
      if (result) {
        onSuccess?.();
      } else {
        setError('Error al crear usuario');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear usuario');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre</Label>
        <Input
          id="name"
          placeholder="Juan Pérez"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="admin@ejemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Teléfono</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+591 6XXXXXXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          placeholder="Mínimo 8 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isLoading ? 'Creando...' : 'Crear Usuario'}
      </Button>
    </form>
  );
}
