import * as path from 'path';
import * as dotenv from 'dotenv';
import * as argon2 from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  UserRole,
  GitProviderType,
  UserStatus,
  WorkspaceMemberRole,
  WorkspaceStatus,
} from '@prisma/client';

// Load env when run via tsx (prisma db seed also injects env via prisma.config.ts).
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set. Check .env or monorepo root .env.');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const GIT_PROVIDERS = [
  {
    type: GitProviderType.GITHUB,
    name: 'github',
    displayName: 'GitHub',
    apiBaseUrl: 'https://api.github.com',
  },
  {
    type: GitProviderType.GITLAB,
    name: 'gitlab',
    displayName: 'GitLab',
    apiBaseUrl: 'https://gitlab.com/api/v4',
  },
  {
    type: GitProviderType.BITBUCKET,
    name: 'bitbucket',
    displayName: 'Bitbucket',
    apiBaseUrl: 'https://api.bitbucket.org/2.0',
  },
] as const;

/**
 * Database seed entry point.
 *
 * Phase 2: Identity domain (admin user).
 * Phase 3: Default workspace with settings and owner membership.
 * Phase 4: Git provider catalog reference data.
 */
async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    console.log('Seed skipped in production.');
    return;
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const workspaceSlug = process.env.SEED_WORKSPACE_SLUG ?? 'default';

  const passwordHash = adminPassword
    ? await argon2.hash(adminPassword, {
        type: argon2.argon2id,
        memoryCost: 19456,
        timeCost: 2,
        parallelism: 1,
      })
    : undefined;

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      ...(passwordHash ? { passwordHash } : {}),
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      deletedAt: null,
    },
    create: {
      email: adminEmail,
      passwordHash,
      firstName: process.env.SEED_ADMIN_FIRST_NAME ?? 'Platform',
      lastName: process.env.SEED_ADMIN_LAST_NAME ?? 'Admin',
      displayName:
        process.env.SEED_ADMIN_DISPLAY_NAME ??
        `${process.env.SEED_ADMIN_FIRST_NAME ?? 'Platform'} ${process.env.SEED_ADMIN_LAST_NAME ?? 'Admin'}`.trim(),
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      timezone: 'UTC',
      locale: 'en',
    },
  });

  console.log(`Seeded user: ${admin.email} (${admin.id})`);

  const workspace = await prisma.workspace.upsert({
    where: { slug: workspaceSlug },
    update: {},
    create: {
      name: 'Default Workspace',
      slug: workspaceSlug,
      description: 'Development workspace seeded for local testing.',
      ownerId: admin.id,
      status: WorkspaceStatus.ACTIVE,
      settings: {
        create: {
          autoSyncEnabled: true,
          notificationsEnabled: true,
        },
      },
      members: {
        create: {
          userId: admin.id,
          role: WorkspaceMemberRole.OWNER,
        },
      },
    },
    include: { settings: true },
  });

  console.log(`Seeded workspace: ${workspace.name} (${workspace.id})`);

  for (const provider of GIT_PROVIDERS) {
    const gitProvider = await prisma.gitProvider.upsert({
      where: { type: provider.type },
      update: {
        displayName: provider.displayName,
        apiBaseUrl: provider.apiBaseUrl,
        isEnabled: true,
      },
      create: provider,
    });

    console.log(`Seeded git provider: ${gitProvider.displayName}`);
  }
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
