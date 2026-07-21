// ponytail: Lookup table, not a class. Add DB persistence when there are more states or runtime configuration.
export const INSTALLMENT_STATUSES = ['PENDING', 'PAID', 'OVERDUE', 'DEFAULTED'] as const;
export type InstallmentStatus = typeof INSTALLMENT_STATUSES[number];
