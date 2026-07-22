import { randomUUID } from 'node:crypto';
import type { User } from '../../identity/domain/user.entity';

export interface CustomerProps {
  id?: string;
  userId: string;
  firstName: string;
  lastName?: string | null;
  documentType: string;
  documentNumber: string;
  birthDate?: Date | null;
  gender?: string | null;
  maritalStatus?: string | null;
  occupation?: string | null;
  monthlyIncome?: number | null;
  status?: string;
  kycStatus?: string;
}

export class Customer {
  private readonly _id: string;
  private readonly _userId: string;
  private _firstName: string;
  private _lastName: string | null;
  private _documentType: string;
  private _documentNumber: string;
  private _birthDate: Date | null;
  private _gender: string | null;
  private _maritalStatus: string | null;
  private _occupation: string | null;
  private _monthlyIncome: number | null;
  private _status: string;
  private _kycStatus: string;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: CustomerProps, timestamps?: { createdAt: Date; updatedAt: Date }) {
    this._id = props.id ?? randomUUID();
    this._userId = props.userId;
    this._firstName = props.firstName;
    this._lastName = props.lastName ?? null;
    this._documentType = props.documentType;
    this._documentNumber = props.documentNumber;
    this._birthDate = props.birthDate ?? null;
    this._gender = props.gender ?? null;
    this._maritalStatus = props.maritalStatus ?? null;
    this._occupation = props.occupation ?? null;
    this._monthlyIncome = props.monthlyIncome ?? null;
    this._status = props.status ?? 'REGISTERED';
    this._kycStatus = props.kycStatus ?? 'NOT_STARTED';
    this._createdAt = timestamps?.createdAt ?? new Date();
    this._updatedAt = timestamps?.updatedAt ?? new Date();
  }

  static create(props: CustomerProps): Customer {
    if (!props.firstName || props.firstName.trim().length < 1) {
      throw new Error('First name is required');
    }
    if (!props.userId) {
      throw new Error('User ID is required');
    }
    if (!props.documentNumber || props.documentNumber.trim().length < 1) {
      throw new Error('Document number is required');
    }
    return new Customer(props);
  }

  /** Create a Customer from a just-registered User. */
  static createFromUser(user: User, documentType: string, documentNumber: string): Customer {
    return Customer.create({
      userId: user.id,
      firstName: user.name,
      lastName: null,
      documentType,
      documentNumber,
    });
  }

  /** Reconstitute from persistence. */
  static reconstitute(props: CustomerProps & { createdAt: Date; updatedAt: Date }): Customer {
    return new Customer(props, { createdAt: props.createdAt, updatedAt: props.updatedAt });
  }

  // --- Getters ---

  get id(): string {
    return this._id;
  }
  get userId(): string {
    return this._userId;
  }
  get firstName(): string {
    return this._firstName;
  }
  get lastName(): string | null {
    return this._lastName;
  }
  get documentType(): string {
    return this._documentType;
  }
  get documentNumber(): string {
    return this._documentNumber;
  }
  get birthDate(): Date | null {
    return this._birthDate;
  }
  get gender(): string | null {
    return this._gender;
  }
  get maritalStatus(): string | null {
    return this._maritalStatus;
  }
  get occupation(): string | null {
    return this._occupation;
  }
  get monthlyIncome(): number | null {
    return this._monthlyIncome;
  }
  get status(): string {
    return this._status;
  }
  get kycStatus(): string {
    return this._kycStatus;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }
}
