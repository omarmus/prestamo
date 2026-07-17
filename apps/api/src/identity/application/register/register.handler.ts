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
    // 1. Validate phone via Value Object
    const phone = Phone.create(command.phone);

    // 2. Check if phone already exists
    const existingByPhone = await this.userRepository.findByPhone(phone);
    if (existingByPhone) {
      throw new UserAlreadyExistsError(command.phone);
    }

    // 3. Validate email if provided
    let email: Email | null = null;
    if (command.email) {
      email = Email.create(command.email);

      const existingByEmail = await this.userRepository.findByEmail(email);
      if (existingByEmail) {
        throw new UserAlreadyExistsError(command.email);
      }
    }

    // 4. Hash password with argon2id
    const passwordHash = await this.passwordHasher.hash(command.password);

    // 5. Create User entity
    const user = User.create({
      email: email ?? undefined,
      name: command.name,
      phone,
      passwordHash,
    });

    // 6. Persist
    await this.userRepository.save(user);

    // 7. Generate tokens
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