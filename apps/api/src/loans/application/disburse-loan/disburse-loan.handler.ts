import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { LOAN_APPLICATION_REPOSITORY, LOAN_REPOSITORY } from '../../loans.tokens';
import type { LoanApplicationRepository } from '../../domain/loan-application.repository';
import type { LoanRepository } from '../../domain/loan.repository';
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
  constructor(
    @Inject(LOAN_APPLICATION_REPOSITORY)
    private readonly appRepo: LoanApplicationRepository,
    @Inject(LOAN_REPOSITORY)
    private readonly loanRepo: LoanRepository,
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

    // 5. Build response
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
