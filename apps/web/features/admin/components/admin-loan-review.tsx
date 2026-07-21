'use client';

import { useState } from 'react';
import type { AdminApplicationDetail, DisburseLoanResponse } from '@prestamos/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/ui/card';
import { Badge } from '@/components/atoms/ui/badge';
import { Button } from '@/components/atoms/ui/button';
import { Textarea } from '@/components/atoms/ui/textarea';
import { Label } from '@/components/atoms/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/atoms/ui/dialog';
import { Loader2, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { DisbursementButton } from './disbursement-button';

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

const docStatusIcons: Record<string, { icon: typeof CheckCircle; className: string }> = {
  VERIFIED:   { icon: CheckCircle, className: 'text-green-600' },
  PENDING:    { icon: Clock, className: 'text-yellow-600' },
  REJECTED:   { icon: AlertTriangle, className: 'text-red-600' },
};

function dtiColorClass(dti: number): string {
  if (dti <= 0.30) return 'text-green-600';
  if (dti <= 0.50) return 'text-yellow-600';
  return 'text-red-600';
}

export interface AdminLoanReviewProps {
  detail: AdminApplicationDetail;
  onApprove: (notes?: string) => Promise<void>;
  onReject: (reason: string) => Promise<void>;
  onRequestInfo: (message: string) => Promise<void>;
  onAssign: () => Promise<void>;
  onDisburse?: (applicationId: string) => Promise<DisburseLoanResponse | null>;
  isProcessing: boolean;
}

export function AdminLoanReview({
  detail,
  onApprove,
  onReject,
  onRequestInfo,
  onAssign,
  onDisburse,
  isProcessing,
}: AdminLoanReviewProps) {
  const { application, customer, totalMonthlyIncome, dti } = detail;
  const statusInfo = statusConfig[application.status] ?? { label: application.status, className: '' };

  const [approveNotes, setApproveNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  const handleApprove = async () => {
    if (!application.reviewerId) {
      await onAssign();
    }
    await onApprove(approveNotes || undefined);
  };

  const handleReject = async () => {
    if (!application.reviewerId) {
      await onAssign();
    }
    await onReject(rejectReason);
    setRejectOpen(false);
  };

  const handleRequestInfo = async () => {
    if (!application.reviewerId) {
      await onAssign();
    }
    await onRequestInfo(infoMessage);
    setInfoOpen(false);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Left: Customer Data */}
      <div className="space-y-6">
        {/* Profile */}
        <Card>
          <CardHeader><CardTitle>Datos del Cliente</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 md:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Nombre</p>
                <p className="font-medium">{customer.firstName} {customer.lastName ?? ''}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Documento</p>
                <p className="font-medium">{customer.documentType ?? '—'}: {customer.documentNumber ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Estado</p>
                <Badge variant="outline">{customer.status}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">KYC</p>
                <Badge variant="outline">{customer.kycStatus}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader><CardTitle>Documentos</CardTitle></CardHeader>
          <CardContent>
            {customer.documents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin documentos</p>
            ) : (
              <div className="divide-y">
                {customer.documents.map((doc, i) => {
                  const docStatus = (doc as Record<string, unknown>).status as string;
                  const iconCfg = docStatusIcons[docStatus] ?? { icon: Clock, className: 'text-yellow-600' };
                  const Icon = iconCfg.icon;
                  return (
                    <div key={i} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${iconCfg.className}`} />
                        <span className="text-sm">{(doc as Record<string, unknown>).type as string ?? 'Documento'}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">{docStatus}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Incomes & DTI */}
        <Card>
          <CardHeader><CardTitle>Ingresos y DTI</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {customer.incomes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin ingresos registrados</p>
            ) : (
              <div className="divide-y">
                {customer.incomes.map((inc) => (
                  <div key={inc.id} className="flex items-center justify-between py-2">
                    <span className="text-sm">{inc.source ?? 'Ingreso'}</span>
                    <span className="text-sm font-medium">
                      Bs. {inc.monthlyAmount.toLocaleString('es-BO', { minimumFractionDigits: 2 })}/mes
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between border-t pt-3">
              <span className="text-sm font-medium">Total Ingresos Mensuales</span>
              <span className="font-semibold">
                Bs. {totalMonthlyIncome.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">DTI (Debt-to-Income)</span>
              <span className={`font-semibold ${dtiColorClass(dti)}`}>
                {(dti * 100).toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right: Application Detail + Actions */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Detalle de Solicitud</CardTitle>
              <Badge className={statusInfo.className} variant="outline">{statusInfo.label}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 md:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Monto</p>
                <p className="font-medium">Bs. {application.amount.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Plazo</p>
                <p className="font-medium">{application.termMonths} meses</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tasa Anual</p>
                <p className="font-medium">{application.annualRate}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cuota Mensual</p>
                <p className="font-medium">Bs. {application.monthlyPayment.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Propósito</p>
                <p className="font-medium">{purposeLabels[application.purpose ?? ''] ?? application.purpose ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Creado</p>
                <p className="font-medium">{new Date(application.createdAt).toLocaleDateString('es-BO')}</p>
              </div>
            </div>

            {application.riskScore && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Risk Score:</span>
                <Badge variant="outline">{application.riskScore}</Badge>
              </div>
            )}

            {application.reviewNotes && (
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Notas de revisión</p>
                <p className="text-sm">{application.reviewNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        {application.status === 'PENDING' || application.status === 'IN_REVIEW' ? (
          <Card>
            <CardHeader><CardTitle>Acciones</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {/* Approve */}
              <div className="space-y-2">
                <Label>Notas (opcional)</Label>
                <Textarea
                  placeholder="Notas de aprobación..."
                  value={approveNotes}
                  onChange={(e) => setApproveNotes(e.target.value)}
                  rows={2}
                />
                <Button className="w-full" onClick={handleApprove} disabled={isProcessing}>
                  {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Aprobar solicitud
                </Button>
              </div>

              <div className="flex gap-2">
                {/* Request Info */}
                <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
                  <DialogTrigger>
                    <Button variant="outline" className="flex-1" disabled={isProcessing}>
                      Solicitar más información
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Solicitar más información</DialogTitle>
                      <DialogDescription>
                        El cliente recibirá una notificación para proporcionar información adicional.
                      </DialogDescription>
                    </DialogHeader>
                    <Textarea
                      placeholder="Describí qué información necesitás..."
                      value={infoMessage}
                      onChange={(e) => setInfoMessage(e.target.value)}
                      rows={3}
                    />
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setInfoOpen(false)}>Cancelar</Button>
                      <Button onClick={handleRequestInfo} disabled={!infoMessage.trim() || isProcessing}>
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Solicitar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Reject */}
                <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                  <DialogTrigger>
                    <Button variant="destructive" className="flex-1" disabled={isProcessing}>
                      Rechazar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Rechazar solicitud</DialogTitle>
                      <DialogDescription>
                        Esta acción no se puede deshacer. La solicitud pasará a estado Rechazado.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                      <Label>Motivo del rechazo *</Label>
                      <Textarea
                        placeholder="Indicá el motivo del rechazo..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setRejectOpen(false)}>Volver</Button>
                      <Button
                        variant="destructive"
                        onClick={handleReject}
                        disabled={!rejectReason.trim() || isProcessing}
                      >
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Sí, rechazar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ) : application.status === 'APPROVED' && onDisburse ? (
          <Card>
            <CardHeader><CardTitle>Desembolso</CardTitle></CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Esta solicitud está aprobada. Podés desembolsar el préstamo para que el cliente
                reciba los fondos y se active el cronograma de pagos.
              </p>
              <DisbursementButton
                applicationId={application.id}
                amount={application.amount}
                onDisburse={onDisburse}
              />
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
