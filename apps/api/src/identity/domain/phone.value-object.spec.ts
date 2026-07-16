import { Phone } from './phone.value-object';

describe('Phone Value Object (Bolivia)', () => {
  describe('valid phones', () => {
    it('accepts +591 6XXXXXXX (digits only)', () => {
      const phone = Phone.create('+59161234567');
      expect(phone.getValue()).toBe('+59161234567');
    });

    it('accepts +591 7XXXXXXX (digits only)', () => {
      const phone = Phone.create('+59171234567');
      expect(phone.getValue()).toBe('+59171234567');
    });

    it('accepts with spaces', () => {
      const phone = Phone.create('+591 6 1234567');
      expect(phone.getValue()).toBe('+59161234567');
    });

    it('accepts with dashes', () => {
      const phone = Phone.create('+591-7-1234567');
      expect(phone.getValue()).toBe('+59171234567');
    });

    it('accepts with dots', () => {
      const phone = Phone.create('+591.6.1234567');
      expect(phone.getValue()).toBe('+59161234567');
    });

    it('normalizes to canonical form', () => {
      const phone = Phone.create('+591 7 654 3210');
      expect(phone.getValue()).toBe('+59176543210');
    });
  });

  describe('invalid phones', () => {
    it('rejects empty string', () => {
      expect(() => Phone.create('')).toThrow('Phone must be a non-empty string');
    });

    it('rejects null', () => {
      expect(() => Phone.create(null as unknown as string)).toThrow(
        'Phone must be a non-empty string',
      );
    });

    it('rejects short number like 123', () => {
      expect(() => Phone.create('123')).toThrow('Invalid Bolivian phone format');
    });

    it('rejects number without +591 prefix', () => {
      expect(() => Phone.create('61234567')).toThrow('Invalid Bolivian phone format');
    });

    it('rejects number starting with 5', () => {
      expect(() => Phone.create('+59151234567')).toThrow('Invalid Bolivian phone format');
    });

    it('rejects number starting with 8', () => {
      expect(() => Phone.create('+59181234567')).toThrow('Invalid Bolivian phone format');
    });

    it('rejects too-short number', () => {
      expect(() => Phone.create('+5916123456')).toThrow('Invalid Bolivian phone format');
    });

    it('rejects too-long number', () => {
      expect(() => Phone.create('+591612345678')).toThrow('Invalid Bolivian phone format');
    });
  });

  describe('equality', () => {
    it('considers same phone equal', () => {
      const a = Phone.create('+59161234567');
      const b = Phone.create('+591 6 1234567');
      expect(a.equals(b)).toBe(true);
    });
  });
});
