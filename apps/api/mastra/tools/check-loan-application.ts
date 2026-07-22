import { z } from 'zod';
import { createTool } from '@mastra/core/tools';

interface LoanDraft {
  id: string;
  amount: number;
  status: string;
  createdAt: Date;
}

const inputSchema = z.object({
  phone: z.string().describe('Número de teléfono del cliente'),
});

// ponytail: Query callback avoids importing deleted domain types.
// The callback is injected via the DI bridge in createMastra().
export function createCheckLoanApplicationTool(
  queryByPhone: (phone: string) => Promise<LoanDraft | null>,
) {
  return createTool({
    id: 'check-loan-application',
    description:
      'Buscar solicitudes de préstamo activas por número de teléfono. Retorna las solicitudes encontradas con su estado actual.',
    inputSchema,
    execute: async (inputData: z.infer<typeof inputSchema>) => {
      const app = await queryByPhone(inputData.phone);
      if (!app) return { applications: [] };
      return {
        applications: [
          {
            id: app.id,
            amount: app.amount,
            status: app.status,
            createdAt: app.createdAt.toISOString(),
          },
        ],
      };
    },
  });
}
