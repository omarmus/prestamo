'use client';

import { useRef, useState } from 'react';
import type { CreateDocumentInput } from '@prestamos/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/ui/card';
import { Button } from '@/components/atoms/ui/button';
import { Input } from '@/components/atoms/ui/input';
import { Label } from '@/components/atoms/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/atoms/ui/select';
import { toast } from 'sonner';
import { Upload, Loader2 } from 'lucide-react';

const docTypeLabels: Record<string, string> = {
  CI_FRONT: 'Cédula Frente',
  CI_BACK: 'Cédula Reverso',
  SELFIE: 'Selfie',
  PAYSLIP: 'Recibo de Sueldo',
  BANK_STATEMENT: 'Estado de Cuenta',
  SERVICE_BILL: 'Factura de Servicio',
};

export interface DocumentUploaderProps {
  onUpload: (input: CreateDocumentInput) => Promise<unknown>;
}

export function DocumentUploader({ onUpload }: DocumentUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

        await onUpload({
          type: docType as CreateDocumentInput['type'],
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
  );
}
