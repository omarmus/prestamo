import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { PublicSimulateSchema } from '@prestamos/shared';
import type { SimulateLoanInput } from '@prestamos/shared';
import { ZodValidationPipe } from '../shared/pipes/zod-validation.pipe';
import { calculateLoan } from '../shared/loan-calculator';
import type { LoanResult } from '../shared/loan-calculator';

@Controller('api/simulations')
export class PublicController {
  @Post('calculate')
  @HttpCode(200)
  calculate(
    @Body(new ZodValidationPipe(PublicSimulateSchema)) input: SimulateLoanInput,
  ): LoanResult {
    return calculateLoan(input.amount, input.annualRate, input.termMonths);
  }
}
