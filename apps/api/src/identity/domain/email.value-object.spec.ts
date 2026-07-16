import { Email } from './email.value-object';

describe('Email Value Object', () => {
  describe('valid emails', () => {
    it('creates a valid email', () => {
      const email = Email.create('test@example.com');
      expect(email.getValue()).toBe('test@example.com');
    });

    it('trims and lowercases the email', () => {
      const email = Email.create('  Test@Example.COM  ');
      expect(email.getValue()).toBe('test@example.com');
    });

    it('accepts emails with subdomains', () => {
      const email = Email.create('user@sub.example.co.uk');
      expect(email.getValue()).toBe('user@sub.example.co.uk');
    });

    it('accepts emails with plus addressing', () => {
      const email = Email.create('user+tag@example.com');
      expect(email.getValue()).toBe('user+tag@example.com');
    });
  });

  describe('invalid emails', () => {
    it('rejects empty string', () => {
      expect(() => Email.create('')).toThrow('Email must be a non-empty string');
    });

    it('rejects null', () => {
      expect(() => Email.create(null as unknown as string)).toThrow(
        'Email must be a non-empty string',
      );
    });

    it('rejects email without @', () => {
      expect(() => Email.create('notanemail')).toThrow('Invalid email format');
    });

    it('rejects email without domain', () => {
      expect(() => Email.create('user@')).toThrow('Invalid email format');
    });

    it('rejects email without local part', () => {
      expect(() => Email.create('@example.com')).toThrow('Invalid email format');
    });

    it('rejects email exceeding 254 characters', () => {
      const local = 'a'.repeat(251);
      expect(() => Email.create(`${local}@b.c`)).toThrow(
        'Email must not exceed 254 characters',
      );
    });
  });

  describe('equality', () => {
    it('considers same email equal regardless of case', () => {
      const a = Email.create('Test@Example.com');
      const b = Email.create('test@example.com');
      expect(a.equals(b)).toBe(true);
    });
  });
});
