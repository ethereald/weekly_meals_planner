#!/usr/bin/env tsx
import * as dotenv from 'dotenv';

// Load environment variables first
dotenv.config({ path: '.env.local' });

import { testDatabaseConnection, seedDatabase } from './utils';
import { client } from './index';

async function main() {
  console.log('🌱 Starting database seeding...');
  
  // Test connection first
  const connectionOk = await testDatabaseConnection();
  if (!connectionOk) {
    console.error('❌ Could not connect to database. Please check your DATABASE_URL.');
    process.exit(1);
  }
  
  // Seed the database
  const seedOk = await seedDatabase();
  if (!seedOk) {
    console.error('❌ Database seeding failed.');
    process.exit(1);
  }
  
  console.log('✅ Database seeding completed successfully!');
  
  // Close the connection properly based on database type
  try {
    if (client && typeof client.end === 'function') {
      // PostgreSQL client
      await client.end();
    } else if (client && typeof client.close === 'function') {
      // SQLite client
      await client.close();
    }
  } catch (error) {
    console.warn('Warning: Could not close database connection:', error);
  }
  
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
