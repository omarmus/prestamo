import { Injectable, Inject } from '@nestjs/common';
import type { UserRepository } from '../../domain/user.repository';
import { User, type UserRole } from '../../domain/user.entity';
import { Email } from '../../domain/email.value-object';
import { Phone } from '../../domain/phone.value-object';
import type { Email as EmailVO } from '../../domain/email.value-object';
import type { Phone as PhoneVO } from '../../domain/phone.value-object';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async save(user: User): Promise<User> {
    const role = await this.prisma.role.findUniqueOrThrow({
      where: { name: user.role },
    });

    const record = await this.prisma.user.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        email: user.email?.getValue() ?? null,
        passwordHash: user.passwordHash,
        name: user.name,
        phone: user.phone.getValue(),
        roleId: role.id,
      },
      update: {
        email: user.email?.getValue() ?? null,
        passwordHash: user.passwordHash,
        name: user.name,
        phone: user.phone.getValue(),
        roleId: role.id,
      },
      include: { role: true },
    });

    return this.toDomain(record);
  }

  async findByEmail(email: EmailVO): Promise<User | null> {
    const record = await this.prisma.user.findFirst({
      where: { email: email.getValue(), deletedAt: null },
      include: { role: true },
    });

    return record ? this.toDomain(record) : null;
  }

  async findByPhone(phone: PhoneVO): Promise<User | null> {
    const record = await this.prisma.user.findFirst({
      where: { phone: phone.getValue(), deletedAt: null },
      include: { role: true },
    });

    return record ? this.toDomain(record) : null;
  }

  async findById(id: string): Promise<User | null> {
    const record = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: { role: true },
    });

    return record ? this.toDomain(record) : null;
  }

  private toDomain(record: {
    id: string;
    email: string | null;
    passwordHash: string;
    name: string;
    phone: string;
    createdAt: Date;
    updatedAt: Date;
    role: { name: string };
  }): User {
    return User.reconstitute({
      id: record.id,
      email: record.email ? Email.create(record.email) : undefined,
      name: record.name,
      phone: Phone.create(record.phone),
      role: record.role.name as UserRole,
      passwordHash: record.passwordHash,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
