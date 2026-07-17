import { ChatbotSession } from './chatbot-session.entity';

export interface SessionStore {
  get(phone: string): Promise<ChatbotSession | null>;
  save(session: ChatbotSession): Promise<void>;
  delete(phone: string): Promise<void>;
}
