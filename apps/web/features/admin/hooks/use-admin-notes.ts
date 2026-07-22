'use client';

import { useCallback, useState } from 'react';
import type { AdminNoteResponse, AdminNoteListResponse } from '@prestamos/shared';
import { api, ApiError } from '@/lib/api-client';

export function useAdminNotes(entityType: string, entityId: string) {
  const [notes, setNotes] = useState<AdminNoteResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotes = useCallback(async () => {
    setIsLoading(true);
    try {
      setError(null);
      const query = new URLSearchParams({ entityType, entityId });
      const data = await api.get<AdminNoteListResponse>(`/api/admin/notes?${query}`);
      setNotes(data.data);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al cargar notas';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId]);

  const addNote = useCallback(async (content: string) => {
    // Optimistic update
    const tempNote: AdminNoteResponse = {
      id: 'temp-' + Date.now(),
      authorId: '',
      authorName: 'Yo',
      entityType,
      entityId,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes((prev) => [tempNote, ...prev]);
    try {
      setError(null);
      const data = await api.post<AdminNoteResponse>('/api/admin/notes', { entityType, entityId, content });
      // Replace temp with real note
      setNotes((prev) => prev.map((n) => (n.id === tempNote.id ? data : n)));
      return data;
    } catch (err) {
      // Revert on error
      setNotes((prev) => prev.filter((n) => n.id !== tempNote.id));
      const message = err instanceof ApiError ? err.message : 'Error al crear nota';
      setError(message);
      return null;
    }
  }, [entityType, entityId]);

  return { notes, isLoading, error, loadNotes, addNote };
}
