import { Injectable } from '@nestjs/common';
import type { UserRepository } from '../../domain/user.repository';
import { User, type UserRole } from '../../domain/user.entity';
import { Email } from '../../domain/email.value-object';
import { Phone } from '../../domain/phone.value-object';
import type { Email as EmailVO } from '../../domain/email.value-object';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(user: User): Promise<User> {
    const role = await this.prisma.role.findUniqueOrThrow({
      where: { name: user.role },
    });

    const record = await this.prisma.user.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        email: user.email.getValue(),
        passwordHash: user.passwordHash,
        name: user.name,
        phone: user.phone.getValue(),
        roleId: role.id,
      },
      update: {
        email: user.email.getValue(),
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
    const record = await this.prisma.user.findUnique({
      where: { email: email.getValue() },
      include: { role: true },
    });

    return record ? this.toDomain(record) : null;
  }

  async findById(id: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    return record ? this.toDomain(record) : null;
  }

  private toDomain(record: {
    id: string;
    email: string;
    passwordHash: string;
    name: string;
    phone: string;
    createdAt: Date;
    updatedAt: Date;
    role: { name: string };
  }): User {
    return User.reconstitute({
      id: record.id,
      email: Email.create(record.email),
      name: record.name,
      phone: Phone.create(record.phone),
      role: record.role.name as UserRole,
      passwordHash: record.passwordHash,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
