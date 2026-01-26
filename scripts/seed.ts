import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn('⚠️ ADMIN_EMAIL or ADMIN_PASSWORD not set. Skipping admin user creation.');
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  console.log('🌱 Seeding database...');

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  const project = await prisma.project.upsert({
    where: {
      userId_shortCode: {
        userId: user.id,
        shortCode: 'MAIN',
      },
    },
    update: {},
    create: {
      name: 'Main Project',
      shortCode: 'MAIN',
      user: { connect: { id: user.id } },
    },
  });

  console.log(`✅ Seeded: User(${email}) in Project(${project.shortCode})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
