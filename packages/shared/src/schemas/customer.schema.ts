import { z } from 'zod';

// --- Customer ---

export const CreateCustomerSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().max(100).optional(),
  documentType: z.enum(['CI', 'PASSPORT', 'OTHER']).optional(),
  documentNumber: z.string().max(30).optional(),
  birthDate: z.string().datetime().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  maritalStatus: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED']).optional(),
  occupation: z.string().max(100).optional(),
  monthlyIncome: z.number().positive().optional(),
});

export const UpdateCustomerSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().max(100).optional(),
  documentType: z.enum(['CI', 'PASSPORT', 'OTHER']).optional(),
  documentNumber: z.string().max(30).optional(),
  birthDate: z.string().datetime().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  maritalStatus: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED']).optional(),
  occupation: z.string().max(100).optional(),
  monthlyIncome: z.number().positive().optional(),
});

export const CustomerIdParamSchema = z.object({
  customerId: z.string().uuid(),
});

// --- Addresses ---

export const CreateAddressSchema = z.object({
  type: z.enum(['HOME', 'WORK', 'CORRESPONDENCE']).optional(),
  country: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  zone: z.string().max(200).optional(),
  street: z.string().max(200).optional(),
  number: z.string().max(20).optional(),
  isPrimary: z.boolean().optional(),
});

export const UpdateAddressSchema = CreateAddressSchema.partial();

// --- Phones ---

export const CreatePhoneSchema = z.object({
  phone: z.string().regex(/^\+591[67]\d{7}$/, 'Formato: +591XXXXXXXXX'),
  isWhatsApp: z.boolean().optional(),
  isPrimary: z.boolean().optional(),
});

export const UpdatePhoneSchema = z.object({
  phone: z.string().regex(/^\+591[67]\d{7}$/, 'Formato: +591XXXXXXXXX').optional(),
  isWhatsApp: z.boolean().optional(),
  isPrimary: z.boolean().optional(),
});

// --- Emails ---

export const CreateEmailSchema = z.object({
  email: z.string().email(),
  isPrimary: z.boolean().optional(),
});

export const UpdateEmailSchema = z.object({
  email: z.string().email().optional(),
  isPrimary: z.boolean().optional(),
});

// --- Employment ---

export const UpsertEmploymentSchema = z.object({
  employer: z.string().max(200).optional(),
  position: z.string().max(100).optional(),
  employmentStatus: z.enum(['EMPLOYEE', 'SELF_EMPLOYED', 'BUSINESS_OWNER', 'UNEMPLOYED']).optional(),
  monthlySalary: z.number().positive().optional(),
  yearsWorking: z.number().int().min(0).optional(),
});

// --- Income ---

export const CreateIncomeSchema = z.object({
  source: z.enum(['SALARY', 'BUSINESS', 'RENT', 'COMMISSION', 'PENSION', 'OTHER']).optional(),
  amount: z.number().positive(),
  frequency: z.enum(['MONTHLY', 'BIWEEKLY', 'WEEKLY', 'YEARLY']).optional(),
});

export const UpdateIncomeSchema = z.object({
  source: z.enum(['SALARY', 'BUSINESS', 'RENT', 'COMMISSION', 'PENSION', 'OTHER']).optional(),
  amount: z.number().positive().optional(),
  frequency: z.enum(['MONTHLY', 'BIWEEKLY', 'WEEKLY', 'YEARLY']).optional(),
});

// --- Bank Accounts ---

export const CreateBankAccountSchema = z.object({
  bank: z.string().max(200).optional(),
  accountType: z.enum(['SAVINGS', 'CHECKING']).optional(),
  accountNumber: z.string().max(50).optional(),
  holderName: z.string().max(200).optional(),
  isPrimary: z.boolean().optional(),
});

export const UpdateBankAccountSchema = CreateBankAccountSchema.partial();

// --- Documents ---

export const CreateDocumentSchema = z.object({
  type: z.enum(['CI_FRONT', 'CI_BACK', 'SELFIE', 'PAYSLIP', 'BANK_STATEMENT', 'SERVICE_BILL']),
  fileName: z.string().max(255).optional(),
  mimeType: z.string().max(100).optional(),
  data: z.string().min(1),  // base64
  notes: z.string().max(500).optional(),
});

// --- Loan Simulation ---

export const CreateSimulationSchema = z.object({
  amount: z.number().positive(),
  termMonths: z.number().int().min(1).max(120),
  annualRate: z.number().positive().max(100),
});

// --- Portal Action ---

export const CreatePortalActionSchema = z.object({
  action: z.string().min(1).max(100),
  metadata: z.record(z.unknown()).optional(),
});

// --- Inferred Types ---

export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof UpdateCustomerSchema>;
export type CreateAddressInput = z.infer<typeof CreateAddressSchema>;
export type UpdateAddressInput = z.infer<typeof UpdateAddressSchema>;
export type CreatePhoneInput = z.infer<typeof CreatePhoneSchema>;
export type UpdatePhoneInput = z.infer<typeof UpdatePhoneSchema>;
export type CreateEmailInput = z.infer<typeof CreateEmailSchema>;
export type UpdateEmailInput = z.infer<typeof UpdateEmailSchema>;
export type UpsertEmploymentInput = z.infer<typeof UpsertEmploymentSchema>;
export type CreateIncomeInput = z.infer<typeof CreateIncomeSchema>;
export type UpdateIncomeInput = z.infer<typeof UpdateIncomeSchema>;
export type CreateBankAccountInput = z.infer<typeof CreateBankAccountSchema>;
export type UpdateBankAccountInput = z.infer<typeof UpdateBankAccountSchema>;
export type CreateDocumentInput = z.infer<typeof CreateDocumentSchema>;
export type CreateSimulationInput = z.infer<typeof CreateSimulationSchema>;
export type CreatePortalActionInput = z.infer<typeof CreatePortalActionSchema>;
