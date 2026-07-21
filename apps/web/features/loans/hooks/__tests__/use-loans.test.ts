import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLoans } from '../use-loans';

const mockApplication = {
  id: 'loan-1',
  amount: 10000,
  termMonths: 12,
  annualRate: 12,
  monthlyPayment: 888.49,
  totalInterest: 661.85,
  totalPayment: 10661.85,
  purpose: 'NEGOCIO',
  status: 'DRAFT',
  riskScore: null,
  simulationId: null,
  reviewerId: null,
  reviewNotes: null,
  reviewedAt: null,
  createdAt: '2026-07-01T10:00:00Z',
  updatedAt: '2026-07-01T10:00:00Z',
  timeline: [{ fromStatus: null, toStatus: 'DRAFT', changedBy: 'customer', changedAt: '2026-07-01T10:00:00Z' }],
};

describe('useLoans', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('list() hace GET a /api/loans/applications', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([mockApplication]),
    } as Response);

    const { result } = renderHook(() => useLoans());

    await act(async () => {
      await result.current.list();
    });

    const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(callArgs[0]).toBe('/api/loans/applications');
    expect(callArgs[1].method).toBeUndefined(); // GET by default
    expect(result.current.applications).toHaveLength(1);
    expect(result.current.isLoading).toBe(false);
  });

  it('create() hace POST con body correcto', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockApplication),
    } as Response);

    const { result } = renderHook(() => useLoans());

    await act(async () => {
      await result.current.create({ simulationId: 'sim-1', submit: true });
    });

    const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(callArgs[0]).toBe('/api/loans/applications');
    expect(callArgs[1].method).toBe('POST');
    const body = JSON.parse(callArgs[1].body);
    expect(body).toEqual({ simulationId: 'sim-1', submit: true });
    expect(result.current.applications).toHaveLength(1);
    expect(result.current.isLoading).toBe(false);
  });

  it('cancel() hace DELETE y actualiza estado local', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockApplication),
    } as Response);

    const { result } = renderHook(() => useLoans());

    // Set initial state
    act(() => {
      // @ts-expect-error - accessing internal state directly for test setup
      result.current.applications.push(mockApplication);
    });

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ...mockApplication, status: 'CANCELLED' }),
    } as Response);

    await act(async () => {
      await result.current.cancel('loan-1');
    });

    const cancelCallArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(cancelCallArgs[0]).toBe('/api/loans/applications/loan-1');
    expect(cancelCallArgs[1].method).toBe('DELETE');
    expect(result.current.isLoading).toBe(false);
  });

  it('Loading state during request', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let resolvePromise!: (value: any) => void;
    vi.spyOn(global, 'fetch').mockReturnValueOnce(new Promise((resolve) => {
      resolvePromise = resolve;
    }));

    const { result } = renderHook(() => useLoans());

    act(() => {
      result.current.list();
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolvePromise({ ok: true, json: () => Promise.resolve([]) } as Response);
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('Error handling con ApiError', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ message: 'No se puede cancelar' }),
    } as Response);

    const { result } = renderHook(() => useLoans());

    await act(async () => {
      await result.current.cancel('loan-1');
    });

    expect(result.current.error).toBe('No se puede cancelar');
    expect(result.current.isLoading).toBe(false);
  });
});
