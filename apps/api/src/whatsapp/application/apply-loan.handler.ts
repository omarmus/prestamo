import { Inject, Injectable } from '@nestjs/common';

import type { LoanApplicationRepository } from '../domain/loan-application-repository.port';
import { LoanApplication } from '../domain/loan-application.entity';
import type { ContactRepository } from '../domain/contact-repository.port';
import { LOAN_APPLICATION_REPOSITORY, CONTACT_REPOSITORY } from '../whatsapp.tokens';
import type { ChatbotSessionData } from '../domain/chatbot-session.entity';

export interface ApplyLoanResult {
  applicationId: string;
  status: string;
  message: string;
}

@Injectable()
export class ApplyLoanHandler {
  constructor(
    @Inject(LOAN_APPLICATION_REPOSITORY) private readonly loanRepo: LoanApplicationRepository,
    @Inject(CONTACT_REPOSITORY) private readonly contactRepo: ContactRepository,
  ) {}

  async execute(phone: string, data: ChatbotSessionData): Promise<ApplyLoanResult> {
    const amount = data.amount ?? 0;
    const termMonths = data.termMonths ?? 0;
    const purpose = data.purpose ?? '';

    const application = LoanApplication.create({
      phone,
      amount,
      termMonths,
      purpose,
      status: 'draft',
    });

    // Link user if contact has one
    const contact = await this.contactRepo.findByPhone(phone);
    if (contact?.userId) {
      application.linkUser(contact.userId);
    }

    await this.loanRepo.save(application);

    return {
      applicationId: application.id,
      status: 'draft',
      message:
        `✅ *Solicitud registrada exitosamente*\n\n` +
        `*Monto:* Bs. ${amount}\n` +
        `*Plazo:* ${termMonths} meses\n` +
        `*Propósito:* ${purpose}\n` +
        `*Estado:* Recibida — un asesor revisará tu solicitud y te contactará pronto.\n\n` +
        `Guarda tu ID de solicitud: \`${application.id.slice(0, 8)}…\``,
    };
  }
}
