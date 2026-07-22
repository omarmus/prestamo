import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAdminCustomers } from '../use-admin-customers';
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

const mockCustomer = {
  id: '1',
  firstName: 'Juan',
  lastName: 'Pérez',
  documentType: 'CI',
  documentNumber: '1234567',
  email: 'juan@example.com',
  phone: '77123456',
  status: 'ACTIVE',
  kycStatus: 'APPROVED',
  createdAt: '2024-01-01T00:00:00Z',
};

const mockListResponse = {
  data: [mockCustomer],
  pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
};

const mockDetailResponse = {
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
    addresses: [],
    phones: [],
    emails: [],
    employment: null,
    incomes: [],
    bankAccounts: [],
    documents: [],
    simulations: [],
    portalActions: [],
    user: { email: 'juan@example.com', phone: '77123456', name: 'Juan Pérez' },
  },
  loans: [],
  applications: [],
};

describe('useAdminCustomers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns initial state', () => {
    const { result } = renderHook(() => useAdminCustomers());
    expect(result.current.list).toEqual([]);
    expect(result.current.detail).toBeNull();
    expect(result.current.pagination).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('search fetches customers and sets list + pagination', async () => {
    vi.mocked(api.get).mockResolvedValue(mockListResponse);
    const { result } = renderHook(() => useAdminCustomers());

    await act(async () => {
      await result.current.search({ search: 'Juan' });
    });

    expect(api.get).toHaveBeenCalledWith('/api/admin/customers?search=Juan&page=1&limit=20');
    expect(result.current.list).toEqual([mockCustomer]);
    expect(result.current.pagination).toEqual(mockListResponse.pagination);
    expect(result.current.isLoading).toBe(false);
  });

  it('search without params uses defaults', async () => {
    vi.mocked(api.get).mockResolvedValue(mockListResponse);
    const { result } = renderHook(() => useAdminCustomers());

    await act(async () => {
      await result.current.search();
    });

    expect(api.get).toHaveBeenCalledWith('/api/admin/customers?page=1&limit=20');
  });

  it('search handles error', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useAdminCustomers());

    await act(async () => {
      await result.current.search();
    });

    expect(result.current.error).toBe('Error al cargar clientes');
    expect(result.current.isLoading).toBe(false);
  });

  it('getDetail fetches customer detail', async () => {
    vi.mocked(api.get).mockResolvedValue(mockDetailResponse);
    const { result } = renderHook(() => useAdminCustomers());

    await act(async () => {
      await result.current.getDetail('1');
    });

    expect(api.get).toHaveBeenCalledWith('/api/admin/customers/1');
    expect(result.current.detail).toEqual(mockDetailResponse);
    expect(result.current.isLoading).toBe(false);
  });

  it('getDetail handles error', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('Not found'));
    const { result } = renderHook(() => useAdminCustomers());

    await act(async () => {
      await result.current.getDetail('999');
    });

    expect(result.current.error).toBe('Error al cargar detalle del cliente');
    expect(result.current.detail).toBeNull();
  });
});
