import { PipeTransform, BadRequestException } from '@nestjs/common';
import type { ZodSchema, ZodError } from 'zod';

// ponytail: generic Zod validation pipe — reuse shared schemas instead of DTO classes
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown): unknown {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const zodError = result.error as ZodError;
      throw new BadRequestException({
        message: 'Validation failed',
        errors: zodError.errors.map((e: { path: (string | number)[]; message: string }) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    return result.data;
  }
}
