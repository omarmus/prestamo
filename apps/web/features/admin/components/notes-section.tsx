'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/ui/card';
import { Button } from '@/components/atoms/ui/button';
import { Textarea } from '@/components/atoms/ui/textarea';
import { Skeleton } from '@/components/atoms/ui/skeleton';
import { useAdminNotes } from '@/features/admin/hooks/use-admin-notes';
import { MessageSquare, Send } from 'lucide-react';

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'ahora';
  if (diffMins < 60) return `hace ${diffMins} min`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `hace ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `hace ${diffDays} días`;
  return new Date(dateStr).toLocaleDateString('es-BO');
}

export interface NotesSectionProps {
  entityType: 'CUSTOMER' | 'LOAN' | 'APPLICATION';
  entityId: string;
}

export function NotesSection({ entityType, entityId }: NotesSectionProps) {
  const { notes, isLoading, error, loadNotes, addNote } = useAdminNotes(entityType, entityId);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await addNote(content.trim());
      setContent('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          Notas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Cargando notas...</p>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay notas registradas</p>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {notes.map((note) => (
              <div key={note.id} className="rounded-lg border bg-muted/30 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">{note.authorName}</span>
                  <span className="text-xs text-muted-foreground">{formatRelativeTime(note.createdAt)}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* Add note form */}
        <div className="space-y-2">
          <Textarea
            placeholder="Escribí una nota..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
          />
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting}
            className="w-full sm:w-auto"
          >
            <Send className="mr-1.5 h-3.5 w-3.5" />
            {isSubmitting ? 'Agregando...' : 'Agregar Nota'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
