import { Inject, Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import type { JwtPayload } from '@prestamos/shared';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CustomerGuard } from '../../customers/presentation/customer.guard';
import { GetActiveLoansHandler } from '../application/get-active-loans/get-active-loans.handler';
import { GetActiveLoanDetailHandler } from '../application/get-active-loan-detail/get-active-loan-detail.handler';

// ponytail: Duck-typed from CustomerGuard attaching `customer`
interface RequestWithCustomer {
  user: JwtPayload;
  customer: {
    id: string;
    userId: string;
  };
}

@Controller('api/loans')
@UseGuards(JwtAuthGuard, CustomerGuard)
export class ActiveLoanController {
  constructor(
    @Inject(GetActiveLoansHandler)
    private readonly listHandler: GetActiveLoansHandler,
    @Inject(GetActiveLoanDetailHandler)
    private readonly detailHandler: GetActiveLoanDetailHandler,
  ) {}

  @Get()
  async list(@Req() req: RequestWithCustomer) {
    const loans = await this.listHandler.execute(req.customer.id);
    return { data: loans };
  }

  @Get(':id')
  getDetail(@Req() req: RequestWithCustomer, @Param('id') id: string) {
    return this.detailHandler.execute(req.customer.id, id);
  }
}
