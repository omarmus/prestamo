import { z } from 'zod';
import { createTool } from '@mastra/core/tools';
import type { ContactRepository } from '../../src/whatsapp/domain/contact-repository.port';
import type { UserRepository } from '../../src/identity/domain/user.repository';
import { Phone } from '../../src/identity/domain/phone.value-object';

const inputSchema = z.object({
  phone: z.string().describe('Número de teléfono del cliente'),
});

export function createGetCustomerByPhoneTool(
  contactRepository: ContactRepository,
  userRepository: UserRepository,
) {
  return createTool({
    id: 'get-customer-by-phone',
    description:
      'Buscar un cliente por número de teléfono. Retorna si existe y si está registrado en el sistema.',
    inputSchema,
    execute: async (inputData: z.infer<typeof inputSchema>) => {
      const contact = await contactRepository.findByPhone(inputData.phone);

      if (!contact) {
        return { found: false, isRegistered: false };
      }

      let email: string | undefined;
      let isRegistered = false;

      if (contact.userId) {
        try {
          const phone = Phone.create(inputData.phone);
          const user = await userRepository.findByPhone(phone);
          if (user) {
            isRegistered = true;
            email = user.email?.getValue();
          }
        } catch {
          // phone invalid or user not found — not registered
        }
      }

      return {
        found: true,
        name: contact.name ?? undefined,
        email,
        isRegistered,
      };
    },
  });
}
