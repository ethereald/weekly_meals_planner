import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { pgTable, uuid, text, varchar, timestamp } from 'drizzle-orm/pg-core';
import { users } from '../src/lib/db/schema';

// Define the new daily_remarks table
const dailyRemarks = pgTable('daily_remarks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: varchar('date', { length: 10 }).notNull(), // ISO date string (YYYY-MM-DD)
  remark: text('remark').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

async function addDailyRemarksTable() {
  console.log('🚀 Adding daily_remarks table...');

  // Get database connection details from environment
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // Create postgres client
  const sql = postgres(connectionString);
  const db = drizzle(sql);

  try {
    // Create the daily_remarks table
    await sql`
      CREATE TABLE IF NOT EXISTS daily_remarks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date VARCHAR(10) NOT NULL,
        remark TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, date)
      )
    `;

    // Create indexes for better performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_daily_remarks_user_id ON daily_remarks(user_id);
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_daily_remarks_date ON daily_remarks(date);
    `;

    console.log('✅ daily_remarks table created successfully');
    console.log('✅ Indexes created successfully');

  } catch (error) {
    console.error('❌ Error adding daily_remarks table:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  addDailyRemarksTable()
    .then(() => {
      console.log('🎉 Daily remarks table migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

export { addDailyRemarksTable };
