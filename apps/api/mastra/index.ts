import { Mastra } from '@mastra/core';
import { PinoLogger } from '@mastra/loggers';
import { Memory } from '@mastra/memory';
import { LibSQLStore, LibSQLVector } from '@mastra/libsql';
import type { Tool } from '@mastra/core/tools';
import type { CompleteRegistrationHandler } from '../src/whatsapp/application/complete-registration.handler';
import type { ApplyLoanHandler } from '../src/whatsapp/application/apply-loan.handler';
import type { ContactRepository } from '../src/whatsapp/domain/contact-repository.port';
import type { UserRepository } from '../src/identity/domain/user.repository';
import type { CustomerRepository } from '../src/customers/domain/customer.repository';
import type { ActiveLoanQuery } from '../src/loans/application/ports/active-loan-query.port';
import type { InstallmentRepository } from '../src/loans/domain/loan.repository';
import { createCustomerSupportAgent } from './agents/customer-support';
import { createRegisterCustomerTool } from './tools/register-customer';
import { createGetCustomerByPhoneTool } from './tools/get-customer-by-phone';
import { createCheckLoanApplicationTool } from './tools/check-loan-application';
import { createCheckLoanStatusTool } from './tools/check-loan-status';
import { createCheckNextInstallmentTool } from './tools/check-next-installment';
import { createCreateLoanApplicationTool } from './tools/create-loan-application';
import { createSimulateLoanTool } from './tools/simulate-loan';
import { customerRegistrationWorkflow } from './workflows/customer-registration';
import { loanApplicationWorkflow } from './workflows/loan-application';

interface LoanDraft {
  id: string;
  amount: number;
  status: string;
  createdAt: Date;
}

export interface MastraDependencies {
  completeRegistrationHandler: CompleteRegistrationHandler;
  contactRepository: ContactRepository;
  userRepository: UserRepository;
  queryLoanDraftByPhone: (phone: string) => Promise<LoanDraft | null>;
  customerRepository: CustomerRepository;
  activeLoanQuery: ActiveLoanQuery;
  installmentRepository: InstallmentRepository;
  applyLoanHandler: ApplyLoanHandler;
}

export function createMastra(deps: MastraDependencies): Mastra {
  const memoryDbUrl = process.env.MEMORY_DB_URL || 'file:./data/memory.db';

  // ponytail: LibSQL-backed memory for session persistence. ThreadId = phone.
  // Semantic recall requires an embedder (e.g. openai/text-embedding-3-small) and API key.
  // Disabled for MVP — lastMessages: 20 + working memory covers single-session conversations.
  const memory = new Memory({
    storage: new LibSQLStore({ id: 'whatsapp', url: memoryDbUrl }),
    vector: new LibSQLVector({ id: 'whatsapp', url: memoryDbUrl }),
    options: {
      lastMessages: 20,
      semanticRecall: false,
      workingMemory: {
        enabled: true,
        template: `# Perfil del Cliente

## Datos Personales
- Nombre:
- Teléfono:
- Email:
- ¿Registrado?: No

## Sesión Actual
- Intento:
- Paso del flujo:
- Datos recolectados:
  - Monto solicitado:
  - Plazo (meses):
  - Propósito:

## Préstamo Activo
- ¿Tiene préstamo activo?:
- Monto:
- Próxima cuota:
- Fecha vencimiento:

## Notas
-`,
      },
    },
  });

  const tools: Record<string, Tool> = {
    'register-customer': createRegisterCustomerTool(
      deps.completeRegistrationHandler,
    ) as unknown as Tool,
    'get-customer-by-phone': createGetCustomerByPhoneTool(
      deps.contactRepository,
      deps.userRepository,
    ) as unknown as Tool,
    'check-loan-application': createCheckLoanApplicationTool(
      deps.queryLoanDraftByPhone,
    ) as unknown as Tool,
    'check-loan-status': createCheckLoanStatusTool(
      deps.contactRepository,
      deps.customerRepository,
      deps.activeLoanQuery,
    ) as unknown as Tool,
    'check-next-installment': createCheckNextInstallmentTool(
      deps.installmentRepository,
    ) as unknown as Tool,
    'create-loan-application': createCreateLoanApplicationTool(
      deps.applyLoanHandler,
    ) as unknown as Tool,
    'simulate-loan': createSimulateLoanTool() as unknown as Tool,
  };

  const model = `openai/${process.env.MASTRA_MODEL || 'gpt-4o-mini'}`;

  const agent = createCustomerSupportAgent({
    model,
    // ponytail: Tools have specific input types; agent expects Record<string, Tool<unknown>>
    //          cast is safe because the agent only passes already-validated data to execute
    tools,
    memory,
  });

  return new Mastra({
    agents: { customerSupport: agent },
    workflows: { customerRegistration: customerRegistrationWorkflow, loanApplication: loanApplicationWorkflow },
    logger: new PinoLogger({ name: 'Mastra', level: 'info' }),
  });
}
