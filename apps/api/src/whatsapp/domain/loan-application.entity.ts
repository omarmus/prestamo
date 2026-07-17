import { randomUUID } from 'node:crypto';

export type LoanStatus = 'draft' | 'submitted' | 'review' | 'approved' | 'rejected';

export interface LoanApplicationProps {
  id?: string;
  phone: string;
  amount: number;
  termMonths: number;
  purpose: string;
  status?: LoanStatus;
  userId?: string | null;
}

export class LoanApplication {
  private readonly _id: string;
  private readonly _phone: string;
  private _amount: number;
  private _termMonths: number;
  private _purpose: string;
  private _status: LoanStatus;
  private _userId: string | null;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(
    props: LoanApplicationProps,
    timestamps?: { createdAt: Date; updatedAt: Date },
  ) {
    this._id = props.id ?? randomUUID();
    this._phone = props.phone;
    this._amount = props.amount;
    this._termMonths = props.termMonths;
    this._purpose = props.purpose;
    this._status = props.status ?? 'draft';
    this._userId = props.userId ?? null;
    this._createdAt = timestamps?.createdAt ?? new Date();
    this._updatedAt = timestamps?.updatedAt ?? new Date();
  }

  static create(props: LoanApplicationProps): LoanApplication {
    if (props.amount <= 0) throw new Error('Amount must be positive');
    if (props.termMonths <= 0 || props.termMonths > 120)
      throw new Error('Term must be 1-120 months');
    if (!props.purpose || props.purpose.trim().length < 2)
      throw new Error('Purpose must be at least 2 characters');
    return new LoanApplication(props);
  }

  static reconstitute(
    props: LoanApplicationProps & { createdAt: Date; updatedAt: Date },
  ): LoanApplication {
    return new LoanApplication(props, {
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    });
  }

  /** Restore from a plain JSON object (Redis persistence). */
  static fromPersistence(raw: Record<string, unknown>): LoanApplication {
    return new LoanApplication(
      {
        id: raw.id as string,
        phone: raw.phone as string,
        amount: raw.amount as number,
        termMonths: raw.termMonths as number,
        purpose: raw.purpose as string,
        status: raw.status as LoanStatus,
        userId: (raw.userId as string) ?? null,
      },
      {
        createdAt: new Date(raw.createdAt as string),
        updatedAt: new Date(raw.updatedAt as string),
      },
    );
  }

  /** Serialize to plain object for Redis/JSON storage. */
  toJSON(): Record<string, unknown> {
    return {
      id: this._id,
      phone: this._phone,
      amount: this._amount,
      termMonths: this._termMonths,
      purpose: this._purpose,
      status: this._status,
      userId: this._userId,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
    };
  }

  linkUser(userId: string): void {
    this._userId = userId;
    this._updatedAt = new Date();
  }

  // --- Getters ---

  get id(): string {
    return this._id;
  }
  get phone(): string {
    return this._phone;
  }
  get amount(): number {
    return this._amount;
  }
  get termMonths(): number {
    return this._termMonths;
  }
  get purpose(): string {
    return this._purpose;
  }
  get status(): LoanStatus {
    return this._status;
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
