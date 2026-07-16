// Bolivia phone format: +591 followed by 6 or 7, then 7 digits
const CANONICAL = /^\+591[67]\d{7}$/;

export class Phone {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(phone: string): Phone {
    if (!phone || typeof phone !== 'string') {
      throw new Error('Phone must be a non-empty string');
    }

    const stripped = phone.trim().replace(/[-\s.]/g, '');

    if (!CANONICAL.test(stripped)) {
      throw new Error(
        `Invalid Bolivian phone format: ${phone}. Expected +591 followed by 6 or 7 and 7 digits`,
      );
    }

    return new Phone(stripped);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Phone): boolean {
    return this.value === other.value;
  }
}
