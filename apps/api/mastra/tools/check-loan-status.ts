import { z } from 'zod';
import { createTool } from '@mastra/core/tools';
import type { ContactRepository } from '../../src/whatsapp/domain/contact-repository.port';
import type { CustomerRepository } from '../../src/customers/domain/customer.repository';
import type { ActiveLoanQuery } from '../../src/loans/application/ports/active-loan-query.port';

const inputSchema = z.object({
  phone: z.string().describe('Número de teléfono del cliente'),
});

export function createCheckLoanStatusTool(
  contactRepository: ContactRepository,
  customerRepository: CustomerRepository,
  activeLoanQuery: ActiveLoanQuery,
) {
  return createTool({
    id: 'check-loan-status',
    description:
      'Consultar préstamos activos de un cliente por número de teléfono. Retorna los préstamos activos con saldo pendiente y próxima cuota.',
    inputSchema,
    execute: async (inputData: z.infer<typeof inputSchema>) => {
      // Resolve phone → contact → userId → customer → active loans
      const contact = await contactRepository.findByPhone(inputData.phone);
      if (!contact?.userId) {
        return { loans: [] };
      }

      const customer = await customerRepository.findByUserId(contact.userId);
      if (!customer) {
        return { loans: [] };
      }

      const loans = await activeLoanQuery.findByCustomerId(customer.id);
      return {
        loans: loans.map((l) => ({
          id: l.id,
          amount: l.amount,
          outstandingBalance: l.outstandingBalance,
          status: l.status,
          nextPayment: l.nextPaymentDate ?? undefined,
        })),
      };
    },
  });
}
