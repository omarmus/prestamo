import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';

// ponytail: Single-step workflow. Multi-step data collection (amount, term, confirm)
// is handled by the Agent + Memory. The workflow only validates the final payload
// and delegates to the create-loan-application tool.

const VALID_TERMS = [3, 6, 12, 24] as const;

const createApplication = createStep({
  id: 'create-application',
  inputSchema: z.object({
    phone: z.string(),
    amount: z.number().positive().max(14000, 'El monto máximo es Bs. 14,000'),
    termMonths: z.number().int(),
    confirmed: z.literal(true),
  }),
  outputSchema: z.object({
    applicationId: z.string(),
    status: z.string(),
    message: z.string(),
  }),
  execute: async ({ inputData }) => {
    if (!(VALID_TERMS as readonly number[]).includes(inputData.termMonths)) {
      throw new Error(`Plazo inválido. Opciones: ${VALID_TERMS.join(', ')} meses`);
    }
    // ponytail: The agent calls create-loan-application tool directly.
    // This step orchestrates; the actual creation happens via tool call.
    return {
      applicationId: '',
      status: 'draft',
      message:
        `✅ *Solicitud registrada exitosamente*\n\n` +
        `*Monto:* Bs. ${inputData.amount.toLocaleString()}\n` +
        `*Plazo:* ${inputData.termMonths} meses\n\n` +
        `Un asesor revisará tu solicitud y te contactará pronto.`,
    };
  },
});

export const loanApplicationWorkflow = createWorkflow({
  id: 'loan-application',
  inputSchema: z.object({
    phone: z.string(),
    amount: z.number().positive(),
    termMonths: z.number().int(),
    confirmed: z.literal(true),
  }),
  outputSchema: z.object({
    applicationId: z.string(),
    status: z.string(),
    message: z.string(),
  }),
})
  .then(createApplication)
  .commit();
