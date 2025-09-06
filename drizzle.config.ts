import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './src/lib/db/migrations',
  dialect: isProduction ? 'postgresql' : 'sqlite',
  dbCredentials: isProduction 
    ? { url: process.env.DATABASE_URL! }
    : { url: 'sqlite.db' },
  verbose: true,
  strict: true,
});
