import { ConflictException } from '@nestjs/common';
import { CreateAdminUserHandler } from './create-admin-user.handler';
import type { UserRepository } from '../../identity/domain/user.repository';
import type { PasswordHasher } from '../../identity/application/ports/password-hasher.port';
import type { PrismaService } from '../../shared/prisma/prisma.service';
import { User } from '../../identity/domain/user.entity';
import { Email } from '../../identity/domain/email.value-object';
import { Phone } from '../../identity/domain/phone.value-object';

describe('CreateAdminUserHandler', () => {
  let handler: CreateAdminUserHandler;
  let mockUserRepo: jest.Mocked<UserRepository>;
  let mockPasswordHasher: jest.Mocked<PasswordHasher>;
  let mockPrisma: jest.Mocked<PrismaService>;

  const validInput = {
    email: 'admin@test.com',
    name: 'Admin User',
    phone: '+59171234567',
    password: 'securePass123',
  };

  beforeEach(() => {
    mockUserRepo = {
      save: jest.fn(),
      findByEmail: jest.fn(),
      findByPhone: jest.fn(),
      findById: jest.fn(),
    };

    mockPasswordHasher = {
      hash: jest.fn(),
      verify: jest.fn(),
    };

    mockPrisma = {
      role: {
        upsert: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaService>;

    handler = new CreateAdminUserHandler(mockUserRepo, mockPasswordHasher, mockPrisma);
  });

  describe('scenario: create new admin user', () => {
    it('creates user with ADMIN role and returns summary', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);
      mockPasswordHasher.hash.mockResolvedValue('hashed-password-12345');

      const adminRole = { id: 'role-admin', name: 'ADMIN' };
      (mockPrisma.role.upsert as jest.Mock).mockResolvedValue(adminRole);

      const savedUser = User.create({
        email: Email.create(validInput.email),
        name: validInput.name,
        phone: Phone.create(validInput.phone),
        role: 'ADMIN',
        passwordHash: 'hashed-password-12345',
      });
      mockUserRepo.save.mockResolvedValue(savedUser);

      const result = await handler.execute(validInput);

      expect(result).toEqual({
        id: savedUser.id,
        email: validInput.email,
        name: validInput.name,
        phone: validInput.phone,
        role: 'ADMIN',
        createdAt: savedUser.createdAt.toISOString(),
      });

      expect(mockUserRepo.findByEmail).toHaveBeenCalled();
      expect(mockPasswordHasher.hash).toHaveBeenCalledWith(validInput.password);
      expect(mockPrisma.role.upsert).toHaveBeenCalledWith({
        where: { name: 'ADMIN' },
        create: { name: 'ADMIN' },
        update: {},
      });
      expect(mockUserRepo.save).toHaveBeenCalled();
    });
  });

  describe('scenario: email already taken', () => {
    it('throws ConflictException', async () => {
      const existing = User.create({
        email: Email.create(validInput.email),
        name: 'Existing',
        phone: Phone.create('+59179876543'),
        role: 'ADMIN',
        passwordHash: 'some-existing-hash-12345',
      });
      mockUserRepo.findByEmail.mockResolvedValue(existing);

      await expect(handler.execute(validInput)).rejects.toThrow(ConflictException);
      expect(mockUserRepo.save).not.toHaveBeenCalled();
    });
  });
});
