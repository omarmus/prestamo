import {
  Controller,
  Get,
  Param,
  Query,
  Inject,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { AdminGuard } from '../../shared/guards/admin.guard';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe';
import { AdminCustomerListQuerySchema } from '@prestamos/shared';
import type { AdminCustomerListQuery } from '@prestamos/shared';
import { GetCustomersHandler } from '../application/get-customers.handler';
import { GetCustomerDetailHandler } from '../application/get-customer-detail.handler';

@Controller('api/admin/customers')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminCustomerController {
  constructor(
    @Inject(GetCustomersHandler)
    private readonly listHandler: GetCustomersHandler,
    @Inject(GetCustomerDetailHandler)
    private readonly detailHandler: GetCustomerDetailHandler,
  ) {}

  @Get()
  list(
    @Query(new ZodValidationPipe(AdminCustomerListQuerySchema))
    query: AdminCustomerListQuery,
  ) {
    return this.listHandler.execute(query);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.detailHandler.execute(id);
  }
}
