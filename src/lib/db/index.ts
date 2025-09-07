// Load environment variables first
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Environment-aware schema imports
const usePostgreSQL = process.env.DATABASE_URL?.includes('postgresql://') || process.env.NODE_ENV === 'production';

// Import the appropriate schema based on environment
let schema: any;
if (usePostgreSQL) {
  // Use PostgreSQL schema for production
  schema = require('./schema');
} else {
  // Use SQLite schema for development
  schema = require('./sqlite-schema');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let client: any;

if (usePostgreSQL && process.env.DATABASE_URL) {
  // PostgreSQL for production (when DATABASE_URL is available)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { drizzle } = require('drizzle-orm/postgres-js');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const postgres = require('postgres');
  
  client = postgres(process.env.DATABASE_URL, {
    prepare: false,
    max: 10,
  });
  db = drizzle(client, { schema });
  console.log('PostgreSQL database initialized');
} else if (!usePostgreSQL) {
  // Use SQLite for local development
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
    db = drizzle(client, { schema });
    
    console.log('SQLite database initialized');
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

// Export the appropriate schema based on environment
export const { 
  users, 
  meals, 
  dailyPlannedMeals, 
  categories, 
  ingredients,
  mealIngredients,
  weeklyMealPlans,
  plannedMeals,
  shoppingLists,
  shoppingListItems,
  userSettings,
  nutritionalGoals,
  globalSettings,
  weeklyDaySettings,
  tags,
  mealTags
} = schema;

// Database initialization and health check
export function isDatabaseAvailable(): boolean {
  return db !== null && client !== null;
}

export async function initializeDatabase() {
  if (!isDatabaseAvailable()) {
    throw new Error('Database not available');
  }

  if (!usePostgreSQL) {
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

    if (usePostgreSQL && process.env.DATABASE_URL) {
      // Test PostgreSQL connection
      await client`SELECT 1`;
    } else if (!usePostgreSQL && client) {
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
