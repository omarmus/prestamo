'use client';

import type { AdminCustomerDetailResponse } from '@prestamos/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/ui/card';
import { Badge } from '@/components/atoms/ui/badge';
import { Skeleton } from '@/components/atoms/ui/skeleton';
import { Loader2, UserCircle, Building, DollarSign, FileText, CreditCard, MapPin, Phone, Mail } from 'lucide-react';
import Link from 'next/link';
import { NotesSection } from './notes-section';

const kycConfig: Record<string, { label: string; className: string }> = {
  APPROVED:  { label: 'Aprobado', className: 'bg-green-100 text-green-700' },
  PENDING:   { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-700' },
  REJECTED:  { label: 'Rechazado', className: 'bg-red-100 text-red-700' },
  NOT_SENT:  { label: 'No Enviado', className: 'bg-gray-100 text-gray-700' },
};

const statusConfig: Record<string, { label: string; className: string }> = {
  ACTIVE:   { label: 'Activo', className: 'bg-green-100 text-green-700' },
  INACTIVE: { label: 'Inactivo', className: 'bg-gray-100 text-gray-700' },
  BLOCKED:  { label: 'Bloqueado', className: 'bg-red-100 text-red-700' },
};

const loanStatusConfig: Record<string, { label: string; className: string }> = {
  ACTIVE:   { label: 'Activo', className: 'bg-green-100 text-green-700' },
  PAID:     { label: 'Pagado', className: 'bg-blue-100 text-blue-700' },
  OVERDUE:  { label: 'Moroso', className: 'bg-red-100 text-red-700' },
  DEFAULTED:{ label: 'Castigado', className: 'bg-gray-100 text-gray-700' },
};

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-right">{value ?? '—'}</span>
    </div>
  );
}

function SectionCard({ title, icon: Icon, children }: { title: string; icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {children}
      </CardContent>
    </Card>
  );
}

function EmptySection() {
  return <p className="text-sm text-muted-foreground py-2">Sin información</p>;
}

export interface AdminCustomerDetailProps {
  customer: AdminCustomerDetailResponse | null;
  isLoading: boolean;
  error: string | null;
}

