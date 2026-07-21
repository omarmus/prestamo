import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { LOAN_REPOSITORY, INSTALLMENT_REPOSITORY } from '../../loans.tokens';
import type { LoanRepository } from '../../domain/loan.repository';
import type { InstallmentRepository } from '../../domain/loan.repository';
import {
  LoanNotFoundError,
  LoanAlreadyPaidError,
  InvalidPaymentAmountError,
  PartialPaymentNotSupportedError,
  NoPendingInstallmentsError,
} from '../../domain/loan.errors';
import { PrismaService } from '../../../shared/prisma/prisma.service';

export interface RegisterPaymentInput {
  loanId: string;
  amount: number;
  method: 'CASH' | 'TRANSFER';
  reference?: string;
  notes?: string;
}

export interface RegisterPaymentResponse {
  transaction: {
    id: string;
    loanId: string;
    type: 'PAYMENT';
    amount: number;
    balanceAfter: number;
    createdAt: string;
  };
  installmentsPaid: Array<{
    id: string;
    number: number;
    status: 'PAID';
    paidAt: string;
  }>;
  loanStatus: 'ACTIVE' | 'CLOSED';
  outstandingBalance: number;
}

@Injectable()
export class RegisterPaymentHandler {
  constructor(
    @Inject(LOAN_REPOSITORY)
    private readonly loanRepo: LoanRepository,
    @Inject(INSTALLMENT_REPOSITORY)
    private readonly installmentRepo: InstallmentRepository,
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async execute(input: RegisterPaymentInput): Promise<RegisterPaymentResponse> {
    // 1. Validate amount > 0
    if (input.amount <= 0) {
      throw new InvalidPaymentAmountError();
    }

    // 2. Get loan
    const loan = await this.loanRepo.findById(input.loanId);
    if (!loan) {
      throw new LoanNotFoundError(input.loanId);
    }
    if (loan.status !== 'ACTIVE') {
      throw new LoanAlreadyPaidError();
    }

    // 3. Get all installments, filter pending/overdue FIFO
    const allInstallments = await this.installmentRepo.findByLoanId(loan.id);
    const pending = allInstallments.filter(
      (i) => i.status === 'PENDING' || i.status === 'OVERDUE',
    );
    if (pending.length === 0) {
      throw new NoPendingInstallmentsError();
    }

    // 4. FIFO: consume as many installments as the amount covers
    let remaining = input.amount;
    const paidList: Array<{
      id: string;
      number: number;
      totalAmount: number;
      principalAmount: number;
      interestAmount: number;
    }> = [];

    for (const inst of pending) {
      if (remaining < inst.totalAmount) {
        throw new PartialPaymentNotSupportedError(input.amount, inst.totalAmount);
      }

      remaining -= inst.totalAmount;
      paidList.push({
        id: inst.id,
        number: inst.installmentNumber,
        totalAmount: inst.totalAmount,
        principalAmount: inst.principalAmount,
        interestAmount: inst.interestAmount,
      });

      // ponytail: excess amount after paying all pending installments is ignored
      if (remaining <= 0) break;
    }

    const totalPrincipalPaid = paidList.reduce((s, i) => s + i.principalAmount, 0);
    const newBalance = Math.round((loan.outstandingBalance - totalPrincipalPaid) * 100) / 100;
    const allNowPaid = paidList.length === pending.length;
    const now = new Date();
    const txId = randomUUID();

    // 5. Atomic transaction
    await this.prisma.$transaction(async (tx: Record<string, unknown>) => {
      const txClient = tx as {
        installment: {
          update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<unknown>;
          findFirst: (args: {
            where: Record<string, unknown>;
            orderBy: Record<string, string>;
          }) => Promise<{ dueDate: Date } | null>;
        };
        loanTransaction: {
          create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
        };
        loan: {
          update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<unknown>;
        };
      };

      // 5a. Mark installments as paid
      for (const inst of paidList) {
        await txClient.installment.update({
          where: { id: inst.id },
          data: {
            status: 'PAID',
            paidAt: now,
            paidPrincipal: inst.principalAmount,
            paidInterest: inst.interestAmount,
            paidTotal: inst.totalAmount,
          },
        });
      }

      // 5b. Create payment transaction
      await txClient.loanTransaction.create({
        data: {
          id: txId,
          loanId: loan.id,
          type: 'PAYMENT',
          amount: input.amount,
          balanceAfter: newBalance,
          description: input.notes
            ? `Pago via ${input.method}. ${input.notes}`
            : `Pago via ${input.method}`,
          reference: input.reference ?? null,
        },
      });

      // 5c. Update loan
      if (allNowPaid) {
        await txClient.loan.update({
          where: { id: loan.id },
          data: {
            outstandingBalance: 0,
            status: 'CLOSED',
            closedAt: now,
            nextPaymentDate: null,
          },
        });
      } else {
        const nextInst = await txClient.installment.findFirst({
          where: { loanId: loan.id, status: { in: ['PENDING', 'OVERDUE'] } },
          orderBy: { installmentNumber: 'asc' },
        });
        await txClient.loan.update({
          where: { id: loan.id },
          data: {
            outstandingBalance: newBalance,
            nextPaymentDate: nextInst?.dueDate ?? null,
          },
        });
      }
    });

    return {
      transaction: {
        id: txId,
        loanId: loan.id,
        type: 'PAYMENT',
        amount: input.amount,
        balanceAfter: newBalance,
        createdAt: now.toISOString(),
      },
      installmentsPaid: paidList.map((i) => ({
        id: i.id,
        number: i.number,
        status: 'PAID' as const,
        paidAt: now.toISOString(),
      })),
      loanStatus: allNowPaid ? 'CLOSED' : 'ACTIVE',
      outstandingBalance: allNowPaid ? 0 : newBalance,
    };
  }
}
