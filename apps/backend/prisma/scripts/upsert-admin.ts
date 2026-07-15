import * as path from 'path';
import * as dotenv from 'dotenv';
import * as argon2 from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, UserRole, UserStatus } from '@prisma/client';

const backendRoot = path.resolve(__dirname, '../..');

// Match prisma.config.ts env load order.
dotenv.config({ path: path.resolve(backendRoot, '../../.env') });
dotenv.config({ path: path.resolve(backendRoot, '.env') });
dotenv.config({ path: path.resolve(backendRoot, '.env.local') });

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const firstName = process.env.ADMIN_FIRST_NAME ?? 'Admin';
const lastName = process.env.ADMIN_LAST_NAME ?? 'User';

if (!email || !password) {
  console.error(
    'Usage: ADMIN_EMAIL=... ADMIN_PASSWORD=... npx tsx prisma/scripts/upsert-admin.ts',
  );
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set.');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      deletedAt: null,
      firstName,
      lastName,
      displayName: `${firstName} ${lastName}`.trim(),
    },
    create: {
      email,
      passwordHash,
      firstName,
      lastName,
      displayName: `${firstName} ${lastName}`.trim(),
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      timezone: 'UTC',
      locale: 'en',
    },
  });

  console.log(
    `Admin account ready: ${user.email} (${user.id}) role=${user.role}`,
  );
}

main()
  .catch((error: unknown) => {
    console.error('Failed to upsert admin:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
