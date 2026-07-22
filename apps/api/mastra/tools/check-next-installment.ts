import { z } from 'zod';
import { createTool } from '@mastra/core/tools';
import type { InstallmentRepository } from '../../src/loans/domain/loan.repository';

const inputSchema = z.object({
  loanId: z.string().describe('ID del préstamo'),
});

export function createCheckNextInstallmentTool(
  installmentRepo: InstallmentRepository,
) {
  return createTool({
    id: 'check-next-installment',
    description:
      'Consultar la próxima cuota a pagar de un préstamo activo. Retorna el detalle de la cuota o null si no hay cuotas pendientes.',
    inputSchema,
    execute: async (inputData: z.infer<typeof inputSchema>) => {
      const next = await installmentRepo.findNextPending(inputData.loanId);
      if (!next) return null;
      return {
        installmentNumber: next.installmentNumber,
        dueDate: next.dueDate,
        totalAmount: next.totalAmount,
        status: next.status,
      };
    },
  });
}
