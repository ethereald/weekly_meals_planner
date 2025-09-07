import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Force PostgreSQL mode for Neon database
const usePostgreSQL = process.env.DATABASE_URL?.includes('postgresql://') || process.env.NODE_ENV === 'production';

export default defineConfig({
  schema: usePostgreSQL ? './src/lib/db/schema.ts' : './src/lib/db/sqlite-schema.ts',
  out: './src/lib/db/migrations',
  dialect: usePostgreSQL ? 'postgresql' : 'sqlite',
  dbCredentials: usePostgreSQL 
    ? { url: process.env.DATABASE_URL! }
    : { url: 'sqlite.db' },
  verbose: true,
  strict: true,
});
