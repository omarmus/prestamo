export interface AmortizationRow {
  period: number;
  payment: number;
  interest: number;
  principal: number;
  balance: number;
}

export interface LoanResult {
  monthlyPayment: number;
  totalInterest: number;
  totalPayment: number;
  schedule: AmortizationRow[];
}

// ponytail: French amortization (fixed payment) — standard for Bolivian consumer loans
export function calculateLoan(
  amount: number,
  annualRate: number,
  termMonths: number,
): LoanResult {
  const monthlyRate = annualRate / 100 / 12;
  const payment =
    (amount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
    (Math.pow(1 + monthlyRate, termMonths) - 1);
  const monthlyPayment = Math.round(payment * 100) / 100;

  let balance = amount;
  const schedule: AmortizationRow[] = [];

  for (let period = 1; period <= termMonths; period++) {
    const interest = Math.round(balance * monthlyRate * 100) / 100;
    const principal = Math.round((monthlyPayment - interest) * 100) / 100;
    balance = Math.round((balance - principal) * 100) / 100;
    if (balance < 0) balance = 0;

    schedule.push({ period, payment: monthlyPayment, interest, principal, balance });
  }

  const totalPayment = Math.round(monthlyPayment * termMonths * 100) / 100;
  const totalInterest = Math.round((totalPayment - amount) * 100) / 100;

  return { monthlyPayment, totalInterest, totalPayment, schedule };
}
