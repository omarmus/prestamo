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
import type { JwtPayload } from '@prestamos/shared';

import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
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
    @CurrentUser() _user: JwtPayload,
    @Req() req: RequestWithCustomer,
    @Body(new ZodValidationPipe(CreateLoanApplicationSchema)) body: CreateLoanApplicationInput,
  ) {
    return this.createHandler.execute(req.customer as never, body);
  }

  @Get()
  async list(@CurrentUser() user: JwtPayload) {
    const applications = await this.listHandler.execute(user.sub);
    return { data: applications };
  }

  @Get(':id')
  get(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.getHandler.execute(user.sub, id);
  }

  @Delete(':id')
  cancel(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.cancelHandler.execute(user.sub, id);
  }
}
