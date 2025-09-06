import * as schema from './schema';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let client: any;

const isProduction = process.env.NODE_ENV === 'production';
const hasDbUrl = Boolean(process.env.DATABASE_URL);

if (isProduction && hasDbUrl) {
  // PostgreSQL for production (only when DATABASE_URL is available)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { drizzle } = require('drizzle-orm/postgres-js');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const postgres = require('postgres');
  client = postgres(process.env.DATABASE_URL, {
    prepare: false,
    max: 10,
  });
  db = drizzle(client, { schema });
} else if (!isProduction) {
  // SQLite for local development only
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { drizzle } = require('drizzle-orm/better-sqlite3');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require('better-sqlite3');
    client = new Database('local.db');
    db = drizzle(client, { schema });
  } catch (error) {
    console.warn('SQLite not available during build, using mock db:', error);
    db = null;
    client = null;
  }
} else {
  // Fallback for build time or when no DATABASE_URL in production
  console.warn('No database configured, using mock db');
  db = null;
  client = null;
}

export { db, client };
export * from './schema';
