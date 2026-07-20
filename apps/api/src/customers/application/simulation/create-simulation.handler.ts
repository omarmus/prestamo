import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateSimulationInput } from '@prestamos/shared';
import { CUSTOMER_REPOSITORY } from '../../customers.tokens';
import type { CustomerRepository } from '../../domain/customer.repository';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { calculateLoan } from './loan-calculator';
import type { AmortizationRow } from './loan-calculator';

export interface SimulationResult {
  id: string;
  amount: number;
  termMonths: number;
  annualRate: number;
  monthlyPayment: number;
  totalInterest: number;
  totalPayment: number;
  schedule: AmortizationRow[];
  createdAt: string;
}

@Injectable()
export class CreateSimulationHandler {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: CustomerRepository,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async execute(userId: string, body: CreateSimulationInput): Promise<SimulationResult> {
    const customer = await this.customerRepository.findByUserId(userId);
    if (!customer) throw new NotFoundException('Customer not found');

    const { monthlyPayment, totalInterest, totalPayment, schedule } = calculateLoan(
      body.amount,
      body.annualRate,
      body.termMonths,
    );

    const simulation = await this.prisma.loanSimulation.create({
      data: {
        customerId: customer.id,
        amount: body.amount,
        termMonths: body.termMonths,
        annualRate: body.annualRate,
        monthlyPayment,
        schedule: JSON.parse(JSON.stringify(schedule)),
      },
    });

    return {
      id: simulation.id,
      amount: Number(simulation.amount),
      termMonths: simulation.termMonths,
      annualRate: Number(simulation.annualRate),
      monthlyPayment: simulation.monthlyPayment ? Number(simulation.monthlyPayment) : monthlyPayment,
      totalInterest,
      totalPayment,
      schedule,
      createdAt: simulation.createdAt.toISOString(),
    };
  }
}
