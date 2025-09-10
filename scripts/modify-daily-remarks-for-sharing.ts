import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

async function modifyDailyRemarksTable() {
  try {
    console.log('Modifying daily_remarks table for shared remarks...');

    // First, remove the old unique constraint on (user_id, date)
    await client`
      ALTER TABLE daily_remarks 
      DROP CONSTRAINT IF EXISTS daily_remarks_user_id_date_unique
    `;
    console.log('✓ Removed old unique constraint on (user_id, date)');

    // Add new unique constraint on just date (one remark per day for all users)
    await client`
      ALTER TABLE daily_remarks 
      ADD CONSTRAINT daily_remarks_date_unique UNIQUE (date)
    `;
    console.log('✓ Added unique constraint on date');

    // Add a column to track who last modified the remark
    await client`
      ALTER TABLE daily_remarks 
      ADD COLUMN IF NOT EXISTS last_modified_by uuid REFERENCES users(id) ON DELETE SET NULL
    `;
    console.log('✓ Added last_modified_by column');

    // Update existing records to set last_modified_by to the user_id
    await client`
      UPDATE daily_remarks 
      SET last_modified_by = user_id 
      WHERE last_modified_by IS NULL
    `;
    console.log('✓ Updated existing records with last_modified_by');

    // Remove duplicate records, keeping only the most recent one per date
    await client`
      DELETE FROM daily_remarks 
      WHERE id NOT IN (
        SELECT DISTINCT ON (date) id 
        FROM daily_remarks 
        ORDER BY date, updated_at DESC
      )
    `;
    console.log('✓ Removed duplicate records per date');

    console.log('✅ Daily remarks table successfully modified for shared remarks!');
    
  } catch (error) {
    console.error('❌ Error modifying daily_remarks table:', error);
    throw error;
  } finally {
    await client.end();
  }
}

modifyDailyRemarksTable()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
