import { randomUUID } from 'node:crypto';

export interface WhatsAppMessageProps {
  id?: string;
  conversationId: string;
  direction: 'incoming' | 'outgoing';
  messageType: string;
  content?: string | null;
  metaId?: string | null;
  status?: string;
}

export class WhatsAppMessage {
  private readonly _id: string;
  private readonly _conversationId: string;
  private readonly _direction: string;
  private readonly _messageType: string;
  private readonly _content: string | null;
  private readonly _metaId: string | null;
  private readonly _status: string;
  private readonly _createdAt: Date;

  private constructor(props: WhatsAppMessageProps, createdAt?: Date) {
    this._id = props.id ?? randomUUID();
    this._conversationId = props.conversationId;
    this._direction = props.direction;
    this._messageType = props.messageType;
    this._content = props.content ?? null;
    this._metaId = props.metaId ?? null;
    this._status = props.status ?? 'sent';
    this._createdAt = createdAt ?? new Date();
  }

  static createIncoming(props: {
    conversationId: string;
    messageType: string;
    content?: string | null;
    metaId?: string | null;
  }): WhatsAppMessage {
    return new WhatsAppMessage({
      ...props,
      direction: 'incoming',
      status: 'delivered',
    });
  }

  static createOutgoing(props: {
    conversationId: string;
    messageType: string;
    content?: string | null;
    metaId?: string | null;
  }): WhatsAppMessage {
    return new WhatsAppMessage({
      ...props,
      direction: 'outgoing',
      status: 'sent',
    });
  }

  static reconstitute(
    props: WhatsAppMessageProps & { createdAt: Date },
  ): WhatsAppMessage {
    return new WhatsAppMessage(props, props.createdAt);
  }

  // --- Getters ---

  get id(): string {
    return this._id;
  }

  get conversationId(): string {
    return this._conversationId;
  }

  get direction(): string {
    return this._direction;
  }

  get messageType(): string {
    return this._messageType;
  }

  get content(): string | null {
    return this._content;
  }

  get metaId(): string | null {
    return this._metaId;
  }

  get status(): string {
    return this._status;
  }

  get createdAt(): Date {
    return this._createdAt;
  }
}
