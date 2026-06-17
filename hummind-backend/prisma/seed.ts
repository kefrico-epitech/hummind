import { PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const email = process.env.ROOT_EMAIL ?? 'root@hummind.com';
  const password = process.env.ROOT_PASSWORD ?? 'Hummind!2025';

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      firstName: 'Root',
      lastName: 'Admin',
      role: Role.ROOT,
      profileCompleted: true,
      onboardingCompleted: true,
    },
  });

  // eslint-disable-next-line no-console
  console.log(`✅ ROOT prêt : ${user.email} (mot de passe : ${password})`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
