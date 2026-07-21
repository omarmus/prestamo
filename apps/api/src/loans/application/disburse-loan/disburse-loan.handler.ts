import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { LOAN_APPLICATION_REPOSITORY, LOAN_REPOSITORY, GENERATE_CONTRACT_SERVICE } from '../../loans.tokens';
import { CUSTOMER_REPOSITORY } from '../../../customers/customers.tokens';
import type { LoanApplicationRepository } from '../../domain/loan-application.repository';
import type { LoanRepository } from '../../domain/loan.repository';
import type { CustomerRepository } from '../../../customers/domain/customer.repository';
import type { GenerateContractService } from '../generate-contract.service';
import { Loan } from '../../domain/loan.entity';
import { LoanNotFoundError, LoanNotOwnedByCustomerError } from '../../domain/loan-application.errors';
import { LoanNotDisbursableError, LoanAlreadyDisbursedError } from '../../domain/loan.errors';
import { calculateAmortization } from '../../domain/value-objects/amortization';
import { PrismaService } from '../../../shared/prisma/prisma.service';

export interface DisbursedInstallmentResponse {
  id: string;
  installmentNumber: number;
  dueDate: string;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  status: string;
}

export interface DisburseLoanResponse {
  loan: {
    id: string;
    applicationId: string;
    customerId: string;
    amount: number;
    termMonths: number;
    annualRate: number;
    monthlyPayment: number;
    totalInterest: number;
    totalPayment: number;
    outstandingBalance: number;
    status: string;
    disbursedAt: string;
  };
  installments: DisbursedInstallmentResponse[];
  transaction: {
    id: string;
    type: string;
    amount: number;
    balanceAfter: number;
    createdAt: string;
  };
}

@Injectable()
export class DisburseLoanHandler {
  private readonly logger = new Logger(DisburseLoanHandler.name);

  constructor(
    @Inject(LOAN_APPLICATION_REPOSITORY)
    private readonly appRepo: LoanApplicationRepository,
    @Inject(LOAN_REPOSITORY)
    private readonly loanRepo: LoanRepository,
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepo: CustomerRepository,
    @Inject(GENERATE_CONTRACT_SERVICE)
    private readonly contractGenerator: GenerateContractService,
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async execute(adminId: string, applicationId: string): Promise<DisburseLoanResponse> {
    // 1. Read application
    const app = await this.appRepo.findById(applicationId);
    if (!app) throw new LoanNotFoundError(applicationId);
    if (app.status !== 'APPROVED') throw new LoanNotDisbursableError(applicationId);
    if (app.reviewerId !== adminId) {
      throw new LoanNotOwnedByCustomerError('Solo el asesor asignado puede desembolsar esta solicitud');
    }

    // 2. Calculate amortization schedule
    const schedule = calculateAmortization(
      app.amount,
      app.annualRate,
      app.termMonths,
      new Date(),
    );

    // 3. Generate IDs
    const loanId = randomUUID();
    const now = new Date();
    const installments = schedule.map(row => ({
      id: randomUUID(),
      loanId,
      installmentNumber: row.installmentNumber,
      dueDate: row.dueDate,
      principalAmount: row.principalAmount,
      interestAmount: row.interestAmount,
      totalAmount: row.totalAmount,
      paidPrincipal: 0,
      paidInterest: 0,
      paidTotal: 0,
      status: 'PENDING' as const,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      paidAt: null as string | null,
    }));

    // 4. Atomic transaction
    await this.prisma.$transaction(async (tx) => {
      // 4a. Optimistic lock on application status
      const updated = await tx.loanApplication.updateMany({
        where: { id: applicationId, status: 'APPROVED' },
        data: { status: 'ACTIVE' },
      });
      if (updated.count === 0) {
        throw new LoanAlreadyDisbursedError();
      }

      // 4b. Create Loan + Installments + Transaction in one operation
      await tx.loan.create({
        data: {
          id: loanId,
          applicationId,
          customerId: app.customerId,
          amount: app.amount,
          termMonths: app.termMonths,
          annualRate: app.annualRate,
          monthlyPayment: schedule.reduce((s, r) => s + r.totalAmount, 0) / schedule.length,
          totalInterest: schedule.reduce((s, r) => s + r.interestAmount, 0),
          totalPayment: schedule.reduce((s, r) => s + r.totalAmount, 0),
          outstandingBalance: app.amount,
          status: 'ACTIVE',
          disbursedAt: now,
          installments: {
            create: installments.map(i => ({
              id: i.id,
              installmentNumber: i.installmentNumber,
              dueDate: new Date(i.dueDate),
              principalAmount: i.principalAmount,
              interestAmount: i.interestAmount,
              totalAmount: i.totalAmount,
              paidPrincipal: 0,
              paidInterest: 0,
              paidTotal: 0,
              status: 'PENDING',
            })),
          },
          transactions: {
            create: {
              id: randomUUID(),
              type: 'DISBURSEMENT',
              amount: app.amount,
              balanceAfter: app.amount,
              description: 'Desembolso inicial',
            },
          },
        },
      } as never);
    });

    // 5. Generate contract PDF (non-blocking — log and continue on failure)
    try {
      const customer = await this.customerRepo.findById(app.customerId);
      if (customer) {
        await this.contractGenerator.execute({
          loanId,
          templateType: 'loan-contract',
          data: {
            loanId,
            amount: app.amount,
            termMonths: app.termMonths,
            annualRate: app.annualRate,
            monthlyPayment: schedule.reduce((s, r) => s + r.totalAmount, 0) / schedule.length,
            totalInterest: schedule.reduce((s, r) => s + r.interestAmount, 0),
            totalPayment: schedule.reduce((s, r) => s + r.totalAmount, 0),
            disbursedAt: now,
            customer: {
              firstName: customer.firstName,
              lastName: customer.lastName,
              documentNumber: customer.documentNumber,
            },
            lender: { name: 'Prestamos S.A.' },
            installments: installments.map(inst => ({
              number: inst.installmentNumber,
              dueDate: new Date(inst.dueDate),
              principal: inst.principalAmount,
              interest: inst.interestAmount,
              total: inst.totalAmount,
            })),
          },
        });
      }
    } catch (err) {
      // ponytail: Contract generation failure shouldn't roll back the disbursement.
      // Add retry queue when generation reliability matters.
      this.logger.warn(`Contract generation failed for loan ${loanId}: ${(err as Error).message}`);
    }

    // 6. Build response
    const monthlyPayment = schedule.reduce((s, r) => s + r.totalAmount, 0) / schedule.length;
    const totalInterest = schedule.reduce((s, r) => s + r.interestAmount, 0);
    const totalPayment = schedule.reduce((s, r) => s + r.totalAmount, 0);

    return {
      loan: {
        id: loanId,
        applicationId,
        customerId: app.customerId,
        amount: app.amount,
        termMonths: app.termMonths,
        annualRate: app.annualRate,
        monthlyPayment,
        totalInterest,
        totalPayment,
        outstandingBalance: app.amount,
        status: 'ACTIVE',
        disbursedAt: now.toISOString(),
      },
      installments: installments.map(i => ({
        id: i.id,
        installmentNumber: i.installmentNumber,
        dueDate: i.dueDate,
        principalAmount: i.principalAmount,
        interestAmount: i.interestAmount,
        totalAmount: i.totalAmount,
        status: i.status,
      })),
      transaction: {
        id: randomUUID(),
        type: 'DISBURSEMENT',
        amount: app.amount,
        balanceAfter: app.amount,
        createdAt: now.toISOString(),
      },
    };
  }
}
