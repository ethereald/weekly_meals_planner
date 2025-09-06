import * as sqliteSchema from './sqlite-schema';

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
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const schema = require('./schema');
  client = postgres(process.env.DATABASE_URL, {
    prepare: false,
    max: 10,
  });
  db = drizzle(client, { schema });
} else if (!isProduction) {
  // SQLite for local development only
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { drizzle } = require('drizzle-orm/libsql');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createClient } = require('@libsql/client');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path');
    
    // Use absolute path to avoid issues
    const dbPath = path.join(process.cwd(), 'sqlite.db');
    console.log('Initializing SQLite database at:', dbPath);
    
    client = createClient({
      url: `file:${dbPath}`
    });
    db = drizzle(client, { schema: sqliteSchema });
    
    console.log('SQLite database initialized successfully');
  } catch (error) {
    console.error('SQLite initialization failed:', error);
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

// For development, export SQLite schema
export * from './sqlite-schema';

// Database initialization and health check
export function isDatabaseAvailable(): boolean {
  return db !== null && client !== null;
}

export async function initializeDatabase() {
  if (!isDatabaseAvailable()) {
    throw new Error('Database not available');
  }

  if (!isProduction) {
    // For SQLite, we might need to create tables
    console.log('Database initialization complete');
  }
  
  return true;
}

// Check database connection
export async function checkDatabaseHealth() {
  try {
    if (!isDatabaseAvailable()) {
      return { status: 'unavailable', error: 'Database not configured' };
    }

    if (isProduction && hasDbUrl) {
      // Test PostgreSQL connection
      await client`SELECT 1`;
    } else if (!isProduction && client) {
      // Test SQLite connection with libsql
      await client.execute('SELECT 1');
    }

    return { status: 'healthy' };
  } catch (error) {
    return { 
      status: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
