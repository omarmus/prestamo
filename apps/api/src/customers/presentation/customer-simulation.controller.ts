import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Inject,
  NotFoundException,
  HttpCode,
} from '@nestjs/common';
import { CreateSimulationSchema } from '@prestamos/shared';

import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe';
import { CUSTOMER_REPOSITORY } from '../customers.tokens';
import type { CustomerRepository } from '../domain/customer.repository';
import { PrismaService } from '../../shared/prisma/prisma.service';
import type { JwtPayload } from '@prestamos/shared';
import { calculateLoan } from '../application/simulation/loan-calculator';
import type { AmortizationRow } from '../application/simulation/loan-calculator';

interface SimulationResult {
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

@Controller('api/customers/me/simulations')
@UseGuards(JwtAuthGuard)
export class CustomerSimulationController {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: CustomerRepository,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async listSimulations(@CurrentUser() user: JwtPayload) {
    const customer = await this.customerRepository.findByUserId(user.sub);
    if (!customer) throw new NotFoundException('Customer not found');

    return this.prisma.loanSimulation.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post()
  @HttpCode(201)
  async createSimulation(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(CreateSimulationSchema)) body: Record<string, unknown>,
  ): Promise<SimulationResult> {
    const customer = await this.customerRepository.findByUserId(user.sub);
    if (!customer) throw new NotFoundException('Customer not found');

    const amount = body.amount as number;
    const annualRate = body.annualRate as number;
    const termMonths = body.termMonths as number;

    const { monthlyPayment, totalInterest, totalPayment, schedule } = calculateLoan(
      amount,
      annualRate,
      termMonths,
    );

    const simulation = await this.prisma.loanSimulation.create({
      data: {
        customerId: customer.id,
        amount,
        termMonths,
        annualRate,
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
