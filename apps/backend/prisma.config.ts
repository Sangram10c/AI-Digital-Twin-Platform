import * as path from 'path';
import * as dotenv from 'dotenv';
import { defineConfig } from 'prisma/config';

// Load monorepo root .env first, then backend-local overrides.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Prisma generate/validate do not connect to the DB, but Prisma 7 still
// requires a datasource URL at config load time (e.g. in CI without .env).
const databaseUrl =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/ai_digital_twin?schema=public';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: databaseUrl,
  },
});