export function AdminCustomerDetail({ customer, isLoading, error }: AdminCustomerDetailProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">Cargando información del cliente...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
        Cliente no encontrado
      </div>
    );
  }

  const { customer: profile, loans, applications } = customer;
  const kycCfg = kycConfig[profile.kycStatus] ?? { label: profile.kycStatus, className: '' };
  const statusCfg = statusConfig[profile.status] ?? { label: profile.status, className: '' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/admin/customers" className="text-sm text-muted-foreground hover:text-foreground">
          ← Volver a Clientes
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <UserCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">
              {profile.firstName} {profile.lastName ?? ''}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge className={statusCfg.className} variant="outline">{statusCfg.label}</Badge>
              <Badge className={kycCfg.className} variant="outline">KYC: {kycCfg.label}</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Personal Information */}
        <SectionCard title="Información Personal" icon={UserCircle}>
          <InfoRow label="Nombres" value={`${profile.firstName} ${profile.lastName ?? ''}`} />
          <InfoRow label="Tipo Documento" value={profile.documentType} />
          <InfoRow label="Número Documento" value={profile.documentNumber} />
          <InfoRow label="Fecha Nacimiento" value={profile.birthDate ? new Date(profile.birthDate).toLocaleDateString('es-BO') : null} />
          <InfoRow label="Género" value={profile.gender === 'M' ? 'Masculino' : profile.gender === 'F' ? 'Femenino' : profile.gender} />
          <InfoRow label="Estado Civil" value={profile.maritalStatus} />
          <InfoRow label="Ocupación" value={profile.occupation} />
          <InfoRow label="Ingreso Mensual" value={profile.monthlyIncome ? `Bs. ${profile.monthlyIncome.toLocaleString('es-BO')}` : null} />
        </SectionCard>

        {/* Contact */}
        <SectionCard title="Contacto" icon={Phone}>
          {profile.user.email && (
            <div className="flex items-center gap-2 py-1.5 text-sm">
              <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span>{profile.user.email}</span>
            </div>
          )}
          {profile.phones.length === 0 && profile.emails.length === 0 ? (
            <EmptySection />
          ) : (
            <>
              {profile.phones.map((p) => (
                <div key={p.id} className="flex items-center gap-2 py-1.5 text-sm">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>{p.phone}</span>
                  {p.isWhatsApp && <Badge variant="outline" className="text-[10px] px-1 py-0">WA</Badge>}
                </div>
              ))}
              {profile.emails.map((e) => (
                <div key={e.id} className="flex items-center gap-2 py-1.5 text-sm">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>{e.email}</span>
                </div>
              ))}
            </>
          )}
        </SectionCard>

        {/* Addresses */}
        <SectionCard title="Direcciones" icon={MapPin}>
          {profile.addresses.length === 0 ? (
            <EmptySection />
          ) : (
            profile.addresses.map((a) => (
              <div key={a.id} className="text-sm py-1.5">
                <p>{[a.street, a.number].filter(Boolean).join(' ')}</p>
                <p className="text-muted-foreground text-xs">
                  {[a.zone, a.city, a.department, a.country].filter(Boolean).join(', ')}
                </p>
              </div>
            ))
          )}
        </SectionCard>

        {/* Employment */}
        <SectionCard title="Empleo" icon={Building}>
          {!profile.employment ? (
            <EmptySection />
          ) : (
            <>
              <InfoRow label="Empleador" value={profile.employment.employer} />
              <InfoRow label="Cargo" value={profile.employment.position} />
              <InfoRow label="Estado Laboral" value={profile.employment.employmentStatus} />
              <InfoRow label="Salario Mensual" value={profile.employment.monthlySalary ? `Bs. ${profile.employment.monthlySalary.toLocaleString('es-BO')}` : null} />
              <InfoRow label="Años Trabajando" value={profile.employment.yearsWorking} />
            </>
          )}
        </SectionCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Income */}
        <SectionCard title="Ingresos" icon={DollarSign}>
          {profile.incomes.length === 0 ? (
            <EmptySection />
          ) : (
            <div className="space-y-2">
              {profile.incomes.map((inc) => (
                <div key={inc.id} className="flex justify-between text-sm">
                  <span>{inc.source ?? '—'}</span>
                  <span className="font-medium">
                    Bs. {inc.amount.toLocaleString('es-BO')} {inc.frequency ? `/${inc.frequency.toLowerCase()}` : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Documents */}
        <SectionCard title="Documentos" icon={FileText}>
          {profile.documents.length === 0 ? (
            <EmptySection />
          ) : (
            <div className="space-y-2">
              {profile.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between text-sm">
                  <span>{doc.type}{doc.fileName ? ` — ${doc.fileName}` : ''}</span>
                  <Badge
                    variant="outline"
                    className={
                      doc.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                      doc.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }
                  >
                    {doc.status === 'APPROVED' ? 'Aprobado' :
                     doc.status === 'REJECTED' ? 'Rechazado' : 'Pendiente'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Loans History */}
      <SectionCard title="Préstamos" icon={CreditCard}>
        {applications.length === 0 && loans.length === 0 ? (
          <EmptySection />
        ) : (
          <div className="space-y-4">
            {applications.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Solicitudes</p>
                <div className="divide-y">
                  {applications.map((app) => (
                    <div key={app.id} className="flex items-center justify-between py-2 text-sm">
                      <Link href={`/admin/loans/${app.id}`} className="hover:underline font-medium">
                        Bs. {app.amount.toLocaleString('es-BO')}
                      </Link>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-xs">
                          {new Date(app.createdAt).toLocaleDateString('es-BO')}
                        </span>
                        <Badge variant="outline" className={
                          app.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                          app.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                          app.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                          app.status === 'IN_REVIEW' ? 'bg-blue-100 text-blue-700' :
                          ''
                        }>
                          {app.status === 'APPROVED' ? 'Aprobado' :
                           app.status === 'REJECTED' ? 'Rechazado' :
                           app.status === 'PENDING' ? 'Pendiente' :
                           app.status === 'IN_REVIEW' ? 'En Revisión' : app.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {loans.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Préstamos Activos</p>
                <div className="divide-y">
                  {loans.map((loan) => {
                    const lCfg = loanStatusConfig[loan.status] ?? { label: loan.status, className: '' };
                    return (
                      <div key={loan.id} className="flex items-center justify-between py-2 text-sm">
                        <Link href={`/admin/loans/active/${loan.id}`} className="hover:underline font-medium">
                          Bs. {loan.amount.toLocaleString('es-BO')}
                        </Link>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground text-xs">
                            Saldo: Bs. {loan.outstandingBalance.toLocaleString('es-BO')}
                          </span>
                          <Badge className={lCfg.className} variant="outline">{lCfg.label}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </SectionCard>

      {/* Notes */}
      <NotesSection entityType="CUSTOMER" entityId={profile.id} />
    </div>
  );
}
