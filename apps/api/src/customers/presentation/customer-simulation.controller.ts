import {Inject, Controller, Get, Post, Body, UseGuards, HttpCode} from '@nestjs/common';
import type { CreateSimulationInput } from '@prestamos/shared';
import { CreateSimulationSchema } from '@prestamos/shared';

import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe';
import type { JwtPayload } from '@prestamos/shared';

import { ListSimulationsHandler } from '../application/simulation/list-simulations.handler';
import { CreateSimulationHandler } from '../application/simulation/create-simulation.handler';

@Controller('api/customers/me/simulations')
@UseGuards(JwtAuthGuard)
export class CustomerSimulationController {
  constructor(
    @Inject(ListSimulationsHandler)
    private readonly listSimulationsHandler: ListSimulationsHandler,
    @Inject(CreateSimulationHandler)
    private readonly createSimulationHandler: CreateSimulationHandler,
  ) {}

  @Get()
  listSimulations(@CurrentUser() user: JwtPayload) {
    return this.listSimulationsHandler.execute(user.sub);
  }

  @Post()
  @HttpCode(201)
  createSimulation(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(CreateSimulationSchema)) body: CreateSimulationInput,
  ) {
    return this.createSimulationHandler.execute(user.sub, body);
  }
}
