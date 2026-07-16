import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { hash } from '@node-rs/argon2';

const pool = new pg.Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'prestamos',
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  // Create roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN' },
  });

  const userRole = await prisma.role.upsert({
    where: { name: 'USER' },
    update: {},
    create: { name: 'USER' },
  });

  console.log('Roles created:', adminRole.name, userRole.name);

  // Create initial admin user
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@prestamos.com';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'admin123!';

  const passwordHash = await hash(adminPassword, {
    algorithm: 2,
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash },
    create: {
      email: adminEmail,
      passwordHash,
      name: 'Admin',
      phone: '+59160000000',
      roleId: adminRole.id,
    },
  });

  console.log('Admin user created:', admin.email);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
