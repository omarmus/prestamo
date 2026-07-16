// RFC 5322 simplified — covers the vast majority of real-world emails
// without rejecting valid addresses that a naive regex would miss.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Email {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(email: string): Email {
    if (!email || typeof email !== 'string') {
      throw new Error('Email must be a non-empty string');
    }

    const trimmed = email.trim().toLowerCase();

    if (trimmed.length > 254) {
      throw new Error('Email must not exceed 254 characters');
    }

    if (!EMAIL_REGEX.test(trimmed)) {
      throw new Error(`Invalid email format: ${email}`);
    }

    return new Email(trimmed);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
