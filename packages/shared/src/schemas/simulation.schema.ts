import { z } from 'zod';

export const PublicSimulateSchema = z.object({
  amount: z.number().min(100).max(500000),
  termMonths: z.number().int().min(3).max(120),
  annualRate: z.number().min(5).max(36),
});

export type SimulateLoanInput = z.infer<typeof PublicSimulateSchema>;
