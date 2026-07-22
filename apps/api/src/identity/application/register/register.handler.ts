import type { TokenResponse } from '@prestamos/shared';
import { Email } from '../../domain/email.value-object';
import { Phone } from '../../domain/phone.value-object';
import { User } from '../../domain/user.entity';
import type { UserRepository } from '../../domain/user.repository';
import { UserAlreadyExistsError } from '../../domain/errors/user-already-exists.error';
import type { PasswordHasher } from '../ports/password-hasher.port';
import type { JwtService } from '../ports/jwt-service.port';
import type { RefreshTokenService } from '../ports/refresh-token-service.port';
import type { CustomerCreatorPort } from '../../../customers/application/ports/customer-creator.port';
import { Customer } from '../../../customers/domain/customer.entity';
import { RegisterCommand } from './register.command';

export class RegisterHandler {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly jwtService: JwtService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly customerCreator: CustomerCreatorPort,
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
      role: command.role,
    });

    // 6. Persist User
    await this.userRepository.save(user);

    // 7. Create Customer record for the new user
    const customer = Customer.createFromUser(user, command.documentType, command.documentNumber);
    await this.customerCreator.create(customer);

    // 8. Generate tokens
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