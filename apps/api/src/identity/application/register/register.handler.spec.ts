import { RegisterHandler } from './register.handler';
import { RegisterCommand } from './register.command';
import { UserAlreadyExistsError } from '../../domain/errors/user-already-exists.error';
import type { UserRepository } from '../../domain/user.repository';
import type { PasswordHasher } from '../ports/password-hasher.port';
import type { JwtService } from '../ports/jwt-service.port';
import type { RefreshTokenService } from '../ports/refresh-token-service.port';
import { Email } from '../../domain/email.value-object';
import { Phone } from '../../domain/phone.value-object';
import { User } from '../../domain/user.entity';

function createMockUser() {
  return User.create({
    email: Email.create('a@b.com'),
    name: 'Test User',
    phone: Phone.create('+59161234567'),
    passwordHash: 'argon2hash_placeholder_for_testing_purposes',
  });
}

describe('RegisterHandler', () => {
  let handler: RegisterHandler;
  let mockUserRepo: jest.Mocked<UserRepository>;
  let mockPasswordHasher: jest.Mocked<PasswordHasher>;
  let mockJwtService: jest.Mocked<JwtService>;
  let mockRefreshTokenService: jest.Mocked<RefreshTokenService>;

  beforeEach(() => {
    mockUserRepo = {
      save: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
    };

    mockPasswordHasher = {
      hash: jest.fn(),
      verify: jest.fn(),
    };

    mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    mockRefreshTokenService = {
      generate: jest.fn(),
      consume: jest.fn(),
      revokeFamily: jest.fn(),
    };

    handler = new RegisterHandler(
      mockUserRepo,
      mockPasswordHasher,
      mockJwtService,
      mockRefreshTokenService,
    );
  });

  describe('scenario 1: successful registration', () => {
    it('returns tokens when registration succeeds', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);
      mockPasswordHasher.hash.mockResolvedValue('hashed_password_argon2');
      mockUserRepo.save.mockResolvedValue(createMockUser());
      mockJwtService.sign.mockResolvedValue({ accessToken: 'jwt.access.token' });
      mockRefreshTokenService.generate.mockResolvedValue('refresh-token-id');

      const command = new RegisterCommand(
        'a@b.com',
        'password123',
        'Test User',
        '+59161234567',
      );

      const result = await handler.execute(command);

      expect(result.accessToken).toBe('jwt.access.token');
      expect(result.refreshToken).toBe('refresh-token-id');
      expect(result.user.email).toBe('a@b.com');
      expect(result.user.role).toBe('USER');

      expect(mockPasswordHasher.hash).toHaveBeenCalledWith('password123');
      expect(mockUserRepo.save).toHaveBeenCalled();
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: expect.any(String),
        role: 'USER',
      });
    });
  });

  describe('scenario 2: duplicate email rejected', () => {
    it('throws UserAlreadyExistsError when email is taken', async () => {
      const existingUser = createMockUser();
      mockUserRepo.findByEmail.mockResolvedValue(existingUser);

      const command = new RegisterCommand(
        'a@b.com',
        'password123',
        'Test User',
        '+59161234567',
      );

      await expect(handler.execute(command)).rejects.toThrow(UserAlreadyExistsError);
      expect(mockUserRepo.save).not.toHaveBeenCalled();
      expect(mockPasswordHasher.hash).not.toHaveBeenCalled();
    });
  });
});
