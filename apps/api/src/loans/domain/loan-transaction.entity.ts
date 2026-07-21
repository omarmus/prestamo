export class LoanTransaction {
  constructor(
    public readonly id: string,
    public readonly loanId: string,
    public readonly type: string,
    public readonly amount: number,
    public readonly balanceAfter: number,
    public readonly description: string | null,
    public readonly reference: string | null,
    public readonly createdAt: string,
  ) {}
}
