import { WhatsAppConversation } from './whatsapp-conversation.entity';

export interface ConversationRepository {
  save(conversation: WhatsAppConversation): Promise<WhatsAppConversation>;
  findActiveByContact(contactId: string): Promise<WhatsAppConversation | null>;
  findById(id: string): Promise<WhatsAppConversation | null>;
}
