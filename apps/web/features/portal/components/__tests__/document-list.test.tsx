import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { DocumentList } from '../document-list';
import type { DocumentResponse } from '@prestamos/shared';

afterEach(cleanup);

const sampleDocs: DocumentResponse[] = [
  {
    id: 'doc-1',
    type: 'CI_FRONT',
    fileName: 'frente.jpg',
    mimeType: 'image/jpeg',
    notes: null,
    status: 'VERIFIED',
    createdAt: '2026-05-10T08:00:00Z',
  },
  {
    id: 'doc-2',
    type: 'PAYSLIP',
    fileName: 'sueldo.pdf',
    mimeType: 'application/pdf',
    notes: null,
    status: 'PENDING',
    createdAt: '2026-05-12T09:30:00Z',
  },
];

describe('DocumentList', () => {
  it('shows loading skeletons when isLoading is true', () => {
    const { container } = render(<DocumentList documents={[]} isLoading={true} />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThanOrEqual(2);
  });

  it('shows error message when error is set', () => {
    render(<DocumentList documents={[]} isLoading={false} error="Error al cargar" />);
    expect(screen.getByText('Error al cargar')).toBeInTheDocument();
  });

  it('shows empty state when documents array is empty', () => {
    render(<DocumentList documents={[]} isLoading={false} />);
    expect(screen.getByText('No subiste documentos todavía')).toBeInTheDocument();
  });

  it('renders table with documents when data is provided', () => {
    render(<DocumentList documents={sampleDocs} isLoading={false} />);
    expect(screen.getByText('Cédula Frente')).toBeInTheDocument();
    expect(screen.getByText('Recibo de Sueldo')).toBeInTheDocument();
    expect(screen.getByText('Verificado')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });
});
