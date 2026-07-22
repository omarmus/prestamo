import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { AdminCustomerDetail } from '../admin-customer-detail';
import type { AdminCustomerDetailResponse } from '@prestamos/shared';

afterEach(cleanup);

const mockDetail: AdminCustomerDetailResponse = {
  customer: {
    id: '1',
    userId: 'u1',
    firstName: 'Juan',
    lastName: 'Pérez',
    documentType: 'CI',
    documentNumber: '1234567',
    birthDate: '1990-01-01',
    gender: 'M',
    maritalStatus: 'SOLTERO',
    occupation: 'Ingeniero',
    monthlyIncome: 5000,
    status: 'ACTIVE',
    kycStatus: 'APPROVED',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    addresses: [
      { id: 'a1', type: 'DOMICILIO', country: 'Bolivia', department: 'Santa Cruz', city: 'Santa Cruz', zone: 'Equipetrol', street: 'Av. San Martín', number: '123', isPrimary: true, createdAt: '2024-01-01T00:00:00Z' },
    ],
    phones: [
      { id: 'p1', phone: '77123456', isWhatsApp: true, isPrimary: true, createdAt: '2024-01-01T00:00:00Z' },
    ],
    emails: [
      { id: 'e1', email: 'juan@example.com', isPrimary: true, createdAt: '2024-01-01T00:00:00Z' },
    ],
    employment: {
      id: 'emp1',
      employer: 'Empresa SA',
      position: 'Ingeniero de Sistemas',
      employmentStatus: 'ACTIVO',
      monthlySalary: 8000,
      yearsWorking: 5,
      createdAt: '2024-01-01T00:00:00Z',
    },
    incomes: [
      { id: 'i1', source: 'Salario', amount: 8000, frequency: 'MENSUAL', createdAt: '2024-01-01T00:00:00Z' },
    ],
    bankAccounts: [],
    documents: [
      { id: 'd1', type: 'CI', fileName: 'ci.pdf', mimeType: 'application/pdf', notes: null, status: 'APPROVED', createdAt: '2024-01-01T00:00:00Z' },
    ],
    simulations: [],
    portalActions: [],
    user: { email: 'juan@example.com', phone: '77123456', name: 'Juan Pérez' },
  },
  loans: [
    { id: 'l1', amount: 10000, status: 'ACTIVE', outstandingBalance: 5000, disbursedAt: '2024-03-01T00:00:00Z' },
  ],
  applications: [
    { id: 'a1', amount: 15000, status: 'PENDING', createdAt: '2024-06-01T00:00:00Z' },
  ],
};

describe('AdminCustomerDetail', () => {
  it('renders personal information section', () => {
    render(<AdminCustomerDetail customer={mockDetail} isLoading={false} error={null} />);
    // Name appears in header + personal info section -> use getAllByText for at least 1
    expect(screen.getAllByText('Juan Pérez').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('CI')).toBeInTheDocument();
    expect(screen.getByText('1234567')).toBeInTheDocument();
  });

  it('renders contact section', () => {
    render(<AdminCustomerDetail customer={mockDetail} isLoading={false} error={null} />);
    // Email appears twice (user.email + primary email from emails array), so use getAllByText
    expect(screen.getAllByText('juan@example.com').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('77123456').length).toBeGreaterThanOrEqual(1);
  });

  it('renders employment section', () => {
    render(<AdminCustomerDetail customer={mockDetail} isLoading={false} error={null} />);
    expect(screen.getByText('Empresa SA')).toBeInTheDocument();
    expect(screen.getByText('Ingeniero de Sistemas')).toBeInTheDocument();
  });

  it('renders loans section', () => {
    render(<AdminCustomerDetail customer={mockDetail} isLoading={false} error={null} />);
    expect(screen.getByText('Préstamos')).toBeInTheDocument();
  });

  it('renders documents section', () => {
    render(<AdminCustomerDetail customer={mockDetail} isLoading={false} error={null} />);
    expect(screen.getByText('CI')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<AdminCustomerDetail customer={null} isLoading={true} error={null} />);
    expect(screen.getByText('Cargando información del cliente...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    render(<AdminCustomerDetail customer={null} isLoading={false} error="Error al cargar" />);
    expect(screen.getByText('Error al cargar')).toBeInTheDocument();
  });
});
