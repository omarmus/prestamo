import { Inject, Injectable } from '@nestjs/common';

import type { LoanApplicationRepository } from '../domain/loan-application-repository.port';
import { LOAN_APPLICATION_REPOSITORY } from '../whatsapp.tokens';

export interface CheckStatusResult {
  message: string;
  hasApplication: boolean;
}

@Injectable()
export class CheckStatusHandler {
  constructor(
    @Inject(LOAN_APPLICATION_REPOSITORY) private readonly loanRepo: LoanApplicationRepository,
  ) {}

  async execute(phone: string): Promise<CheckStatusResult> {
    const app = await this.loanRepo.findByPhone(phone);

    if (!app) {
      return {
        hasApplication: false,
        message:
          '📋 *No tienes solicitudes activas*\n\n' +
          'Si deseas solicitar un préstamo, responde "Solicitar préstamo" o elige la opción 2 del menú.',
      };
    }

    const statusEmoji: Record<string, string> = {
      draft: '📝',
      submitted: '🔄',
      review: '⏳',
      approved: '✅',
      rejected: '❌',
    };

    const statusLabels: Record<string, string> = {
      draft: 'Borrador — aún no enviada',
      submitted: 'Recibida — en proceso de revisión',
      review: 'En evaluación — un asesor está revisando',
      approved: '¡Aprobada! Te contactaremos para el desembolso',
      rejected: 'No aprobada — puedes intentar con otro monto o plazo',
    };

    return {
      hasApplication: true,
      message:
        `${statusEmoji[app.status] ?? '📋'} *Estado de tu solicitud*\n\n` +
        `*Monto:* Bs. ${app.amount}\n` +
        `*Plazo:* ${app.termMonths} meses\n` +
        `*Propósito:* ${app.purpose}\n` +
        `*Estado:* ${statusLabels[app.status] ?? app.status}\n\n` +
        `Creada: ${app.createdAt.toLocaleDateString('es-BO')}`,
    };
  }
}
