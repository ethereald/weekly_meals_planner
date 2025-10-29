// Direct database migration using drizzle ORM
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { weeklyDaySettings } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('🚀 Starting direct database migration...');
  
  let sqlite: Database.Database;
  let db: any;
  
  try {
    // Try to connect to the SQLite database
    sqlite = new Database('./sqlite.db');
    db = drizzle(sqlite);
    
    console.log('✅ Database connection established');
    
    // First, let's see what tables exist
    const tables = sqlite.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `).all();
    
    console.log('📋 Available tables:');
    tables.forEach((table: any) => {
      console.log(`  - ${table.name}`);
    });
    
    // Check if weekly_day_settings table exists
    const weeklyTableExists = tables.some((t: any) => t.name === 'weekly_day_settings');
    
    if (!weeklyTableExists) {
      console.log('❌ weekly_day_settings table does not exist');
      console.log('💡 This might be a fresh installation or using PostgreSQL in production');
      return;
    }
    
    // Check the structure of the weekly_day_settings table
    const tableInfo = sqlite.prepare('PRAGMA table_info(weekly_day_settings)').all();
    console.log('\n📋 weekly_day_settings table structure:');
    tableInfo.forEach((column: any) => {
      console.log(`  ${column.name} (${column.type}) - ${column.notnull ? 'NOT NULL' : 'NULL'}`);
    });
    
    // Get all records from weekly_day_settings
    const allRecords = sqlite.prepare('SELECT * FROM weekly_day_settings').all();
    console.log(`\n📊 Found ${allRecords.length} records in weekly_day_settings`);
    
    if (allRecords.length === 0) {
      console.log('💡 No existing records found. This is normal for a fresh installation.');
      console.log('✅ No migration needed - new records will use the correct format.');
      return;
    }
    
    let migratedCount = 0;
    
    for (const record of allRecords) {
      console.log(`\n📝 Processing record:`, record);
      
      // Check what columns this record has
      const hasEnabledDays = 'enabled_days' in record || 'enabledDays' in record;
      const hasEnabledCategories = 'enabled_categories' in record || 'enabledCategories' in record;
      
      console.log(`  Has enabled_days: ${hasEnabledDays}`);
      console.log(`  Has enabled_categories: ${hasEnabledCategories}`);
      
      if (hasEnabledDays && !hasEnabledCategories) {
        console.log('  🔄 Needs migration from day-based to category-based format');
        
        const enabledDaysData = record.enabled_days || record.enabledDays;
        let enabledDays;
        
        try {
          enabledDays = typeof enabledDaysData === 'string' ? JSON.parse(enabledDaysData) : enabledDaysData;
        } catch (e) {
          console.log(`  ❌ Could not parse enabled_days data: ${e.message}`);
          continue;
        }
        
        console.log('  Old format:', enabledDays);
        
        // Convert to new format
        const enabledCategories = convertDaysToCategories(enabledDays);
        console.log('  New format:', enabledCategories);
        
        // Update the record
        try {
          const updateQuery = `
            UPDATE weekly_day_settings 
            SET enabled_categories = ?, enabled_days = NULL, updated_at = datetime('now')
            WHERE id = ?
          `;
          
          sqlite.prepare(updateQuery).run(JSON.stringify(enabledCategories), record.id);
          
          migratedCount++;
          console.log('  ✅ Successfully migrated');
          
        } catch (updateError) {
          console.log(`  ❌ Failed to update record: ${updateError.message}`);
        }
        
      } else if (hasEnabledCategories) {
        console.log('  ✅ Already in correct format');
      } else {
        console.log('  ⚠️ Record has unexpected format');
      }
    }
    
    console.log(`\n🎉 Migration completed!`);
    console.log(`📊 Statistics:`);
    console.log(`  • Total records: ${allRecords.length}`);
    console.log(`  • Migrated records: ${migratedCount}`);
    console.log(`  • Already correct: ${allRecords.length - migratedCount}`);
    
    if (migratedCount > 0) {
      console.log('\n✅ Your weekly settings have been restored!');
      console.log('📄 Refresh your browser to see the restored settings.');
    } else {
      console.log('\n💡 No migration was needed.');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    
    if (error.message.includes('better_sqlite3.node')) {
      console.log('\n💡 SQLite bindings issue detected.');
      console.log('📝 Alternative solution: Use the browser-based migration script.');
      console.log('   1. Login to your application');
      console.log('   2. Open browser console (F12)');
      console.log('   3. Copy and paste the contents of browser-migration.js');
      console.log('   4. Run: migrateLostWeeklySettings()');
    }
    
  } finally {
    if (sqlite) {
      sqlite.close();
    }
  }
}

function convertDaysToCategories(enabledDays: any) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const categories: any = {};
  
  days.forEach(day => {
    const dayEnabled = enabledDays[day] !== false; // Default to true if undefined
    categories[day] = {
      breakfast: dayEnabled,
      lunch: dayEnabled,
      dinner: dayEnabled,
      snack: dayEnabled
    };
  });
  
  return categories;
}

// Run the migration
main().catch(console.error);