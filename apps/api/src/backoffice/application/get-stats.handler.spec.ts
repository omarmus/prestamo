import { GetStatsHandler } from './get-stats.handler';
import { STATS_QUERY } from './ports/stats-query.port';
import type { StatsQuery } from './ports/stats-query.port';
import type { AdminStatsResponse } from '@prestamos/shared';

describe('GetStatsHandler', () => {
  let handler: GetStatsHandler;
  let mockQuery: jest.Mocked<StatsQuery>;

  beforeEach(() => {
    mockQuery = {
      getStats: jest.fn(),
    };
    handler = new GetStatsHandler(mockQuery);
  });

  describe('scenario: stats are queried', () => {
    it('returns mapped stats response', async () => {
      const expected: AdminStatsResponse = {
        totalApplications: 100,
        pendingApplications: 25,
        totalLoans: 80,
        activeLoans: 60,
        totalDisbursed: 500000,
        totalCustomers: 200,
      };
      mockQuery.getStats.mockResolvedValue(expected);

      const result = await handler.execute();

      expect(result).toEqual(expected);
      expect(mockQuery.getStats).toHaveBeenCalledTimes(1);
    });
  });
});
