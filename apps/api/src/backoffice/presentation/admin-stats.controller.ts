import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { AdminGuard } from '../../shared/guards/admin.guard';
import { GetStatsHandler } from '../application/get-stats.handler';

@Controller('api/admin/stats')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminStatsController {
  constructor(
    @Inject(GetStatsHandler) private readonly handler: GetStatsHandler,
  ) {}

  @Get()
  getStats() {
    return this.handler.execute();
  }
}
