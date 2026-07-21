'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { LoanApplicationResponse } from '@prestamos/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/ui/card';
import { Badge } from '@/components/atoms/ui/badge';
import { Button, buttonVariants } from '@/components/atoms/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/atoms/ui/dialog';
import { Loader2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; className: string }> = {
  DRAFT:          { label: 'Borrador', className: 'bg-gray-100 text-gray-700' },
  PENDING:        { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-700' },
  IN_REVIEW:      { label: 'En Revisión', className: 'bg-blue-100 text-blue-700' },
  INFO_REQUESTED: { label: 'Info. Requerida', className: 'bg-orange-100 text-orange-700' },
  APPROVED:       { label: 'Aprobado', className: 'bg-green-100 text-green-700' },
  REJECTED:       { label: 'Rechazado', className: 'bg-red-100 text-red-700' },
  CANCELLED:      { label: 'Cancelado', className: 'bg-gray-300 text-gray-800' },
};

const purposeLabels: Record<string, string> = {
  NEGOCIO: 'Negocio',
  EDUCACION: 'Educación',
  SALUD: 'Salud',
  VIAJE: 'Viaje',
  OTRO: 'Otro',
};

export interface LoanDetailProps {
  application: LoanApplicationResponse;
  onCancel?: () => Promise<void>;
  isCancelling?: boolean;
}

export function LoanDetail({ application, onCancel, isCancelling }: LoanDetailProps) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const statusInfo = statusConfig[application.status] ?? { label: application.status, className: '' };
  const canCancel = ['DRAFT', 'PENDING'].includes(application.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Detalle de Solicitud</h1>
          <p className="text-muted-foreground">ID: {application.id.slice(0, 8)}...</p>
        </div>
        <Badge className={statusInfo.className} variant="outline">
          {statusInfo.label}
        </Badge>
      </div>

      {/* Loan Info Card */}
      <Card>
        <CardHeader><CardTitle>Información del Préstamo</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Monto Solicitado</p>
              <p className="text-lg font-semibold">Bs. {application.amount.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Plazo</p>
              <p className="text-lg font-semibold">{application.termMonths} meses</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tasa Anual</p>
              <p className="text-lg font-semibold">{application.annualRate}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cuota Mensual</p>
              <p className="text-lg font-semibold">Bs. {application.monthlyPayment.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Intereses</p>
              <p className="text-lg font-semibold">Bs. {application.totalInterest.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total a Pagar</p>
              <p className="text-lg font-semibold">Bs. {application.totalPayment.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Propósito</p>
              <p className="text-lg font-semibold">{purposeLabels[application.purpose ?? ''] ?? application.purpose ?? '—'}</p>
            </div>
            {application.riskScore && (
              <div>
                <p className="text-sm text-muted-foreground">Risk Score</p>
                <Badge variant="outline">{application.riskScore}</Badge>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Creado</p>
              <p className="text-lg font-semibold">{new Date(application.createdAt).toLocaleDateString('es-BO')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader><CardTitle>Línea de Tiempo</CardTitle></CardHeader>
        <CardContent>
          {application.timeline.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin actividad registrada.</p>
          ) : (
            <div className="relative space-y-4 pl-6 before:absolute before:left-[7px] before:top-2 before:h-[calc(100%-16px)] before:w-[2px] before:bg-border">
              {application.timeline.map((entry, i) => {
                const fromLabel = entry.fromStatus ? statusConfig[entry.fromStatus]?.label ?? entry.fromStatus : 'Inicio';
                const toLabel = statusConfig[entry.toStatus]?.label ?? entry.toStatus;
                return (
                  <div key={i} className="relative">
                    <div className="absolute -left-[22px] mt-1.5 h-3 w-3 rounded-full border-2 border-primary bg-background" />
                    <p className="text-sm font-medium">{fromLabel} → {toLabel}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(entry.changedAt).toLocaleString('es-BO')}
                      {entry.changedBy === 'admin' ? ' · Asesor' : ' · Tú'}
                    </p>
                    {entry.notes && (
                      <p className="mt-0.5 text-xs text-muted-foreground italic">{entry.notes}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents Section */}
      <Card>
        <CardHeader><CardTitle>Documentos</CardTitle></CardHeader>
        <CardContent>
          {/* ponytail: documents are shown from the full profile, not per-application */}
          <p className="text-sm text-muted-foreground">Aún no has subido documentos</p>
          <Link
            href="/portal/documents"
            className={cn(buttonVariants({ variant: 'link' }), 'mt-2 cursor-pointer p-0')}
          >
            <FileText className="mr-1 h-4 w-4" />
            Ir a Documentos
          </Link>
        </CardContent>
      </Card>

      {/* Cancel Button */}
      {canCancel && onCancel && (
          <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
          <DialogTrigger>
            <Button variant="destructive">
              Cancelar solicitud
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Cancelar solicitud?</DialogTitle>
              <DialogDescription>
                Esta acción no se puede deshacer. La solicitud pasará a estado Cancelado.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCancelOpen(false)}>
                Volver
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  await onCancel();
                  setCancelOpen(false);
                }}
                disabled={isCancelling}
              >
                {isCancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Sí, cancelar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {application.reviewNotes && (
        <Card>
          <CardHeader><CardTitle>Notas de Revisión</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm">{application.reviewNotes}</p>
            {application.reviewedAt && (
              <p className="mt-2 text-xs text-muted-foreground">
                {new Date(application.reviewedAt).toLocaleString('es-BO')}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
