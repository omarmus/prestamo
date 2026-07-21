import {
  Inject,
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';

import type {
  AdminListQuery,
  ReviewLoanApplicationInput,
} from '@prestamos/shared';
import {
  AdminListQuerySchema,
  ReviewApplicationSchema,
} from '@prestamos/shared';
import type { JwtPayload } from '@prestamos/shared';

import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe';
import { AdminGuard } from './admin.guard';

import { ReviewApplicationHandler } from '../application/review-application/review-application.handler';
import { ListPendingApplicationsHandler } from '../application/list-pending-applications/list-pending-applications.handler';
import { ADMIN_QUERY } from '../application/ports/admin-query.port';
import type { AdminQuery } from '../application/ports/admin-query.port';
import { LoanNotFoundError } from '../domain/loan-application.errors';

@Controller('api/admin/loans/applications')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminLoanApplicationController {
  constructor(
    @Inject(ListPendingApplicationsHandler)
    private readonly listPendingHandler: ListPendingApplicationsHandler,
    @Inject(ReviewApplicationHandler)
    private readonly reviewHandler: ReviewApplicationHandler,
    @Inject(ADMIN_QUERY)
    private readonly adminQuery: AdminQuery,
  ) {}

  @Get()
  listPending(
    @Query(new ZodValidationPipe(AdminListQuerySchema)) query: AdminListQuery,
  ) {
    return this.listPendingHandler.execute(query);
  }

  @Get(':id')
  async getDetail(@Param('id') id: string) {
    const detail = await this.adminQuery.getApplicationDetail(id);
    if (!detail) throw new LoanNotFoundError(id);
    return detail;
  }

  @Post(':id/review')
  assignAndReview(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.reviewHandler.execute(user.sub, id, 'review', {});
  }

  @Post(':id/approve')
  approve(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ReviewApplicationSchema)) body: ReviewLoanApplicationInput,
  ) {
    return this.reviewHandler.execute(user.sub, id, 'approve', body);
  }

  @Post(':id/reject')
  reject(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ReviewApplicationSchema.required({ reason: true }))) body: { reason: string },
  ) {
    return this.reviewHandler.execute(user.sub, id, 'reject', body);
  }

  @Post(':id/request-info')
  requestInfo(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ReviewApplicationSchema.required({ message: true }))) body: { message: string },
  ) {
    return this.reviewHandler.execute(user.sub, id, 'request-info', body);
  }
}
