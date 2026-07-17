export class ContactNotFoundError extends Error {
  public readonly statusCode = 404;

  constructor(phone: string) {
    super(`WhatsApp contact ${phone} not found`);
    this.name = 'ContactNotFoundError';
  }
}

export class ConversationNotFoundError extends Error {
  public readonly statusCode = 404;

  constructor(id: string) {
    super(`WhatsApp conversation ${id} not found`);
    this.name = 'ConversationNotFoundError';
  }
}

export class MessageSendFailedError extends Error {
  public readonly statusCode = 502;

  constructor(phone: string, reason: string) {
    super(`Failed to send message to ${phone}: ${reason}`);
    this.name = 'MessageSendFailedError';
  }
}
