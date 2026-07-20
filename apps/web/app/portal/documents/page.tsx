'use client';

import { useEffect } from 'react';
import { useDocuments } from '@/features/portal/hooks/use-documents';
import { Card, CardHeader, CardTitle } from '@/components/atoms/ui/card';
import { DocumentUploader } from '@/features/portal/components/document-uploader';
import { DocumentList } from '@/features/portal/components/document-list';

export default function DocumentsPage() {
  const { documents, isLoading, error, fetchDocuments, uploadDocument } = useDocuments();

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Documentos</h1>
        <p className="text-muted-foreground">Subí los documentos requeridos para tu solicitud</p>
      </div>

      <DocumentUploader onUpload={uploadDocument} />

      <Card>
        <CardHeader><CardTitle>Documentos Subidos</CardTitle></CardHeader>
        <DocumentList documents={documents} isLoading={isLoading} error={error} />
      </Card>
    </div>
  );
}
