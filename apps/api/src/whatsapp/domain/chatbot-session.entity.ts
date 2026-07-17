export type ChatbotIntent = 'REGISTER' | 'APPLY_LOAN' | 'CHECK_STATUS' | 'HELP';

export interface ChatbotSessionData {
  name?: string;
  email?: string;
  amount?: number;
  termMonths?: number;
  purpose?: string;
}

export class ChatbotSession {
  constructor(
    public readonly phone: string,
    public intent: ChatbotIntent,
    public state: string,
    public data: ChatbotSessionData,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
  ) {}

  static create(phone: string, intent: ChatbotIntent): ChatbotSession {
    return new ChatbotSession(phone, intent, 'init', {});
  }

  transition(newState: string, data?: Partial<ChatbotSessionData>): void {
    this.state = newState;
    if (data) {
      this.data = { ...this.data, ...data };
    }
    this.updatedAt = new Date();
  }
}
