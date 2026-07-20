import { Customer } from './customer.entity';
import { User } from '../../identity/domain/user.entity';
import { Phone } from '../../identity/domain/phone.value-object';

describe('Customer', () => {
  describe('create', () => {
    it('creates instance with valid props', () => {
      const customer = Customer.create({ userId: 'user-1', firstName: 'Juan' });

      expect(customer.id).toBeDefined();
      expect(customer.userId).toBe('user-1');
      expect(customer.firstName).toBe('Juan');
      expect(customer.status).toBe('REGISTERED');
      expect(customer.kycStatus).toBe('NOT_STARTED');
    });

    it('throws when firstName is empty', () => {
      expect(() => Customer.create({ userId: 'user-1', firstName: '' }))
        .toThrow('First name is required');
    });

    it('throws when userId is missing', () => {
      expect(() => Customer.create({ userId: '', firstName: 'Juan' }))
        .toThrow('User ID is required');
    });
  });

  describe('createFromUser', () => {
    it('creates customer with userId and firstName from User', () => {
      const user = User.reconstitute({
        id: 'user-1',
        name: 'Juan Perez',
        phone: Phone.create('+59161234567'),
        passwordHash: 'hashed_value_placeholder',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const customer = Customer.createFromUser(user);

      expect(customer.userId).toBe('user-1');
      expect(customer.firstName).toBe('Juan Perez');
    });
  });

  describe('reconstitute', () => {
    it('restores from persisted props with timestamps', () => {
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-06-15');

      const customer = Customer.reconstitute({
        id: 'fixed-id',
        userId: 'user-1',
        firstName: 'Maria',
        lastName: 'Lopez',
        documentType: 'CI',
        documentNumber: '1234567-LP',
        status: 'ACTIVE',
        kycStatus: 'VERIFIED',
        createdAt,
        updatedAt,
      });

      expect(customer.id).toBe('fixed-id');
      expect(customer.firstName).toBe('Maria');
      expect(customer.lastName).toBe('Lopez');
      expect(customer.documentType).toBe('CI');
      expect(customer.documentNumber).toBe('1234567-LP');
      expect(customer.status).toBe('ACTIVE');
      expect(customer.kycStatus).toBe('VERIFIED');
      expect(customer.createdAt).toBe(createdAt);
      expect(customer.updatedAt).toBe(updatedAt);
    });
  });

  describe('getters', () => {
    it('return null for optional fields not set', () => {
      const customer = Customer.create({ userId: 'user-1', firstName: 'Juan' });

      expect(customer.lastName).toBeNull();
      expect(customer.documentType).toBeNull();
      expect(customer.documentNumber).toBeNull();
      expect(customer.birthDate).toBeNull();
      expect(customer.gender).toBeNull();
      expect(customer.maritalStatus).toBeNull();
      expect(customer.occupation).toBeNull();
      expect(customer.monthlyIncome).toBeNull();
    });

    it('return values that were set', () => {
      const customer = Customer.create({
        userId: 'user-1',
        firstName: 'Juan',
        lastName: 'Perez',
        monthlyIncome: 5000,
      });

      expect(customer.firstName).toBe('Juan');
      expect(customer.lastName).toBe('Perez');
      expect(customer.monthlyIncome).toBe(5000);
    });
  });
});
