import * as path from 'path';
import * as dotenv from 'dotenv';

// Load .env from the monorepo root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
});
