import { calculateLoan } from './loan-calculator';

describe('calculateLoan', () => {
  it('calculates correct monthly payment for standard loan', () => {
    const result = calculateLoan(10000, 12, 12);

    // P = 10000, r = 0.01 (12%/12), n = 12
    // M = 10000 * 0.01 * (1.01^12) / (1.01^12 - 1)
    // M ≈ 888.49
    expect(result.monthlyPayment).toBeCloseTo(888.49, 0);
    expect(result.totalPayment).toBeCloseTo(10661.88, 0);
    expect(result.totalInterest).toBeCloseTo(661.88, 0);
  });

  it('produces correct schedule length', () => {
    const result = calculateLoan(5000, 10, 6);
    expect(result.schedule).toHaveLength(6);
  });

  it('last payment brings balance to zero', () => {
    const result = calculateLoan(15000, 8.5, 24);
    const lastRow = result.schedule[result.schedule.length - 1];
    expect(lastRow.balance).toBe(0);
    expect(lastRow.period).toBe(24);
  });

  it('handles very small loans', () => {
    const result = calculateLoan(100, 5, 3);
    expect(result.monthlyPayment).toBeGreaterThan(0);
    expect(result.totalInterest).toBeGreaterThan(0);
    expect(result.schedule).toHaveLength(3);
    // ponytail: rounding can leave < 0.01 on very small loans
    expect(result.schedule[result.schedule.length - 1].balance).toBeLessThanOrEqual(0.01);
  });

  it('handles long-term loans', () => {
    const result = calculateLoan(500000, 6.5, 120);
    expect(result.monthlyPayment).toBeGreaterThan(0);
    expect(result.schedule).toHaveLength(120);
    expect(result.schedule[result.schedule.length - 1].balance).toBe(0);
  });

  it('schedule totals match totalPayment', () => {
    const result = calculateLoan(20000, 15, 18);
    const sumPayments = result.schedule.reduce((sum, row) => sum + row.payment, 0);
    expect(Math.round(sumPayments * 100) / 100).toBeCloseTo(result.totalPayment, 0);
  });
});
