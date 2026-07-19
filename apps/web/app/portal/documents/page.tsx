'use client';

import { useEffect, useRef, useState } from 'react';
import { useDocuments } from '@/features/portal/hooks/use-documents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/ui/card';
import { Button } from '@/components/atoms/ui/button';
import { Input } from '@/components/atoms/ui/input';
import { Label } from '@/components/atoms/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/atoms/ui/select';
import { Badge } from '@/components/atoms/ui/badge';
import { Skeleton } from '@/components/atoms/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/atoms/ui/table';
import { toast } from 'sonner';
import { Upload, FileText, Loader2 } from 'lucide-react';

const docTypeLabels: Record<string, string> = {
  CI_FRONT: 'Cédula Frente',
  CI_BACK: 'Cédula Reverso',
  SELFIE: 'Selfie',
  PAYSLIP: 'Recibo de Sueldo',
  BANK_STATEMENT: 'Estado de Cuenta',
  SERVICE_BILL: 'Factura de Servicio',
};

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PENDING: 'secondary',
  VERIFIED: 'default',
  REJECTED: 'destructive',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  VERIFIED: 'Verificado',
  REJECTED: 'Rechazado',
};

export default function DocumentsPage() {
  const { documents, isLoading, error, fetchDocuments, uploadDocument } = useDocuments();
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file || !docType) {
      toast.error('Seleccioná un tipo de documento y un archivo');
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const data = base64.split(',')[1]; // Remove data: URL prefix

        await uploadDocument({
          type: docType as 'CI_FRONT' | 'CI_BACK' | 'SELFIE' | 'PAYSLIP' | 'BANK_STATEMENT' | 'SERVICE_BILL',
          fileName: file.name,
          mimeType: file.type,
          data,
        });

        toast.success('Documento subido correctamente');
        setDocType('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error('Error al subir documento');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Documentos</h1>
        <p className="text-muted-foreground">Subí los documentos requeridos para tu solicitud</p>
      </div>

      {/* Upload form */}
      <Card>
        <CardHeader><CardTitle>Subir Documento</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="space-y-2">
              <Label>Tipo de Documento</Label>
              <Select value={docType} onValueChange={(v) => v && setDocType(v)}>
                <SelectTrigger className="w-48"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(docTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Archivo</Label>
              <Input ref={fileInputRef} type="file" accept="image/*,.pdf" />
            </div>
            <Button onClick={handleUpload} disabled={uploading || !docType}>
              {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Subir
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Document list */}
      <Card>
        <CardHeader><CardTitle>Documentos Subidos</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : error ? (
            <p className="text-destructive">{error}</p>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
              <FileText className="h-12 w-12" />
              <p>No subiste documentos todavía</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Archivo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>{docTypeLabels[doc.type] ?? doc.type}</TableCell>
                    <TableCell className="max-w-40 truncate">{doc.fileName ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[doc.status] ?? 'outline'}>
                        {statusLabels[doc.status] ?? doc.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(doc.createdAt).toLocaleDateString('es-BO')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
