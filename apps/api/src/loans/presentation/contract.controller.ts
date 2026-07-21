import {
  Inject,
  Controller,
  Get,
  Param,
  Req,
  Res,
  UseGuards,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import type { JwtPayload } from '@prestamos/shared';
import type { Customer } from '../../customers/domain/customer.entity';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CustomerGuard } from '../../customers/presentation/customer.guard';
import { AdminGuard } from '../../shared/guards/admin.guard';
import {
  GENERATED_DOCUMENT_REPOSITORY,
  CONTRACT_STORAGE_SERVICE,
} from '../loans.tokens';
import { ACTIVE_LOAN_QUERY } from '../application/ports/active-loan-query.port';
import type { GeneratedDocumentRepository } from '../domain/generated-document.repository';
import type { ContractStorageService } from '../infrastructure/storage/contract-storage.service';
import type { ActiveLoanQuery } from '../application/ports/active-loan-query.port';

// ponytail: Duck-typed to match CustomerGuard's request.customer shape
interface RequestWithCustomer {
  user: JwtPayload;
  customer: Customer;
}

@Controller()
export class ContractController {
  constructor(
    @Inject(GENERATED_DOCUMENT_REPOSITORY)
    private readonly docRepo: GeneratedDocumentRepository,
    @Inject(CONTRACT_STORAGE_SERVICE)
    private readonly storage: ContractStorageService,
    @Inject(ACTIVE_LOAN_QUERY)
    private readonly activeLoanQuery: ActiveLoanQuery,
  ) {}

  @Get('api/loans/:loanId/contract')
  @UseGuards(JwtAuthGuard, CustomerGuard)
  async downloadPortal(
    @Param('loanId') loanId: string,
    @Req() req: RequestWithCustomer,
    @Res({ passthrough: true }) res: any,
  ): Promise<StreamableFile> {
    // Verify the loan belongs to the authenticated customer
    const loan = await this.activeLoanQuery.findByIdAndCustomer(req.customer.id, loanId);
    if (!loan) throw new NotFoundException('Préstamo no encontrado');

    const doc = await this.docRepo.findByLoanId(loanId);
    if (!doc) throw new NotFoundException('Contrato no encontrado');

    const buffer = await this.storage.get(doc.filePath);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="contrato-${loanId}.pdf"`,
      'Content-Length': buffer.length.toString(),
    });
    return new StreamableFile(buffer);
  }

  @Get('api/admin/loans/:loanId/contract')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async downloadAdmin(
    @Param('loanId') loanId: string,
    @Res({ passthrough: true }) res: any,
  ): Promise<StreamableFile> {
    const doc = await this.docRepo.findByLoanId(loanId);
    if (!doc) throw new NotFoundException('Contrato no encontrado');

    const buffer = await this.storage.get(doc.filePath);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="contrato-${loanId}.pdf"`,
      'Content-Length': buffer.length.toString(),
    });
    return new StreamableFile(buffer);
  }
}
