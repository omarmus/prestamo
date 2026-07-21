// ponytail: Pure function, not a class. Add service wrapper when there are multiple amortization types.

export interface AmortizationRow {
  installmentNumber: number;
  dueDate: string; // YYYY-MM-DD
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  remainingBalance: number;
}

/**
 * Sistema francés de amortización (cuota fija mensual).
 * Calcula el cronograma completo de pagos.
 *
 * Fórmula: cuota = P * (r * (1+r)^n) / ((1+r)^n - 1)
 * donde r = annualRate / 12 / 100
 */
export function calculateAmortization(
  amount: number,
  annualRate: number,
  termMonths: number,
  disbursedAt: Date,
): AmortizationRow[] {
  const monthlyRate = annualRate / 12 / 100;

  // Handle 0% rate edge case
  if (monthlyRate === 0) {
    const monthlyPayment = Math.round((amount / termMonths) * 100) / 100;
    const rows: AmortizationRow[] = [];
    let remaining = amount;

    for (let i = 1; i <= termMonths; i++) {
      const isLast = i === termMonths;
      const principalAmount = isLast
        ? Math.round(remaining * 100) / 100
        : monthlyPayment;
      remaining = Math.round((remaining - principalAmount) * 100) / 100;

      rows.push({
        installmentNumber: i,
        dueDate: calculateDueDate(disbursedAt, i),
        principalAmount,
        interestAmount: 0,
        totalAmount: principalAmount,
        remainingBalance: remaining,
      });
    }
    return rows;
  }

  const factor = Math.pow(1 + monthlyRate, termMonths);
  const monthlyPayment = Math.round(
    (amount * monthlyRate * factor) / (factor - 1) * 100
  ) / 100;

  let balance = amount;
  const rows: AmortizationRow[] = [];

  for (let i = 1; i <= termMonths; i++) {
    const interestAmount = Math.round(balance * monthlyRate * 100) / 100;
    let principalAmount = Math.round((monthlyPayment - interestAmount) * 100) / 100;

    if (i === termMonths) {
      // Last installment: absorb rounding difference so balanceAfter = 0
      principalAmount = Math.round(balance * 100) / 100;
    }

    balance = Math.round((balance - principalAmount) * 100) / 100;

    const totalAmount = Math.round((principalAmount + interestAmount) * 100) / 100;

    rows.push({
      installmentNumber: i,
      dueDate: calculateDueDate(disbursedAt, i),
      principalAmount,
      interestAmount,
      totalAmount,
      remainingBalance: balance,
    });
  }

  return rows;
}

// ponytail: dueDate via setMonth with end-of-month snapping. Use a date library when date precision matters.
function calculateDueDate(disbursedAt: Date, monthOffset: number): string {
  const dueDate = new Date(disbursedAt);
  dueDate.setMonth(dueDate.getMonth() + monthOffset);
  // If day changed due to overflow (e.g., Jan 31 → Mar 3), snap to end of target month
  if (dueDate.getDate() !== disbursedAt.getDate()) {
    dueDate.setDate(0); // Last day of previous month (which is the target month after overflow)
  }
  // Use local date parts to avoid UTC timezone shift
  const y = dueDate.getFullYear();
  const m = String(dueDate.getMonth() + 1).padStart(2, '0');
  const d = String(dueDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
