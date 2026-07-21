export const PAYMENT_METHODS = ['CASH', 'TRANSFER'] as const;
export type PaymentMethod = typeof PAYMENT_METHODS[number];
