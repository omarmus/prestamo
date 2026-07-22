import type { AdminStatsResponse } from '@prestamos/shared';

export const STATS_QUERY = Symbol('STATS_QUERY');

export interface StatsQuery {
  getStats(): Promise<AdminStatsResponse>;
}
