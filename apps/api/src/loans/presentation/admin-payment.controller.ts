import { Inject, Controller, Get, Post, Body, Param, Query, UseGuards, HttpCode } from '@nestjs/common';
import type { JwtPayload } from '@prestamos/shared';
import { RegisterPaymentSchema, AdminActiveLoanQuerySchema } from '@prestamos/shared';
import type { AdminActiveLoanQueryInput } from '@prestamos/shared';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe';
import { AdminGuard } from './admin.guard';
import { RegisterPaymentHandler } from '../application/register-payment/register-payment.handler';
import type { RegisterPaymentInput } from '../application/register-payment/register-payment.handler';
import { ListActiveLoansHandler } from '../application/list-active-loans/list-active-loans.handler';
import { ADMIN_ACTIVE_LOAN_QUERY } from '../application/ports/active-loan-query.port';
import type { AdminActiveLoanQuery } from '../application/ports/active-loan-query.port';
import { LoanNotFoundError } from '../domain/loan.errors';

// ponytail: Single admin controller for payment operations. Split when routes grow beyond 5 endpoints.
@Controller('api/admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminPaymentController {
  constructor(
    @Inject(RegisterPaymentHandler)
    private readonly registerHandler: RegisterPaymentHandler,
    @Inject(ListActiveLoansHandler)
    private readonly listHandler: ListActiveLoansHandler,
    @Inject(ADMIN_ACTIVE_LOAN_QUERY)
    private readonly adminQuery: AdminActiveLoanQuery,
  ) {}

  @Post('payments')
  @HttpCode(201)
  registerPayment(
    @Body(new ZodValidationPipe(RegisterPaymentSchema)) body: RegisterPaymentInput,
  ) {
    return this.registerHandler.execute(body);
  }

  @Get('loans/active')
  listActiveLoans(
    @Query(new ZodValidationPipe(AdminActiveLoanQuerySchema)) query: AdminActiveLoanQueryInput,
  ) {
    return this.listHandler.execute(query);
  }

  @Get('loans/active/:id')
  async getActiveLoanDetail(@Param('id') id: string) {
    const detail = await this.adminQuery.getDetail(id);
    if (!detail) throw new LoanNotFoundError(id);
    return detail;
  }
}
