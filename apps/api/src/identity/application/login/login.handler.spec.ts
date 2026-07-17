import { LoginHandler } from './login.handler';
import { LoginCommand } from './login.command';
import { InvalidCredentialsError } from '../../domain/errors/invalid-credentials.error';
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
    passwordHash: 'hashed_password_argon2',
  });
}

describe('LoginHandler', () => {
  let handler: LoginHandler;
  let mockUserRepo: jest.Mocked<UserRepository>;
  let mockPasswordHasher: jest.Mocked<PasswordHasher>;
  let mockJwtService: jest.Mocked<JwtService>;
  let mockRefreshTokenService: jest.Mocked<RefreshTokenService>;

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

    mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    mockRefreshTokenService = {
      generate: jest.fn(),
      consume: jest.fn(),
      revokeFamily: jest.fn(),
    };

    handler = new LoginHandler(
      mockUserRepo,
      mockPasswordHasher,
      mockJwtService,
      mockRefreshTokenService,
    );
  });

  describe('scenario 5: successful login', () => {
    it('returns tokens when credentials are valid', async () => {
      const user = createMockUser();
      mockUserRepo.findByEmail.mockResolvedValue(user);
      mockPasswordHasher.verify.mockResolvedValue(true);
      mockJwtService.sign.mockResolvedValue({ accessToken: 'jwt.access.token' });
      mockRefreshTokenService.generate.mockResolvedValue('refresh-token-id');

      const command = new LoginCommand('a@b.com', 'valid-pass');

      const result = await handler.execute(command);

      expect(result.accessToken).toBe('jwt.access.token');
      expect(result.refreshToken).toBe('refresh-token-id');
      expect(result.user.email).toBe('a@b.com');

      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(
        expect.objectContaining({}),
      );
      expect(mockPasswordHasher.verify).toHaveBeenCalledWith(
        'hashed_password_argon2',
        'valid-pass',
      );
    });
  });

  describe('scenario 6: wrong password', () => {
    it('throws InvalidCredentialsError when password is wrong', async () => {
      const user = createMockUser();
      mockUserRepo.findByEmail.mockResolvedValue(user);
      mockPasswordHasher.verify.mockResolvedValue(false);

      const command = new LoginCommand('a@b.com', 'wrong-pass');

      await expect(handler.execute(command)).rejects.toThrow(InvalidCredentialsError);
      expect(mockJwtService.sign).not.toHaveBeenCalled();
      expect(mockRefreshTokenService.generate).not.toHaveBeenCalled();
    });

    it('throws InvalidCredentialsError when user does not exist', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);

      const command = new LoginCommand('unknown@b.com', 'any-pass');

      await expect(handler.execute(command)).rejects.toThrow(InvalidCredentialsError);
      expect(mockPasswordHasher.verify).not.toHaveBeenCalled();
    });

    it('returns generic message (no user enumeration)', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);

      const command = new LoginCommand('unknown@b.com', 'any-pass');

      try {
        await handler.execute(command);
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidCredentialsError);
        expect((error as InvalidCredentialsError).message).toBe(
          'Invalid email or password',
        );
      }
    });
  });
});
