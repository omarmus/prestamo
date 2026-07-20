'use client';

import { useEffect, useState } from 'react';
import type { CustomerProfile, FullCustomerProfile } from '@prestamos/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/ui/card';
import { Button } from '@/components/atoms/ui/button';
import { Input } from '@/components/atoms/ui/input';
import { Label } from '@/components/atoms/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/atoms/ui/select';
import { Separator } from '@/components/atoms/ui/separator';
import { Badge } from '@/components/atoms/ui/badge';
import { toast } from 'sonner';
import { Plus, Trash2, Loader2 } from 'lucide-react';

// ponytail: single profile form with inline editing — no form library

export interface CustomerFormProps {
  profile: CustomerProfile;
  fullProfile: FullCustomerProfile | null;
  onUpdate: (data: Record<string, unknown>) => Promise<unknown>;
  onCreateSubEntity: (endpoint: string, data: Record<string, unknown>) => Promise<unknown>;
  onUpdateSubEntity: (endpoint: string, id: string, data: Record<string, unknown>) => Promise<unknown>;
  onDeleteSubEntity: (endpoint: string, id: string) => Promise<unknown>;
}

export function CustomerForm({
  profile,
  fullProfile,
  onUpdate,
  onCreateSubEntity,
  onUpdateSubEntity,
  onDeleteSubEntity,
}: CustomerFormProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', documentType: '', documentNumber: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      firstName: profile.firstName,
      lastName: profile.lastName ?? '',
      documentType: profile.documentType ?? '',
      documentNumber: profile.documentNumber ?? '',
    });
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate({
        firstName: form.firstName,
        lastName: form.lastName || undefined,
        documentType: form.documentType || undefined,
        documentNumber: form.documentNumber || undefined,
      });
      toast.success('Perfil actualizado');
      setEditing(false);
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mi Perfil</h1>
          <p className="text-muted-foreground">Gestioná tu información personal</p>
        </div>
        <Button onClick={() => setEditing(!editing)} variant={editing ? 'outline' : 'default'}>
          {editing ? 'Cancelar' : 'Editar'}
        </Button>
      </div>

      {/* Personal Info */}
      <Card>
        <CardHeader><CardTitle>Información Personal</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Apellido</Label>
                <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Tipo Documento</Label>
                <Select value={form.documentType} onValueChange={(v) => setForm({ ...form, documentType: v ?? '' })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CI">Cédula de Identidad</SelectItem>
                    <SelectItem value="PASSPORT">Pasaporte</SelectItem>
                    <SelectItem value="OTHER">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Número Documento</Label>
                <Input value={form.documentNumber} onChange={(e) => setForm({ ...form, documentNumber: e.target.value })} />
              </div>
              <Button className="md:col-span-2" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Guardar Cambios
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label className="text-muted-foreground">Nombre</Label><p>{profile.firstName} {profile.lastName}</p></div>
              <div><Label className="text-muted-foreground">Documento</Label><p>{profile.documentType ? `${profile.documentType}: ${profile.documentNumber}` : '—'}</p></div>
              <div><Label className="text-muted-foreground">Estado</Label><Badge variant="outline">{profile.status}</Badge></div>
              <div><Label className="text-muted-foreground">KYC</Label><Badge variant={profile.kycStatus === 'COMPLETED' ? 'default' : 'secondary'}>{profile.kycStatus}</Badge></div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Addresses */}
      <SubEntitySection
        title="Direcciones"
        fields={['type', 'country', 'city', 'street']}
        display={(a) => [a.type, a.city].filter(Boolean).join(' — ') || a.street || 'Sin dirección'}
        items={(fullProfile?.addresses ?? []) as SubEntityItem[]}
        endpoint="addresses"
        createSchema={['type', 'country', 'department', 'city', 'zone', 'street', 'number']}
        createLabels={{ type: 'Tipo', country: 'País', department: 'Departamento', city: 'Ciudad', zone: 'Zona', street: 'Calle', number: 'Número' }}
        onCreate={onCreateSubEntity}
        onUpdate={onUpdateSubEntity}
        onDelete={onDeleteSubEntity}
      />

      <Separator />

      {/* Phones */}
      <SubEntitySection
        title="Teléfonos"
        fields={['phone', 'isWhatsApp']}
        display={(p) => `${p.phone}${p.isWhatsApp ? ' (WhatsApp)' : ''}`}
        items={(fullProfile?.phones ?? []) as SubEntityItem[]}
        endpoint="phones"
        createSchema={['phone']}
        createLabels={{ phone: 'Teléfono' }}
        onCreate={onCreateSubEntity}
        onUpdate={onUpdateSubEntity}
        onDelete={onDeleteSubEntity}
      />

      <Separator />

      {/* Emails */}
      <SubEntitySection
        title="Emails"
        fields={['email']}
        display={(e) => e.email}
        items={(fullProfile?.emails ?? []) as SubEntityItem[]}
        endpoint="emails"
        createSchema={['email']}
        createLabels={{ email: 'Email' }}
        onCreate={onCreateSubEntity}
        onUpdate={onUpdateSubEntity}
        onDelete={onDeleteSubEntity}
      />

      <Separator />

      {/* Employment */}
      <Card>
        <CardHeader><CardTitle>Empleo</CardTitle></CardHeader>
        <CardContent>
          {fullProfile?.employment ? (
            <div className="grid gap-2 md:grid-cols-2">
              <div><Label className="text-muted-foreground">Empleador</Label><p>{fullProfile.employment.employer ?? '—'}</p></div>
              <div><Label className="text-muted-foreground">Cargo</Label><p>{fullProfile.employment.position ?? '—'}</p></div>
              <div><Label className="text-muted-foreground">Estado</Label><p>{fullProfile.employment.employmentStatus ?? '—'}</p></div>
              <div><Label className="text-muted-foreground">Salario Mensual</Label><p>{fullProfile.employment.monthlySalary ? `Bs. ${fullProfile.employment.monthlySalary.toLocaleString()}` : '—'}</p></div>
              <div><Label className="text-muted-foreground">Años Trabajando</Label><p>{fullProfile.employment.yearsWorking ?? '—'}</p></div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin información de empleo registrada.</p>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Bank Accounts */}
      <SubEntitySection
        title="Cuentas Bancarias"
        fields={['bank', 'accountType', 'accountNumber']}
        display={(b) => [b.bank, b.accountType].filter(Boolean).join(' - ') || b.accountNumber || 'Sin datos'}
        items={(fullProfile?.bankAccounts ?? []) as unknown as SubEntityItem[]}
        endpoint="bank-accounts"
        createSchema={['bank', 'accountType', 'accountNumber', 'holderName']}
        createLabels={{ bank: 'Banco', accountType: 'Tipo', accountNumber: 'Número', holderName: 'Titular' }}
        onCreate={onCreateSubEntity}
        onUpdate={onUpdateSubEntity}
        onDelete={onDeleteSubEntity}
      />
    </div>
  );
}

