// ponytail: Lookup table, not a class. Add DB persistence when there are more states or runtime configuration.
export const LOAN_STATUSES = [
  'DRAFT', 'PENDING', 'IN_REVIEW', 'INFO_REQUESTED',
  'APPROVED', 'REJECTED', 'CANCELLED',
] as const;

export type LoanStatus = typeof LOAN_STATUSES[number];

const VALID_TRANSITIONS: Record<LoanStatus, LoanStatus[]> = {
  DRAFT:          ['PENDING', 'CANCELLED'],
  PENDING:        ['IN_REVIEW', 'CANCELLED'],
  IN_REVIEW:      ['APPROVED', 'REJECTED', 'INFO_REQUESTED'],
  INFO_REQUESTED: ['PENDING'],
  APPROVED:       [],
  REJECTED:       [],
  CANCELLED:      [],
};

export function canTransition(from: LoanStatus, to: LoanStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}
