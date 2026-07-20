import { DocumentNumber } from './document-number.vo';

describe('DocumentNumber', () => {
  describe('create — valid formats', () => {
    it('accepts plain numeric CI without suffix', () => {
      const dn = DocumentNumber.create('1234567');
      expect(dn.getValue()).toBe('1234567');
    });

    it('accepts CI with two-letter department suffix', () => {
      const dn = DocumentNumber.create('1234567-LP');
      expect(dn.getValue()).toBe('1234567-LP');
    });

    it('accepts long CI with three-letter suffix', () => {
      const dn = DocumentNumber.create('12345678901-SC');
      expect(dn.getValue()).toBe('12345678901-SC');
    });
  });

  describe('create — invalid formats', () => {
    it('rejects non-numeric string', () => {
      expect(() => DocumentNumber.create('abc'))
        .toThrow('Invalid document number format');
    });

    it('rejects too-short number', () => {
      expect(() => DocumentNumber.create('123'))
        .toThrow('Invalid document number format');
    });

    it('rejects one-letter suffix (too short)', () => {
      expect(() => DocumentNumber.create('1234567-L'))
        .toThrow('Invalid document number format');
    });

    it('rejects four-letter suffix (too long)', () => {
      expect(() => DocumentNumber.create('1234567-LPPP'))
        .toThrow('Invalid document number format');
    });
  });

  describe('equals', () => {
    it('returns true for same value', () => {
      const a = DocumentNumber.create('1234567');
      const b = DocumentNumber.create('1234567');
      expect(a.equals(b)).toBe(true);
    });

    it('returns false for different value', () => {
      const a = DocumentNumber.create('1234567');
      const b = DocumentNumber.create('7654321');
      expect(a.equals(b)).toBe(false);
    });
  });
});
