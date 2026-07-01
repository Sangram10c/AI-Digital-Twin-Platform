import * as path from 'path';
import * as dotenv from 'dotenv';

// Load .env from the monorepo root
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
});
