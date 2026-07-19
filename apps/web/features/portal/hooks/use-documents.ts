'use client';

import { useCallback, useState } from 'react';
import type { DocumentResponse, CreateDocumentInput } from '@prestamos/shared';
import { api, ApiError } from '@/lib/api-client';

export function useDocuments() {
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      setError(null);
      const data = await api.get<DocumentResponse[]>('/api/customers/me/documents');
      setDocuments(data);
      return data;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al cargar documentos';
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const uploadDocument = useCallback(async (input: CreateDocumentInput) => {
    setIsLoading(true);
    try {
      setError(null);
      const data = await api.post<DocumentResponse>('/api/customers/me/documents', input as unknown as Record<string, unknown>);
      setDocuments((prev) => [data, ...prev]);
      return data;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al subir documento';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { documents, isLoading, error, fetchDocuments, uploadDocument };
}
