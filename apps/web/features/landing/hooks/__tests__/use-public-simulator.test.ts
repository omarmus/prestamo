import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePublicSimulator } from '../use-public-simulator';

describe('usePublicSimulator', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should make a POST request to /api/simulations/calculate', async () => {
    const mockResponse = {
      monthlyPayment: 888.49,
      totalInterest: 661.88,
      totalPayment: 10661.88,
      schedule: [],
    };
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const { result } = renderHook(() => usePublicSimulator());

    await act(async () => {
      await result.current.calculate({
        amount: 10000,
        termMonths: 12,
        annualRate: 12,
      });
    });

    expect(fetch).toHaveBeenCalledWith('/api/simulations/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 10000, termMonths: 12, annualRate: 12 }),
    });
    expect(result.current.result).toEqual(mockResponse);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle API errors', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: 'Monto inválido' }),
    } as Response);

    const { result } = renderHook(() => usePublicSimulator());

    await act(async () => {
      await result.current.calculate({
        amount: 50,
        termMonths: 12,
        annualRate: 12,
      });
    });

    expect(result.current.error).toBe('Monto inválido');
    expect(result.current.isLoading).toBe(false);
  });

  it('should not include Authorization header', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    } as Response);

    const { result } = renderHook(() => usePublicSimulator());

    await act(async () => {
      await result.current.calculate({
        amount: 10000,
        termMonths: 12,
        annualRate: 12,
      });
    });

    const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const headers = callArgs[1].headers;
    expect(headers).not.toHaveProperty('Authorization');
  });

  it('should reset state with reset()', async () => {
    const { result } = renderHook(() => usePublicSimulator());

    act(() => {
      result.current.reset();
    });

    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
