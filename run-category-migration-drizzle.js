const { db } = require('./src/lib/db/index.ts');

// Migration script to update weekly_day_settings from day-level to category-level
async function runCategoryLevelMigration() {
  try {
    console.log('Starting category-level migration...');
    
    // First, check if the old table structure exists
    try {
      const testQuery = await db.execute('PRAGMA table_info(weekly_day_settings)');
      console.log('Table structure:', testQuery);
    } catch (error) {
      console.log('Table might not exist yet, creating with new structure...');
    }

    // Step 1: Backup existing data
    console.log('Step 1: Backing up existing data...');
    let existingData = [];
    try {
      existingData = await db.execute('SELECT * FROM weekly_day_settings WHERE enabled_days IS NOT NULL');
      console.log(`Found ${existingData.length} existing records`);
    } catch (error) {
      console.log('No existing data found or table does not exist');
    }

    // Step 2: Drop the table and recreate with new structure
    console.log('Step 2: Recreating table with new structure...');
    
    await db.execute(`DROP TABLE IF EXISTS weekly_day_settings_backup`);
    
    // Create backup table if we have data
    if (existingData.length > 0) {
      await db.execute(`
        CREATE TABLE weekly_day_settings_backup AS 
        SELECT * FROM weekly_day_settings
      `);
    }

    // Drop and recreate the main table
    await db.execute(`DROP TABLE IF EXISTS weekly_day_settings`);
    
    await db.execute(`
      CREATE TABLE weekly_day_settings (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('AB89', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
        week_start_date DATE NOT NULL UNIQUE,
        enabled_categories TEXT NOT NULL DEFAULT '{"sunday":{"breakfast":true,"lunch":true,"dinner":true,"snack":true},"monday":{"breakfast":true,"lunch":true,"dinner":true,"snack":true},"tuesday":{"breakfast":true,"lunch":true,"dinner":true,"snack":true},"wednesday":{"breakfast":true,"lunch":true,"dinner":true,"snack":true},"thursday":{"breakfast":true,"lunch":true,"dinner":true,"snack":true},"friday":{"breakfast":true,"lunch":true,"dinner":true,"snack":true},"saturday":{"breakfast":true,"lunch":true,"dinner":true,"snack":true}}',
        last_updated_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Step 3: Migrate data from backup if it exists
    if (existingData.length > 0) {
      console.log('Step 3: Migrating existing data...');
      
      for (const record of existingData) {
        try {
          // Convert old enabled_days to new enabled_categories format
          const enabledDays = JSON.parse(record.enabled_days || '{}');
          
          const enabledCategories = {};
          const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          
          days.forEach(day => {
            const dayEnabled = enabledDays[day] !== false; // Default to true if undefined
            enabledCategories[day] = {
              breakfast: dayEnabled,
              lunch: dayEnabled,
              dinner: dayEnabled,
              snack: dayEnabled
            };
          });

          // Insert the converted record
          await db.execute(`
            INSERT INTO weekly_day_settings (id, week_start_date, enabled_categories, last_updated_by, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [
            record.id,
            record.week_start_date,
            JSON.stringify(enabledCategories),
            record.last_updated_by,
            record.created_at,
            record.updated_at
          ]);
          
          console.log(`Migrated record for week: ${record.week_start_date}`);
        } catch (error) {
          console.error(`Failed to migrate record for ${record.week_start_date}:`, error);
        }
      }
    }

    console.log('✅ Category-level migration completed successfully!');
    
    // Cleanup backup table
    if (existingData.length > 0) {
      await db.execute(`DROP TABLE IF EXISTS weekly_day_settings_backup`);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run the migration
runCategoryLevelMigration()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });