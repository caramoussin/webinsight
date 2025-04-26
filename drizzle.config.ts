import type { Config } from 'drizzle-kit';
import { join } from 'path';

export default {
  schema: './src/lib/db/schema.ts',
  out: './migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL || join(process.cwd(), 'local.db')
  },
  verbose: true,
  strict: true
} satisfies Config;
