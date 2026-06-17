/* eslint-disable @typescript-eslint/no-misused-promises */
import { PlatformRole, PrismaClient, UserStatus } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function ensureRoot(): Promise<void> {
  const email = (process.env.ADMIN_SEED_EMAIL ?? 'admin@hummind.com')
    .trim()
    .toLowerCase();
  const password = process.env.ADMIN_SEED_PASSWORD ?? 'admin123';
  const passwordHash = await argon2.hash(password);

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        platformRole: PlatformRole.ROOT,
        status: UserStatus.ACTIVE,
        passwordHash, // refresh to the known test password
        mustChangePassword: false,
        emailVerifiedAt: existing.emailVerifiedAt ?? new Date(),
      },
    });
    console.log(`[seed] ${email} already existed — refreshed as ROOT/ACTIVE`);
    return;
  }

  await prisma.user.create({
    data: {
      email,
      firstname: 'Hummind',
      lastname: 'Team',
      passwordHash,
      platformRole: PlatformRole.ROOT,
      status: UserStatus.ACTIVE,
      mustChangePassword: false, // seed admin never has to go through /first-login
      emailVerifiedAt: new Date(),
    },
  });

  console.log(`[seed] Created ROOT user ${email}`);
  console.warn(
    `[seed] Default password is "${password}". Override via ADMIN_SEED_PASSWORD before any non-test deployment.`,
  );
}

async function main(): Promise<void> {
  await ensureRoot();
  console.log('✅ Seed ok');
}

main()
  .catch((err: unknown) => {
    console.error('[seed] Failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
