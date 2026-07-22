import { z } from 'zod';
import { createTool } from '@mastra/core/tools';
import type { ApplyLoanHandler } from '../../src/whatsapp/application/apply-loan.handler';

const inputSchema = z.object({
  phone: z.string().describe('Número de teléfono del cliente'),
  amount: z.number().positive().describe('Monto del préstamo'),
  termMonths: z
    .number()
    .int()
    .min(1)
    .max(120)
    .describe('Plazo en meses (1-120)'),
  purpose: z
    .string()
    .min(2)
    .describe('Propósito del préstamo'),
});

export function createCreateLoanApplicationTool(
  applyLoanHandler: ApplyLoanHandler,
) {
  return createTool({
    id: 'create-loan-application',
    description:
      'Crear una nueva solicitud de préstamo para un cliente. Requiere: teléfono, monto, plazo en meses y propósito.',
    inputSchema,
    execute: async (inputData: z.infer<typeof inputSchema>) => {
      const result = await applyLoanHandler.execute(inputData.phone, {
        amount: inputData.amount,
        termMonths: inputData.termMonths,
        purpose: inputData.purpose,
      });
      return {
        applicationId: result.applicationId,
        status: result.status,
      };
    },
  });
}
