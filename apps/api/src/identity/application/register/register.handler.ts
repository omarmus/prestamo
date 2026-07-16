import type { TokenResponse } from '@prestamos/shared';
import { Email } from '../../domain/email.value-object';
import { Phone } from '../../domain/phone.value-object';
import { User } from '../../domain/user.entity';
import type { UserRepository } from '../../domain/user.repository';
import { UserAlreadyExistsError } from '../../domain/errors/user-already-exists.error';
import type { PasswordHasher } from '../ports/password-hasher.port';
import type { JwtService } from '../ports/jwt-service.port';
import type { RefreshTokenService } from '../ports/refresh-token-service.port';
import { RegisterCommand } from './register.command';

export class RegisterHandler {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly jwtService: JwtService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async execute(command: RegisterCommand): Promise<TokenResponse> {
    // 1. Validate email and phone via Value Objects
    const email = Email.create(command.email);
    const phone = Phone.create(command.phone);

    // 2. Check if email already exists
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new UserAlreadyExistsError(command.email);
    }

    // 3. Hash password with argon2id
    const passwordHash = await this.passwordHasher.hash(command.password);

    // 4. Create User entity
    const user = User.create({
      email,
      name: command.name,
      phone,
      passwordHash,
    });

    // 5. Persist
    await this.userRepository.save(user);

    // 6. Generate tokens
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
