import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

const client = postgres(connectionString);
const db = drizzle(client);

async function addThemeToUserSettings() {
  try {
    console.log('🎨 Adding theme column to user_settings table...');
    
    // Add theme column to user_settings table
    await client`
      ALTER TABLE user_settings 
      ADD COLUMN IF NOT EXISTS theme varchar(20) DEFAULT 'light'
    `;
    
    console.log('✅ Theme column added successfully!');
    
  } catch (error) {
    console.error('❌ Error adding theme column:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the migration
if (require.main === module) {
  addThemeToUserSettings().catch(console.error);
}

export { addThemeToUserSettings };
