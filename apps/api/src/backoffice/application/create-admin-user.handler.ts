import { Injectable, Inject, ConflictException } from '@nestjs/common';
import {
  USER_REPOSITORY,
  PASSWORD_HASHER,
} from '../../identity/identity.tokens';
import type { UserRepository } from '../../identity/domain/user.repository';
import type { PasswordHasher } from '../../identity/application/ports/password-hasher.port';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { User } from '../../identity/domain/user.entity';
import { Email } from '../../identity/domain/email.value-object';
import { Phone } from '../../identity/domain/phone.value-object';
import type { AdminUserListItem } from '@prestamos/shared';

// ponytail: no invite email sent — add when mail service is ready
@Injectable()
export class CreateAdminUserHandler {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async execute(input: {
    email: string;
    name: string;
    phone: string;
    password: string;
  }): Promise<AdminUserListItem> {
    const emailVO = Email.create(input.email);
    const phoneVO = Phone.create(input.phone);

    const existing = await this.userRepo.findByEmail(emailVO);
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await this.passwordHasher.hash(input.password);

    // Ensure ADMIN role exists
    const adminRole = await this.prisma.role.upsert({
      where: { name: 'ADMIN' },
      create: { name: 'ADMIN' },
      update: {},
    });

    const user = User.create({
      email: emailVO,
      name: input.name,
      phone: phoneVO,
      role: 'ADMIN',
      passwordHash,
    });

    const saved = await this.userRepo.save(user);

    return {
      id: saved.id,
      email: saved.email?.getValue() ?? '',
      name: saved.name,
      phone: saved.phone.getValue(),
      role: saved.role,
      createdAt: saved.createdAt.toISOString(),
    };
  }
}
