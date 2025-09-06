#!/usr/bin/env tsx
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
  
  // Close the connection
  await client.end();
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
