import { z } from 'zod';
import { createTool } from '@mastra/core/tools';

const inputSchema = z.object({
  amount: z.number().positive().describe('Monto del préstamo'),
  termMonths: z
    .number()
    .int()
    .min(1)
    .max(120)
    .describe('Plazo en meses (1-120)'),
  annualRate: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe('Tasa de interés anual (opcional, default: 18%)'),
});

/**
 * French amortization formula — monthly payment.
 */
function calculateMonthlyPayment(
  principal: number,
  monthlyRate: number,
  months: number,
): number {
  if (monthlyRate === 0) return principal / months;
  const factor = Math.pow(1 + monthlyRate, months);
  return (principal * monthlyRate * factor) / (factor - 1);
}

export function createSimulateLoanTool() {
  return createTool({
    id: 'simulate-loan',
    description:
      'Simular un préstamo y calcular la cuota mensual. Retorna cuota mensual, total a pagar e intereses totales.',
    inputSchema,
    execute: async (inputData: z.infer<typeof inputSchema>) => {
      const annualRate =
        inputData.annualRate ??
        (process.env.DEFAULT_LOAN_RATE ? Number(process.env.DEFAULT_LOAN_RATE) : 0.18);
      const monthlyRate = annualRate / 12;
      const monthlyPayment = Math.round(
        calculateMonthlyPayment(inputData.amount, monthlyRate, inputData.termMonths) * 100,
      ) / 100;
      const totalPayment =
        Math.round(monthlyPayment * inputData.termMonths * 100) / 100;
      const totalInterest =
        Math.round((totalPayment - inputData.amount) * 100) / 100;

      return {
        monthlyPayment,
        totalPayment,
        totalInterest,
      };
    },
  });
}
