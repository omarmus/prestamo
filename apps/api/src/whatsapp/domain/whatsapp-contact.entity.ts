import { randomUUID } from 'node:crypto';

export interface WhatsAppContactProps {
  id?: string;
  phone: string;
  name?: string | null;
  userId?: string | null;
}

export class WhatsAppContact {
  private readonly _id: string;
  private readonly _phone: string;
  private _name: string | null;
  private _userId: string | null;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(
    props: WhatsAppContactProps,
    timestamps?: { createdAt: Date; updatedAt: Date },
  ) {
    this._id = props.id ?? randomUUID();
    this._phone = props.phone;
    this._name = props.name ?? null;
    this._userId = props.userId ?? null;
    this._createdAt = timestamps?.createdAt ?? new Date();
    this._updatedAt = timestamps?.updatedAt ?? new Date();
  }

  static create(props: WhatsAppContactProps): WhatsAppContact {
    if (!props.phone || props.phone.trim().length === 0) {
      throw new Error('Phone is required');
    }
    return new WhatsAppContact(props);
  }

  static reconstitute(
    props: WhatsAppContactProps & { createdAt: Date; updatedAt: Date },
  ): WhatsAppContact {
    return new WhatsAppContact(props, {
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    });
  }

  // --- Behaviour ---

  linkUser(userId: string): void {
    this._userId = userId;
    this._updatedAt = new Date();
  }

  updateName(name: string): void {
    this._name = name;
    this._updatedAt = new Date();
  }

  // --- Getters ---

  get id(): string {
    return this._id;
  }

  get phone(): string {
    return this._phone;
  }

  get name(): string | null {
    return this._name;
  }

  get userId(): string | null {
    return this._userId;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }
}
