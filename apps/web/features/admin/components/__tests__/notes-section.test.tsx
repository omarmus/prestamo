import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotesSection } from '../notes-section';
import { useAdminNotes } from '../../hooks/use-admin-notes';

vi.mock('../../hooks/use-admin-notes', () => ({
  useAdminNotes: vi.fn(),
}));

const mockNotes = [
  { id: 'n1', authorId: 'u1', authorName: 'Admin', entityType: 'CUSTOMER', entityId: 'c1', content: 'Primera nota', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'n2', authorId: 'u2', authorName: 'Staff', entityType: 'CUSTOMER', entityId: 'c1', content: 'Segunda nota', createdAt: '2024-06-01T00:00:00Z', updatedAt: '2024-06-01T00:00:00Z' },
];

afterEach(cleanup);

describe('NotesSection', () => {
  it('renders notes list', () => {
    vi.mocked(useAdminNotes).mockReturnValue({
      notes: mockNotes,
      isLoading: false,
      error: null,
      loadNotes: vi.fn(),
      addNote: vi.fn(),
    });

    render(<NotesSection entityType="CUSTOMER" entityId="c1" />);
    expect(screen.getByText('Primera nota')).toBeInTheDocument();
    expect(screen.getByText('Segunda nota')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Staff')).toBeInTheDocument();
  });

  it('shows empty state when no notes', () => {
    vi.mocked(useAdminNotes).mockReturnValue({
      notes: [],
      isLoading: false,
      error: null,
      loadNotes: vi.fn(),
      addNote: vi.fn(),
    });

    render(<NotesSection entityType="CUSTOMER" entityId="c1" />);
    expect(screen.getByText('No hay notas registradas')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    vi.mocked(useAdminNotes).mockReturnValue({
      notes: [],
      isLoading: true,
      error: null,
      loadNotes: vi.fn(),
      addNote: vi.fn(),
    });

    render(<NotesSection entityType="CUSTOMER" entityId="c1" />);
    expect(screen.getByText('Cargando notas...')).toBeInTheDocument();
  });

  it('calls addNote on form submit', async () => {
    const addNote = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useAdminNotes).mockReturnValue({
      notes: [],
      isLoading: false,
      error: null,
      loadNotes: vi.fn(),
      addNote,
    });

    render(<NotesSection entityType="CUSTOMER" entityId="c1" />);
    const textarea = screen.getByPlaceholderText('Escribí una nota...');
    const button = screen.getByText('Agregar Nota');

    await userEvent.type(textarea, 'Nueva nota de prueba');
    await userEvent.click(button);

    expect(addNote).toHaveBeenCalledWith('Nueva nota de prueba');
  });
});
