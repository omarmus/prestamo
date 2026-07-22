import { Injectable, Inject } from '@nestjs/common';
import { STATS_QUERY } from './ports/stats-query.port';
import type { StatsQuery } from './ports/stats-query.port';
import type { AdminStatsResponse } from '@prestamos/shared';

@Injectable()
export class GetStatsHandler {
  constructor(
    @Inject(STATS_QUERY) private readonly statsQuery: StatsQuery,
  ) {}

  async execute(): Promise<AdminStatsResponse> {
    return this.statsQuery.getStats();
  }
}
