import { WhatsAppMessage } from './whatsapp-message.entity';

export interface MessageRepository {
  save(message: WhatsAppMessage): Promise<WhatsAppMessage>;
}
