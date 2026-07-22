import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';

// ponytail: Single-step workflow. Multi-step data collection is handled by the
// Agent + Memory, not by workflow steps. The workflow only orchestrates backend
// execution after the agent has collected all necessary data.

const registerCustomer = createStep({
  id: 'register-customer',
  inputSchema: z.object({
    name: z.string(),
    phone: z.string(),
    documentNumber: z.string(),
    email: z.string().optional(),
  }),
  outputSchema: z.object({
    userId: z.string(),
    success: z.literal(true),
    message: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    // The agent calls the register-customer tool directly.
    // This workflow step is an orchestration placeholder.
    return {
      userId: '',
      success: true as const,
      message: `✅ *Registro exitoso*\n\n` +
        `Bienvenido, ${inputData.name}.\n\n` +
        `Tu registro ha sido completado correctamente.\n\n` +
        `*Opciones:*\n` +
        `1️⃣ Solicitar un préstamo\n` +
        `2️⃣ Consultar estado de mi solicitud\n` +
        `3️⃣ Consultar próximo pago\n` +
        `4️⃣ Hablar con un asesor`,
    };
  },
});

export const customerRegistrationWorkflow = createWorkflow({
  id: 'customer-registration',
  inputSchema: z.object({
    name: z.string().min(1),
    phone: z.string(),
    documentNumber: z.string(),
    email: z.string().optional(),
  }),
  outputSchema: z.object({
    userId: z.string(),
    success: z.literal(true),
    message: z.string(),
  }),
})
  .then(registerCustomer)
  .commit();
