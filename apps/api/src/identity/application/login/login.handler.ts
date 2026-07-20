import type { TokenResponse } from '@prestamos/shared';
import { Email } from '../../domain/email.value-object';
import type { UserRepository } from '../../domain/user.repository';
import { InvalidCredentialsError } from '../../domain/errors/invalid-credentials.error';
import type { PasswordHasher } from '../ports/password-hasher.port';
import type { JwtService } from '../ports/jwt-service.port';
import type { RefreshTokenService } from '../ports/refresh-token-service.port';
import { LoginCommand } from './login.command';

export class LoginHandler {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly jwtService: JwtService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async execute(command: LoginCommand): Promise<TokenResponse> {
    // 1. Validate email format
    const email = Email.create(command.email);

    // 2. Look up user by email
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new InvalidCredentialsError();
    }

    // 3. Verify password
    const isValid = await this.passwordHasher.verify(user.passwordHash, command.password);

    if (!isValid) {
      throw new InvalidCredentialsError();
    }

    // 4. Generate tokens
    const { accessToken } = await this.jwtService.sign({
      sub: user.id,
      role: user.role,
    });

    const refreshToken = await this.refreshTokenService.generate(user.id);

    return {
      accessToken,
      refreshToken,
      user: user.toProfile(),
    };
  }
}
