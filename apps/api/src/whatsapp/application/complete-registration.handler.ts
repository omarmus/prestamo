import { Inject } from '@nestjs/common';
import type { UserRepository } from '../../identity/domain/user.repository';
import type { ContactRepository } from '../domain/contact-repository.port';
import { RegisterCommand } from '../../identity/application/register/register.command';
import { RegisterHandler } from '../../identity/application/register/register.handler';
import {
  USER_REPOSITORY,
  PASSWORD_HASHER,
  JWT_SERVICE,
  REFRESH_TOKEN_SERVICE,
} from '../../identity/identity.tokens';
import { CONTACT_REPOSITORY } from '../whatsapp.tokens';
import type { PasswordHasher } from '../../identity/application/ports/password-hasher.port';
import type { JwtService } from '../../identity/application/ports/jwt-service.port';
import type { RefreshTokenService } from '../../identity/application/ports/refresh-token-service.port';
import { ChatbotSession } from '../domain/chatbot-session.entity';

export class CompleteRegistrationHandler {
  private readonly registerHandler: RegisterHandler;

  constructor(
    @Inject(USER_REPOSITORY) userRepository: UserRepository,
    @Inject(PASSWORD_HASHER) passwordHasher: PasswordHasher,
    @Inject(JWT_SERVICE) jwtService: JwtService,
    @Inject(REFRESH_TOKEN_SERVICE) refreshTokenService: RefreshTokenService,
    @Inject(CONTACT_REPOSITORY) private readonly contactRepo: ContactRepository,
  ) {
    this.registerHandler = new RegisterHandler(
      userRepository,
      passwordHasher,
      jwtService,
      refreshTokenService,
    );
  }

  async execute(session: ChatbotSession): Promise<string> {
    const command = RegisterCommand.fromPhone(
      session.phone,
      session.data.name ?? session.phone,
      session.data.email ?? undefined,
    );

    const result = await this.registerHandler.execute(command);

    // Link WhatsAppContact to new user
    const contact = await this.contactRepo.findByPhone(session.phone);
    if (contact) {
      contact.linkUser(result.user.id);
      await this.contactRepo.save(contact);
    }

    return result.user.id;
  }
}
