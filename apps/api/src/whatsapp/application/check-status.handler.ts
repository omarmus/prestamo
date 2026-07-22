import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

export interface CheckStatusResult {
  message: string;
  hasApplication: boolean;
}

@Injectable()
export class CheckStatusHandler {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async execute(phone: string): Promise<CheckStatusResult> {
    // ponytail: Direct Prisma query. WhatsApp loan drafts are stored in the
    // WhatsAppLoanDraft table. Once migrated to the loans module, this handler
    // will be removed entirely.
    const row = await this.prisma.whatsAppLoanDraft.findFirst({
      where: { phone },
      orderBy: { createdAt: 'desc' },
    });

    if (!row) {
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
        `${statusEmoji[row.status] ?? '📋'} *Estado de tu solicitud*\n\n` +
        `*Monto:* Bs. ${Number(row.amount)}\n` +
        `*Plazo:* ${row.termMonths} meses\n` +
        `*Propósito:* ${row.purpose}\n` +
        `*Estado:* ${statusLabels[row.status] ?? row.status}\n\n` +
        `Creada: ${row.createdAt.toLocaleDateString('es-BO')}`,
    };
  }
}
