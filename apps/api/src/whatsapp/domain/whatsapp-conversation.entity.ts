import { randomUUID } from 'node:crypto';

export interface WhatsAppConversationProps {
  id?: string;
  contactId: string;
}

export class WhatsAppConversation {
  private readonly _id: string;
  private readonly _contactId: string;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(
    props: WhatsAppConversationProps,
    timestamps?: { createdAt: Date; updatedAt: Date },
  ) {
    this._id = props.id ?? randomUUID();
    this._contactId = props.contactId;
    this._createdAt = timestamps?.createdAt ?? new Date();
    this._updatedAt = timestamps?.updatedAt ?? new Date();
  }

  static create(props: WhatsAppConversationProps): WhatsAppConversation {
    if (!props.contactId) {
      throw new Error('contactId is required');
    }
    return new WhatsAppConversation(props);
  }

  static reconstitute(
    props: WhatsAppConversationProps & { createdAt: Date; updatedAt: Date },
  ): WhatsAppConversation {
    return new WhatsAppConversation(props, {
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    });
  }

  // --- Getters ---

  get id(): string {
    return this._id;
  }

  get contactId(): string {
    return this._contactId;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }
}
