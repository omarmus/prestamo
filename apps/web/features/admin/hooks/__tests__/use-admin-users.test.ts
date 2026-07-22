import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAdminUsers } from '../use-admin-users';
import { api } from '@/lib/api-client';
import type { UserProfile } from '@prestamos/shared';

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

const mockUser = {
  id: '1',
  email: 'admin@example.com',
  name: 'Admin User',
  phone: '77123456',
  role: 'ADMIN',
  createdAt: '2024-01-01T00:00:00Z',
};

const mockListResponse = {
  data: [mockUser],
};

describe('useAdminUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns initial state', () => {
    const { result } = renderHook(() => useAdminUsers());
    expect(result.current.list).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.createLoading).toBe(false);
    expect(result.current.createError).toBeNull();
  });

  it('load fetches users and sets list', async () => {
    vi.mocked(api.get).mockResolvedValue(mockListResponse);
    const { result } = renderHook(() => useAdminUsers());

    await act(async () => {
      await result.current.load();
    });

    expect(api.get).toHaveBeenCalledWith('/api/admin/users');
    expect(result.current.list).toEqual([mockUser]);
    expect(result.current.isLoading).toBe(false);
  });

  it('load without params uses defaults', async () => {
    vi.mocked(api.get).mockResolvedValue(mockListResponse);
    const { result } = renderHook(() => useAdminUsers());

    await act(async () => {
      await result.current.load();
    });

    expect(api.get).toHaveBeenCalledWith('/api/admin/users');
  });

  it('load handles error', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useAdminUsers());

    await act(async () => {
      await result.current.load();
    });

    expect(result.current.error).toBe('Error al cargar usuarios');
    expect(result.current.isLoading).toBe(false);
  });

  it('create posts new user and returns profile', async () => {
    const mockProfile = { id: '2', email: 'new@example.com', name: 'New Admin', phone: '+59177123456', role: 'ADMIN' as const, createdAt: '2024-06-01T00:00:00Z' };
    vi.mocked(api.post).mockResolvedValue(mockProfile);
    const { result } = renderHook(() => useAdminUsers());

    let profile: UserProfile | null = null;
    await act(async () => {
      profile = await result.current.create({
        email: 'new@example.com',
        name: 'New Admin',
        phone: '+59177123456',
        password: 'password123',
      });
    });

    expect(api.post).toHaveBeenCalledWith('/api/admin/users', {
      email: 'new@example.com',
      name: 'New Admin',
      phone: '+59177123456',
      password: 'password123',
    });
    expect(profile).toEqual(mockProfile);
    expect(result.current.createLoading).toBe(false);
  });

  it('create handles error', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('Email already exists'));
    const { result } = renderHook(() => useAdminUsers());

    await act(async () => {
      await result.current.create({
        email: 'existing@example.com',
        name: 'Existing',
        phone: '+59177123456',
        password: 'password123',
      });
    });

    expect(result.current.createError).toBe('Error al crear usuario');
    expect(result.current.createLoading).toBe(false);
  });
});
