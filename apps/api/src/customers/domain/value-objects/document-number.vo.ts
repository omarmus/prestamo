// Value Object for Bolivian document numbers (CI — Cédula de Identidad)
// Format: numeric string, 5-15 digits, optional suffix like "LP" or "SC"
export class DocumentNumber {
  private constructor(private readonly value: string) {}

  static create(raw: string): DocumentNumber {
    const trimmed = raw.trim();
    // ponytail: basic format validation — CI can be numbers + optional dept suffix
    if (!/^\d{5,15}(-[A-Z]{2,3})?$/.test(trimmed)) {
      throw new Error(`Invalid document number format: ${raw}`);
    }
    return new DocumentNumber(trimmed);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: DocumentNumber): boolean {
    return this.value === other.getValue();
  }
}
