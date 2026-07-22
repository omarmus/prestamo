import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import type { ContactRepository } from '../domain/contact-repository.port';
import { CONTACT_REPOSITORY } from '../whatsapp.tokens';

// ponytail: Inline type formerly from ChatbotSession entity, now deleted.
export interface LoanApplicationData {
  name?: string;
  email?: string;
  amount?: number;
  termMonths?: number;
  purpose?: string;
}

export interface ApplyLoanResult {
  applicationId: string;
  status: string;
  message: string;
}

@Injectable()
export class ApplyLoanHandler {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(CONTACT_REPOSITORY) private readonly contactRepo: ContactRepository,
  ) {}

  async execute(phone: string, data: LoanApplicationData): Promise<ApplyLoanResult> {
    const id = randomUUID();
    const amount = data.amount ?? 0;
    const termMonths = data.termMonths ?? 0;
    const purpose = data.purpose ?? '';

    // Link user if contact has one
    let userId: string | null = null;
    const contact = await this.contactRepo.findByPhone(phone);
    if (contact?.userId) {
      userId = contact.userId;
    }

    await this.prisma.whatsAppLoanDraft.create({
      data: { id, phone, amount, termMonths, purpose, status: 'draft', userId },
    });

    return {
      applicationId: id,
      status: 'draft',
      message:
        `✅ *Solicitud registrada exitosamente*\n\n` +
        `*Monto:* Bs. ${amount}\n` +
        `*Plazo:* ${termMonths} meses\n` +
        `*Propósito:* ${purpose}\n` +
        `*Estado:* Recibida — un asesor revisará tu solicitud y te contactará pronto.\n\n` +
        `Guarda tu ID de solicitud: \`${id.slice(0, 8)}…\``,
    };
  }
}
