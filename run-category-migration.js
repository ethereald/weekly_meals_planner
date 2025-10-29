const fs = require('fs');
const path = require('path');

async function runCategoryLevelMigration() {
  try {
    // Check if we're using PostgreSQL or SQLite
    const isPostgreSQL = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('postgres');
    
    if (isPostgreSQL) {
      // PostgreSQL migration using drizzle
      const { db } = require('../src/lib/db');
      const migrationSQL = fs.readFileSync(path.join(__dirname, '../migrations/add_category_level_settings.sql'), 'utf8');
      
      console.log('Running category-level migration for PostgreSQL...');
      await db.execute(migrationSQL);
      console.log('✅ Category-level migration completed successfully for PostgreSQL');
    } else {
      // SQLite migration
      const Database = require('better-sqlite3');
      const dbPath = path.join(process.cwd(), 'sqlite.db');
      const db = new Database(dbPath);
      
      console.log('Running category-level migration for SQLite...');
      
      // SQLite version of the migration (adapted syntax)
      const sqliteQueries = [
        `-- Add the new enabled_categories column
        ALTER TABLE weekly_day_settings 
        ADD COLUMN enabled_categories TEXT DEFAULT '{
          "sunday":{"breakfast":true,"lunch":true,"dinner":true,"snack":true},
          "monday":{"breakfast":true,"lunch":true,"dinner":true,"snack":true},
          "tuesday":{"breakfast":true,"lunch":true,"dinner":true,"snack":true},
          "wednesday":{"breakfast":true,"lunch":true,"dinner":true,"snack":true},
          "thursday":{"breakfast":true,"lunch":true,"dinner":true,"snack":true},
          "friday":{"breakfast":true,"lunch":true,"dinner":true,"snack":true},
          "saturday":{"breakfast":true,"lunch":true,"dinner":true,"snack":true}
        }'`,
        
        `-- Create a temporary table with the new structure
        CREATE TABLE weekly_day_settings_new (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('AB89', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
          week_start_date DATE NOT NULL UNIQUE,
          enabled_categories TEXT NOT NULL,
          last_updated_by TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        `-- Migrate existing data to the new structure
        INSERT INTO weekly_day_settings_new (id, week_start_date, enabled_categories, last_updated_by, created_at, updated_at)
        SELECT 
          id,
          week_start_date,
          CASE 
            WHEN enabled_days IS NOT NULL THEN
              json_object(
                'sunday', CASE WHEN json_extract(enabled_days, '$.sunday') = 1 OR json_extract(enabled_days, '$.sunday') = 'true' THEN json('{"breakfast":true,"lunch":true,"dinner":true,"snack":true}') ELSE json('{"breakfast":false,"lunch":false,"dinner":false,"snack":false}') END,
                'monday', CASE WHEN json_extract(enabled_days, '$.monday') = 1 OR json_extract(enabled_days, '$.monday') = 'true' THEN json('{"breakfast":true,"lunch":true,"dinner":true,"snack":true}') ELSE json('{"breakfast":false,"lunch":false,"dinner":false,"snack":false}') END,
                'tuesday', CASE WHEN json_extract(enabled_days, '$.tuesday') = 1 OR json_extract(enabled_days, '$.tuesday') = 'true' THEN json('{"breakfast":true,"lunch":true,"dinner":true,"snack":true}') ELSE json('{"breakfast":false,"lunch":false,"dinner":false,"snack":false}') END,
                'wednesday', CASE WHEN json_extract(enabled_days, '$.wednesday') = 1 OR json_extract(enabled_days, '$.wednesday') = 'true' THEN json('{"breakfast":true,"lunch":true,"dinner":true,"snack":true}') ELSE json('{"breakfast":false,"lunch":false,"dinner":false,"snack":false}') END,
                'thursday', CASE WHEN json_extract(enabled_days, '$.thursday') = 1 OR json_extract(enabled_days, '$.thursday') = 'true' THEN json('{"breakfast":true,"lunch":true,"dinner":true,"snack":true}') ELSE json('{"breakfast":false,"lunch":false,"dinner":false,"snack":false}') END,
                'friday', CASE WHEN json_extract(enabled_days, '$.friday') = 1 OR json_extract(enabled_days, '$.friday') = 'true' THEN json('{"breakfast":true,"lunch":true,"dinner":true,"snack":true}') ELSE json('{"breakfast":false,"lunch":false,"dinner":false,"snack":false}') END,
                'saturday', CASE WHEN json_extract(enabled_days, '$.saturday') = 1 OR json_extract(enabled_days, '$.saturday') = 'true' THEN json('{"breakfast":true,"lunch":true,"dinner":true,"snack":true}') ELSE json('{"breakfast":false,"lunch":false,"dinner":false,"snack":false}') END
              )
            ELSE '{"sunday":{"breakfast":true,"lunch":true,"dinner":true,"snack":true},"monday":{"breakfast":true,"lunch":true,"dinner":true,"snack":true},"tuesday":{"breakfast":true,"lunch":true,"dinner":true,"snack":true},"wednesday":{"breakfast":true,"lunch":true,"dinner":true,"snack":true},"thursday":{"breakfast":true,"lunch":true,"dinner":true,"snack":true},"friday":{"breakfast":true,"lunch":true,"dinner":true,"snack":true},"saturday":{"breakfast":true,"lunch":true,"dinner":true,"snack":true}}'
          END,
          last_updated_by,
          created_at,
          updated_at
        FROM weekly_day_settings`,
        
        `-- Drop the old table
        DROP TABLE weekly_day_settings`,
        
        `-- Rename the new table
        ALTER TABLE weekly_day_settings_new RENAME TO weekly_day_settings`
      ];
      
      // Execute each query
      const transaction = db.transaction(() => {
        for (const query of sqliteQueries) {
          try {
            db.exec(query);
          } catch (error) {
            if (error.message.includes('duplicate column name') || error.message.includes('already exists')) {
              console.log('Column already exists, skipping...');
            } else {
              throw error;
            }
          }
        }
      });
      
      transaction();
      db.close();
      
      console.log('✅ Category-level migration completed successfully for SQLite');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runCategoryLevelMigration();