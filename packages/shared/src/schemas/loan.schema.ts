import { z } from 'zod';

export const LoanPurposeEnum = z.enum(['NEGOCIO', 'EDUCACION', 'SALUD', 'VIAJE', 'OTRO']);
export type LoanPurpose = z.infer<typeof LoanPurposeEnum>;

export const LoanStatusEnum = z.enum([
  'DRAFT', 'PENDING', 'IN_REVIEW', 'INFO_REQUESTED',
  'APPROVED', 'REJECTED', 'CANCELLED', 'ACTIVE',
]);
export type LoanStatus = z.infer<typeof LoanStatusEnum>;

export const CreateLoanApplicationSchema = z.object({
  simulationId: z.string().uuid().optional(),
  amount: z.number().positive().min(100).max(500000).optional(),
  termMonths: z.number().int().min(3).max(120).optional(),
  annualRate: z.number().positive().max(36).optional(),
  purpose: LoanPurposeEnum.optional(),
  submit: z.boolean().optional(),
}).refine(
  (data) => {
    if (data.simulationId) {
      return !data.amount && !data.termMonths && !data.annualRate;
    }
    return data.amount != null && data.termMonths != null && data.annualRate != null;
  },
  { message: 'Debe proporcionar simulationId o (amount, termMonths, annualRate), no ambos', path: ['simulationId'] },
);
export type CreateLoanApplicationInput = z.infer<typeof CreateLoanApplicationSchema>;

export const ReviewApplicationSchema = z.object({
  notes: z.string().max(1000).optional(),
  reason: z.string().min(1).max(1000).optional(),
  message: z.string().min(1).max(1000).optional(),
});
export type ReviewLoanApplicationInput = z.infer<typeof ReviewApplicationSchema>;

export const AdminListQuerySchema = z.object({
  status: LoanStatusEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().max(100).optional(),
});
export type AdminListQuery = z.infer<typeof AdminListQuerySchema>;

export const ActiveLoanStatusEnum = z.enum(['ACTIVE', 'CLOSED', 'DEFAULTED']);

export const RegisterPaymentSchema = z.object({
  loanId: z.string().uuid(),
  amount: z.number().positive(),
  method: z.enum(['CASH', 'TRANSFER']),
  reference: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});
export type RegisterPaymentInputSchema = z.infer<typeof RegisterPaymentSchema>;

export const AdminActiveLoanQuerySchema = z.object({
  status: ActiveLoanStatusEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(100).optional(),
});
export type AdminActiveLoanQueryInput = z.infer<typeof AdminActiveLoanQuerySchema>;
