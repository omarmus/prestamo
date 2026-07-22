// ponytail: DTO mirrors RegisterSchema shape from @prestamos/shared.
// Add a ZodValidationPipe to the controller for runtime validation.
export class RegisterDto {
  email!: string;
  password!: string;
  name!: string;
  phone!: string;
  documentType?: string;
  documentNumber!: string;
  role?: 'USER' | 'ADMIN';
}
