import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import type { AdminUserListResponse, AdminUserListItem } from '@prestamos/shared';

// ponytail: direct Prisma query for admin-only reads. Extract to query service when
// user management grows beyond basic CRUD.
@Injectable()
export class ListAdminUsersHandler {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async execute(): Promise<AdminUserListResponse> {
    const adminRole = await this.prisma.role.findUnique({
      where: { name: 'ADMIN' },
    });

    if (!adminRole) {
      return { data: [] };
    }

    const users = await this.prisma.user.findMany({
      where: { roleId: adminRole.id, deletedAt: null },
      include: { role: true },
      orderBy: { createdAt: 'desc' },
    });

    const data: AdminUserListItem[] = users.map((u) => ({
      id: u.id,
      email: u.email ?? '',
      name: u.name,
      phone: u.phone,
      role: u.role.name,
      createdAt: u.createdAt.toISOString(),
    }));

    return { data };
  }
}
