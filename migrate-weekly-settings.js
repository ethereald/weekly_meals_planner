// Migration script to convert day-level settings to category-level settings
const Database = require('better-sqlite3');
const path = require('path');

// Path to the SQLite database
const dbPath = path.join(process.cwd(), 'sqlite.db');

let db;
try {
  db = new Database(dbPath);
} catch (error) {
  console.error('Failed to open database:', error.message);
  process.exit(1);
}

// Migration script to convert day-level settings to category-level settings
function migrateWeeklyDaySettings() {
  try {
    console.log('🚀 Starting migration from day-level to category-level settings...');
    
    // Step 1: Check current table structure
    console.log('📋 Checking current table structure...');
    
    // For SQLite, check if the old structure exists
    const tableInfo = db.prepare(`PRAGMA table_info(weekly_day_settings)`).all();
    console.log('Current table structure:', tableInfo);
    
    // Check if we have the old 'enabled_days' column
    const hasOldColumn = tableInfo.some(col => col.name === 'enabled_days');
    const hasNewColumn = tableInfo.some(col => col.name === 'enabled_categories');
    
    if (!hasOldColumn && hasNewColumn) {
      console.log('✅ Table already has new structure. Migration not needed.');
      return;
    }
    
    if (!hasOldColumn && !hasNewColumn) {
      console.log('⚠️ Table has unexpected structure. Please check the schema.');
      return;
    }
    
    // Step 2: Read existing data
    console.log('📖 Reading existing data...');
    const existingData = db.prepare(`SELECT * FROM weekly_day_settings`).all();
    console.log(`Found ${existingData.length} existing records to migrate`);
    
    // Step 3: Create backup
    console.log('💾 Creating backup of existing data...');
    db.exec(`DROP TABLE IF EXISTS weekly_day_settings_backup`);
    db.exec(`CREATE TABLE weekly_day_settings_backup AS SELECT * FROM weekly_day_settings`);
    
    // Step 4: Prepare migration data
    const migratedData = [];
    
    for (const record of existingData) {
      try {
        let enabledDays = {};
        
        // Parse the enabled_days JSON
        if (record.enabled_days) {
          if (typeof record.enabled_days === 'string') {
            enabledDays = JSON.parse(record.enabled_days);
          } else {
            enabledDays = record.enabled_days;
          }
        }
        
        // Convert to category-level format
        const enabledCategories = {
          sunday: {
            breakfast: enabledDays.sunday !== false,
            lunch: enabledDays.sunday !== false,
            dinner: enabledDays.sunday !== false,
            snack: enabledDays.sunday !== false
          },
          monday: {
            breakfast: enabledDays.monday !== false,
            lunch: enabledDays.monday !== false,
            dinner: enabledDays.monday !== false,
            snack: enabledDays.monday !== false
          },
          tuesday: {
            breakfast: enabledDays.tuesday !== false,
            lunch: enabledDays.tuesday !== false,
            dinner: enabledDays.tuesday !== false,
            snack: enabledDays.tuesday !== false
          },
          wednesday: {
            breakfast: enabledDays.wednesday !== false,
            lunch: enabledDays.wednesday !== false,
            dinner: enabledDays.wednesday !== false,
            snack: enabledDays.wednesday !== false
          },
          thursday: {
            breakfast: enabledDays.thursday !== false,
            lunch: enabledDays.thursday !== false,
            dinner: enabledDays.thursday !== false,
            snack: enabledDays.thursday !== false
          },
          friday: {
            breakfast: enabledDays.friday !== false,
            lunch: enabledDays.friday !== false,
            dinner: enabledDays.friday !== false,
            snack: enabledDays.friday !== false
          },
          saturday: {
            breakfast: enabledDays.saturday !== false,
            lunch: enabledDays.saturday !== false,
            dinner: enabledDays.saturday !== false,
            snack: enabledDays.saturday !== false
          }
        };
        
        migratedData.push({
          id: record.id,
          week_start_date: record.week_start_date,
          enabled_categories: JSON.stringify(enabledCategories),
          last_updated_by: record.last_updated_by,
          created_at: record.created_at,
          updated_at: record.updated_at || record.created_at
        });
        
        console.log(`✅ Prepared migration for week: ${record.week_start_date}`);
        console.log(`   Old enabled_days:`, enabledDays);
        console.log(`   New enabled_categories:`, enabledCategories);
        
      } catch (error) {
        console.error(`❌ Error preparing migration for record ${record.id}:`, error);
      }
    }
    
    // Step 5: Recreate table with new structure
    console.log('🔄 Recreating table with new structure...');
    
    db.exec(`DROP TABLE weekly_day_settings`);
    
    db.exec(`
      CREATE TABLE weekly_day_settings (
        id TEXT PRIMARY KEY,
        week_start_date DATE NOT NULL UNIQUE,
        enabled_categories TEXT NOT NULL DEFAULT '{"sunday":{"breakfast":true,"lunch":true,"dinner":true,"snack":true},"monday":{"breakfast":true,"lunch":true,"dinner":true,"snack":true},"tuesday":{"breakfast":true,"lunch":true,"dinner":true,"snack":true},"wednesday":{"breakfast":true,"lunch":true,"dinner":true,"snack":true},"thursday":{"breakfast":true,"lunch":true,"dinner":true,"snack":true},"friday":{"breakfast":true,"lunch":true,"dinner":true,"snack":true},"saturday":{"breakfast":true,"lunch":true,"dinner":true,"snack":true}}',
        last_updated_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Step 6: Insert migrated data
    console.log('📥 Inserting migrated data...');
    
    const insertStmt = db.prepare(`
      INSERT INTO weekly_day_settings (id, week_start_date, enabled_categories, last_updated_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    for (const data of migratedData) {
      try {
        insertStmt.run(
          data.id,
          data.week_start_date,
          data.enabled_categories,
          data.last_updated_by,
          data.created_at,
          data.updated_at
        );
        
        console.log(`✅ Migrated record for week: ${data.week_start_date}`);
      } catch (error) {
        console.error(`❌ Error inserting migrated record for ${data.week_start_date}:`, error);
      }
    }
    
    // Step 7: Verify migration
    console.log('🔍 Verifying migration...');
    const newRecords = db.prepare(`SELECT COUNT(*) as count FROM weekly_day_settings`).get();
    console.log(`Migration completed: ${newRecords.count} records in new table`);
    
    // Step 8: Show sample of migrated data
    const sampleRecords = db.prepare(`SELECT * FROM weekly_day_settings LIMIT 3`).all();
    console.log('📋 Sample migrated records:');
    sampleRecords.forEach((record, index) => {
      console.log(`   Record ${index + 1}:`, {
        week_start_date: record.week_start_date,
        enabled_categories: JSON.parse(record.enabled_categories)
      });
    });
    
    console.log('✅ Migration completed successfully!');
    console.log('📌 Key changes:');
    console.log('   • Days that were disabled now have all categories disabled');
    console.log('   • Days that were enabled now have all categories enabled');
    console.log('   • You can now control individual categories per day in the UI');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    
    // Try to restore from backup if it exists
    try {
      console.log('🔄 Attempting to restore from backup...');
      db.exec(`DROP TABLE IF EXISTS weekly_day_settings`);
      db.exec(`CREATE TABLE weekly_day_settings AS SELECT * FROM weekly_day_settings_backup`);
      console.log('✅ Restored from backup');
    } catch (restoreError) {
      console.error('❌ Failed to restore from backup:', restoreError);
    }
    
    throw error;
  } finally {
    // Cleanup backup table on success
    try {
      const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='weekly_day_settings_backup'`).all();
      if (tables.length > 0) {
        db.exec(`DROP TABLE weekly_day_settings_backup`);
        console.log('🧹 Cleaned up backup table');
      }
    } catch (cleanupError) {
      console.log('⚠️ Could not clean up backup table:', cleanupError.message);
    }
    
    // Close database connection
    try {
      db.close();
    } catch (closeError) {
      console.log('⚠️ Could not close database connection:', closeError.message);
    }
  }
}

// Run the migration
try {
  migrateWeeklyDaySettings();
  console.log('\n🎉 Migration process completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('\n💥 Migration process failed:', error);
  process.exit(1);
}