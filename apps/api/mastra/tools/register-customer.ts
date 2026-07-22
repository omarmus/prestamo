import { z } from 'zod';
import { createTool } from '@mastra/core/tools';
import type { CompleteRegistrationHandler } from '../../src/whatsapp/application/complete-registration.handler';

const inputSchema = z.object({
  phone: z.string().describe('Número de teléfono del cliente'),
  name: z.string().describe('Nombre completo del cliente'),
  documentNumber: z.string().describe('Número de cédula de identidad del cliente'),
  email: z.string().optional().describe('Email del cliente (opcional)'),
});

export function createRegisterCustomerTool(
  handler: CompleteRegistrationHandler,
) {
  return createTool({
    id: 'register-customer',
    description:
      'Registrar un nuevo cliente en el sistema. Requiere: nombre, teléfono, número de cédula de identidad, email (opcional)',
    inputSchema,
    execute: async (inputData: z.infer<typeof inputSchema>) => {
      const userId = await handler.execute(inputData.phone, inputData.name, inputData.documentNumber, inputData.email);
      return { userId, success: true as const };
    },
  });
}
