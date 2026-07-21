import {
  Inject,
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
} from '@nestjs/common';

import type { CreateLoanApplicationInput } from '@prestamos/shared';
import { CreateLoanApplicationSchema } from '@prestamos/shared';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe';
import { CustomerGuard } from '../../customers/presentation/customer.guard';

import { CreateApplicationHandler } from '../application/create-application/create-application.handler';
import { ListApplicationsHandler } from '../application/get-applications/get-applications.handler';
import { GetApplicationHandler } from '../application/get-application/get-application.handler';
import { CancelApplicationHandler } from '../application/cancel-application/cancel-application.handler';

// ponytail: RequestWithCustomer is duck-typed from CustomerGuard attaching `customer`
interface RequestWithCustomer {
  customer: {
    id: string;
    userId: string;
    firstName: string;
    lastName: string | null;
    monthlyIncome: number | null;
  };
}

@Controller('api/loans/applications')
@UseGuards(JwtAuthGuard, CustomerGuard)
export class LoanApplicationController {
  constructor(
    @Inject(CreateApplicationHandler)
    private readonly createHandler: CreateApplicationHandler,
    @Inject(ListApplicationsHandler)
    private readonly listHandler: ListApplicationsHandler,
    @Inject(GetApplicationHandler)
    private readonly getHandler: GetApplicationHandler,
    @Inject(CancelApplicationHandler)
    private readonly cancelHandler: CancelApplicationHandler,
  ) {}

  @Post()
  @HttpCode(201)
  create(
    @Req() req: RequestWithCustomer,
    @Body(new ZodValidationPipe(CreateLoanApplicationSchema)) body: CreateLoanApplicationInput,
  ) {
    return this.createHandler.execute(req.customer as never, body);
  }

  @Get()
  async list(@Req() req: RequestWithCustomer) {
    const applications = await this.listHandler.execute(req.customer.id);
    return { data: applications };
  }

  @Get(':id')
  get(
    @Req() req: RequestWithCustomer,
    @Param('id') id: string,
  ) {
    return this.getHandler.execute(req.customer.id, id);
  }

  @Delete(':id')
  cancel(
    @Req() req: RequestWithCustomer,
    @Param('id') id: string,
  ) {
    return this.cancelHandler.execute(req.customer.id, id);
  }
}
