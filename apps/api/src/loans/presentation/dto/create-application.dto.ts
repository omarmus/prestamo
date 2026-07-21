// ponytail: re-export shared Zod schema for NestJS DI compatibility.
// Controllers can use ZodValidationPipe directly with the shared schema.
export { CreateLoanApplicationSchema } from '@prestamos/shared';
export type { CreateLoanApplicationInput } from '@prestamos/shared';
