const { Client } = require('pg');
const fs = require('fs');

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    const migrationSQL = fs.readFileSync('migrations/add_global_settings.sql', 'utf8');
    console.log('Running global settings migration...');
    console.log(migrationSQL);

    await client.query(migrationSQL);
    console.log('Global settings migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
}

runMigration();
