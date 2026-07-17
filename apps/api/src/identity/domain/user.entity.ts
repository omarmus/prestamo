import { randomUUID } from 'node:crypto';
import type { Role, UserProfile } from '@prestamos/shared';
import { Email } from './email.value-object';
import { Phone } from './phone.value-object';

export type UserRole = 'USER' | 'ADMIN';

export interface UserProps {
  id?: string;
  email?: Email;
  name: string;
  phone: Phone;
  role?: UserRole;
  passwordHash: string;
}

export class User {
  private readonly _id: string;
  private readonly _email: Email | null;
  private _name: string;
  private readonly _phone: Phone;
  private readonly _role: UserRole;
  private _passwordHash: string;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(
    props: UserProps,
    timestamps?: { createdAt: Date; updatedAt: Date },
  ) {
    this._id = props.id ?? randomUUID();
    this._email = props.email ?? null;
    this._name = props.name;
    this._phone = props.phone;
    this._role = props.role ?? 'USER';
    this._passwordHash = props.passwordHash;
    this._createdAt = timestamps?.createdAt ?? new Date();
    this._updatedAt = timestamps?.updatedAt ?? new Date();
  }

  static create(props: UserProps): User {
    if (!props.name || props.name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters');
    }
    if (props.name.length > 100) {
      throw new Error('Name must not exceed 100 characters');
    }
    if (!props.passwordHash || props.passwordHash.length < 20) {
      throw new Error('Invalid password hash');
    }

    return new User(props);
  }

  /** Reconstitute from persistence (bypasses create validations, preserves DB timestamps). */
  static reconstitute(props: UserProps & { createdAt: Date; updatedAt: Date }): User {
    return new User(props, { createdAt: props.createdAt, updatedAt: props.updatedAt });
  }

  // --- Behaviour ---

  changePassword(newHash: string): void {
    if (!newHash || newHash.length < 20) {
      throw new Error('Invalid new password hash');
    }
    this._passwordHash = newHash;
    this._updatedAt = new Date();
  }

  toProfile(): UserProfile {
    return {
      id: this._id,
      email: this._email?.getValue() ?? '',
      name: this._name,
      phone: this._phone.getValue(),
      role: this._role as Role,
      createdAt: this._createdAt.toISOString(),
    };
  }

  // --- Getters ---

  get id(): string {
    return this._id;
  }

  get email(): Email | null {
    return this._email;
  }

  get name(): string {
    return this._name;
  }

  get phone(): Phone {
    return this._phone;
  }

  get role(): UserRole {
    return this._role;
  }

  get passwordHash(): string {
    return this._passwordHash;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }
}
