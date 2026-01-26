import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Load env variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || 'sam@9nau.com';
  const password = process.env.ADMIN_PASSWORD || 'Password123!';

  console.log('🧹 Cleaning database...');
  await prisma.job.deleteMany();
  await prisma.render.deleteMany();
  await prisma.socialAccount.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.project.deleteMany();

  console.log('🌱 Seeding database with clean account data...');

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
    },
    create: {
      email,
      name: 'Samuel Aure',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log(`✅ Seeded: User(${email}) with Admin role.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
