import { calculateAmortization } from './amortization';

// Helper to create local-timezone dates (avoid UTC parsing issues with 'YYYY-MM-DD' strings)
function localDate(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day);
}

describe('calculateAmortization', () => {
  const jan15 = localDate(2025, 1, 15);
  const jan31 = localDate(2025, 1, 31);

  it('calculates standard 12-month loan at 12%', () => {
    const result = calculateAmortization(10000, 12, 12, jan15);

    expect(result).toHaveLength(12);

    const firstRow = result[0];
    expect(firstRow.principalAmount).toBe(788.49);
    expect(firstRow.interestAmount).toBe(100.00);
    expect(firstRow.totalAmount).toBe(888.49);
    expect(firstRow.remainingBalance).toBe(9211.51);
  });

  it('has correct monthly payment for P=10000, r=12%, n=12', () => {
    const result = calculateAmortization(10000, 12, 12, jan15);

    const monthlyPayments = result.map(r => r.totalAmount);
    for (let i = 0; i < monthlyPayments.length - 1; i++) {
      expect(monthlyPayments[i]).toBe(888.49);
    }
  });

  it('last installment absorbs rounding and balanceAfter = 0', () => {
    const result = calculateAmortization(10000, 12, 12, jan15);

    const lastRow = result[11];
    expect(lastRow.remainingBalance).toBe(0);
  });

  it('sum of principal equals original amount (within rounding)', () => {
    const result = calculateAmortization(10000, 12, 12, jan15);

    const sumPrincipal = result.reduce((s, r) => s + r.principalAmount, 0);
    expect(Math.abs(sumPrincipal - 10000)).toBeLessThan(0.05);
  });

  it('sum of interest + sum of principal = sum of totals', () => {
    const result = calculateAmortization(10000, 12, 12, jan15);

    const sumPrincipal = result.reduce((s, r) => s + r.principalAmount, 0);
    const sumInterest = result.reduce((s, r) => s + r.interestAmount, 0);
    const sumTotal = result.reduce((s, r) => s + r.totalAmount, 0);

    expect(Math.abs(sumPrincipal + sumInterest - sumTotal)).toBeLessThan(0.01);
  });

  it('handles 0% annual rate', () => {
    const result = calculateAmortization(10000, 0, 12, jan15);

    expect(result).toHaveLength(12);
    expect(result[0].principalAmount).toBe(833.33);
    expect(result[0].interestAmount).toBe(0);
    expect(result[0].totalAmount).toBe(833.33);

    const lastRow = result[11];
    expect(lastRow.remainingBalance).toBe(0);
    expect(lastRow.interestAmount).toBe(0);
  });

  it('handles small loan with 3-month term', () => {
    const result = calculateAmortization(100, 12, 3, jan15);

    expect(result).toHaveLength(3);
    result.forEach(row => {
      expect(row.principalAmount).toBeGreaterThan(0);
      expect(row.interestAmount).toBeGreaterThan(0);
      expect(row.totalAmount).toBeGreaterThan(0);
    });

    const lastRow = result[2];
    expect(lastRow.remainingBalance).toBe(0);
  });

  it('handles max term of 120 months', () => {
    const result = calculateAmortization(50000, 10, 120, jan15);

    expect(result).toHaveLength(120);
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].totalAmount).toBeGreaterThan(0);
    }

    const lastRow = result[119];
    expect(lastRow.remainingBalance).toBe(0);

    const sumPrincipal = result.reduce((s, r) => s + r.principalAmount, 0);
    expect(Math.abs(sumPrincipal - 50000)).toBeLessThan(1);
  });

  it('generates due dates as month offsets from disbursedAt', () => {
    const result = calculateAmortization(10000, 12, 12, jan15);

    expect(result[0].dueDate).toBe('2025-02-15');
    expect(result[11].dueDate).toBe('2026-01-15');
  });

  it('snaps end-of-month due dates correctly', () => {
    const result = calculateAmortization(10000, 12, 3, jan31);

    // Jan 31 + 1 month → Feb 31 overflows → snap to Feb 28 (2025 not leap)
    expect(result[0].dueDate).toBe('2025-02-28');
    // Jan 31 + 2 months → Mar 31 (no overflow)
    expect(result[1].dueDate).toBe('2025-03-31');
    // Jan 31 + 3 months → Apr 31 overflows → snap to Apr 30
    expect(result[2].dueDate).toBe('2025-04-30');
  });

  it('each installment totalAmount is consistent per row', () => {
    const result = calculateAmortization(10000, 12, 12, jan15);

    result.forEach(row => {
      expect(row.totalAmount).toBeCloseTo(row.principalAmount + row.interestAmount, 2);
    });
  });

  it('remaining balance decreases monotonically', () => {
    const result = calculateAmortization(10000, 12, 12, jan15);

    for (let i = 1; i < result.length; i++) {
      expect(result[i].remainingBalance).toBeLessThan(result[i - 1].remainingBalance);
    }
  });
});