// --- Reusable sub-entity section ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SubEntityItem = Record<string, any> & { id: string };

function SubEntitySection({
  title, fields: _fields, display, items, endpoint, createSchema, createLabels, onCreate, onUpdate: _onUpdate, onDelete,
}: {
  title: string;
  fields: string[];
  display: (item: SubEntityItem) => string;
  items: SubEntityItem[];
  endpoint: string;
  createSchema: string[];
  createLabels: Record<string, string>;
  onCreate: (endpoint: string, data: Record<string, unknown>) => Promise<unknown>;
  onUpdate: (endpoint: string, id: string, data: Record<string, unknown>) => Promise<unknown>;
  onDelete: (endpoint: string, id: string) => Promise<unknown>;
}) {
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState<Record<string, string>>({});
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleAdd = async () => {
    try {
      await onCreate(endpoint, newItem as unknown as Record<string, unknown>);
      toast.success(`${title} agregado`);
      setAdding(false);
      setNewItem({});
    } catch {
      toast.error(`Error al agregar ${title.toLowerCase()}`);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await onDelete(endpoint, id);
      toast.success(`${title} eliminado`);
    } catch {
      toast.error(`Error al eliminar ${title.toLowerCase()}`);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setAdding(!adding)}>
          <Plus className="mr-1 h-3 w-3" />
          Agregar
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {adding && (
          <div className="grid gap-3 rounded-lg border p-4 md:grid-cols-2">
            {createSchema.map((field) => (
              <div key={field} className="space-y-1">
                <Label className="text-xs">{createLabels[field]}</Label>
                <Input
                  size={30}
                  value={newItem[field] ?? ''}
                  onChange={(e) => setNewItem({ ...newItem, [field]: e.target.value })}
                />
              </div>
            ))}
            <div className="flex gap-2 md:col-span-2">
              <Button size="sm" onClick={handleAdd}>Guardar</Button>
              <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancelar</Button>
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin {title.toLowerCase()} registrados.</p>
        ) : (
          <div className="divide-y">
            {items.map((item) => (
              <div key={item.id as string} className="flex items-center justify-between py-2">
                <span className="text-sm">{display(item)}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => handleDelete(item.id as string)}
                  disabled={deleting === item.id}
                >
                  {deleting === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
