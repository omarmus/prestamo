import { WhatsAppContact } from './whatsapp-contact.entity';

export interface ContactRepository {
  save(contact: WhatsAppContact): Promise<WhatsAppContact>;
  findByPhone(phone: string): Promise<WhatsAppContact | null>;
  findById(id: string): Promise<WhatsAppContact | null>;
}
