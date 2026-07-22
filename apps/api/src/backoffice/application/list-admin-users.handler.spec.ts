import { ListAdminUsersHandler } from './list-admin-users.handler';
import type { PrismaService } from '../../shared/prisma/prisma.service';

describe('ListAdminUsersHandler', () => {
  let handler: ListAdminUsersHandler;
  let mockPrisma: jest.Mocked<PrismaService>;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findMany: jest.fn(),
      },
      role: {
        findUnique: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaService>;

    handler = new ListAdminUsersHandler(mockPrisma);
  });

  describe('scenario: admin users exist', () => {
    it('returns mapped admin users', async () => {
      const role = { id: 'role-admin', name: 'ADMIN' };
      const users = [
        { id: 'user-1', email: 'admin1@test.com', name: 'Admin 1', phone: '+59171234567', role, createdAt: new Date('2026-01-01') },
        { id: 'user-2', email: 'admin2@test.com', name: 'Admin 2', phone: '+59179876543', role, createdAt: new Date('2026-01-02') },
      ];

      // ponytail: direct role lookup — extract to query service when role management grows
      (mockPrisma.role.findUnique as jest.Mock).mockResolvedValue(role);
      (mockPrisma.user.findMany as jest.Mock).mockResolvedValue(users);

      const result = await handler.execute();

      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual({
        id: 'user-1',
        email: 'admin1@test.com',
        name: 'Admin 1',
        phone: '+59171234567',
        role: 'ADMIN',
        createdAt: '2026-01-01T00:00:00.000Z',
      });
      expect(mockPrisma.role.findUnique).toHaveBeenCalledWith({ where: { name: 'ADMIN' } });
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { roleId: role.id, deletedAt: null },
        include: { role: true },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('scenario: no admin role exists', () => {
    it('returns empty list', async () => {
      (mockPrisma.role.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await handler.execute();

      expect(result.data).toHaveLength(0);
    });
  });
});
