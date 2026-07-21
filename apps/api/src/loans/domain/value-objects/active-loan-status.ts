// ponytail: Lookup table, not a class. Add DB persistence when there are more states or runtime configuration.
export const ACTIVE_LOAN_STATUSES = ['ACTIVE', 'CLOSED', 'DEFAULTED'] as const;
export type ActiveLoanStatus = typeof ACTIVE_LOAN_STATUSES[number];

const VALID_TRANSITIONS: Record<ActiveLoanStatus, ActiveLoanStatus[]> = {
  ACTIVE:     ['CLOSED', 'DEFAULTED'],
  CLOSED:     [],
  DEFAULTED:  [],
};

export function canTransitionActiveLoan(from: ActiveLoanStatus, to: ActiveLoanStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}
