import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAdminNotes } from '../use-admin-notes';
import { api } from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    constructor(public status: number, message: string) {
      super(message);
      this.name = 'ApiError';
    }
  },
}));

const mockNote = {
  id: 'n1',
  authorId: 'u1',
  authorName: 'Admin',
  entityType: 'CUSTOMER',
  entityId: 'c1',
  content: 'Nota de prueba',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockListResponse = { data: [mockNote] };

describe('useAdminNotes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns initial state', () => {
    const { result } = renderHook(() => useAdminNotes('CUSTOMER', 'c1'));
    expect(result.current.notes).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('loadNotes fetches and sets notes', async () => {
    vi.mocked(api.get).mockResolvedValue(mockListResponse);
    const { result } = renderHook(() => useAdminNotes('CUSTOMER', 'c1'));

    await act(async () => {
      await result.current.loadNotes();
    });

    expect(api.get).toHaveBeenCalledWith('/api/admin/notes?entityType=CUSTOMER&entityId=c1');
    expect(result.current.notes).toEqual([mockNote]);
    expect(result.current.isLoading).toBe(false);
  });

  it('addNote creates note with optimistic update', async () => {
    vi.mocked(api.get).mockResolvedValue(mockListResponse);
    const createdNote = { ...mockNote, content: 'Nueva nota' };
    vi.mocked(api.post).mockResolvedValue(createdNote);
    const { result } = renderHook(() => useAdminNotes('CUSTOMER', 'c1'));

    await act(async () => {
      await result.current.addNote('Nueva nota');
    });

    // Should have the real note (replaced temp)
    expect(result.current.notes.find((n) => n.content === 'Nueva nota')).toBeTruthy();
    expect(api.post).toHaveBeenCalledWith('/api/admin/notes', {
      entityType: 'CUSTOMER',
      entityId: 'c1',
      content: 'Nueva nota',
    });
  });

  it('addNote reverts optimistic update on error', async () => {
    vi.mocked(api.get).mockResolvedValue(mockListResponse);
    vi.mocked(api.post).mockRejectedValue(new Error('Error creating note'));
    const { result } = renderHook(() => useAdminNotes('CUSTOMER', 'c1'));

    await act(async () => {
      await result.current.addNote('Falling note');
    });

    // Temp note should be removed
    expect(result.current.notes.find((n) => n.content === 'Falling note')).toBeUndefined();
    expect(result.current.error).toBe('Error al crear nota');
  });

  it('loadNotes handles error', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('Failed to load'));
    const { result } = renderHook(() => useAdminNotes('CUSTOMER', 'c1'));

    await act(async () => {
      await result.current.loadNotes();
    });

    expect(result.current.error).toBe('Error al cargar notas');
    expect(result.current.isLoading).toBe(false);
  });
});
