// Migration script that works with the existing database connection
// This script mimics what the API would do internally

// First, let's create a simple Node.js script that uses the app's database setup
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { weeklyDaySettings } from './src/lib/db/schema';
import { eq } from 'drizzle-orm';

// Use the same database path as the app
const sqlite = new Database('./sqlite.db');
const db = drizzle(sqlite);

console.log('🚀 Starting migration from day-level to category-level settings...');

async function migrateWeeklySettings() {
  try {
    // Get all existing weekly day settings
    console.log('📋 Fetching existing weekly day settings...');
    const existingSettings = await db.select().from(weeklyDaySettings).all();
    
    console.log(`Found ${existingSettings.length} existing weekly settings records`);
    
    let migratedCount = 0;
    
    for (const setting of existingSettings) {
      console.log(`\n📝 Processing record ID: ${setting.id}, Week: ${setting.weekStart}`);
      
      // Check if this record still uses the old format (has enabledDays)
      if (setting.enabledDays && typeof setting.enabledDays === 'object') {
        console.log('   Found old format (enabledDays):', setting.enabledDays);
        
        // Convert enabledDays to enabledCategories
        const enabledCategories = convertDaysToCategories(setting.enabledDays);
        
        console.log('   Converting to new format:', enabledCategories);
        
        // Update the record with new format
        await db.update(weeklyDaySettings)
          .set({ 
            enabledCategories: enabledCategories,
            enabledDays: null // Clear the old field
          })
          .where(eq(weeklyDaySettings.id, setting.id));
        
        migratedCount++;
        console.log('   ✅ Successfully migrated this record');
        
      } else if (setting.enabledCategories) {
        console.log('   ✅ Already using new format (enabledCategories)');
      } else {
        console.log('   ⚠️ Record has no enabledDays or enabledCategories data');
      }
    }
    
    console.log(`\n🎉 Migration completed!`);
    console.log(`📊 Statistics:`);
    console.log(`   • Total records found: ${existingSettings.length}`);
    console.log(`   • Records migrated: ${migratedCount}`);
    console.log(`   • Records already in new format: ${existingSettings.length - migratedCount}`);
    
    console.log('\n📌 Summary:');
    console.log('   • The application now uses category-level enable/disable');
    console.log('   • Disabled days will have all categories disabled');
    console.log('   • Enabled days will have all categories enabled');
    console.log('   • You can now control individual categories per day in the UI');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    sqlite.close();
  }
}

function convertDaysToCategories(enabledDays) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const categories = {};
  
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
migrateWeeklySettings()
  .then(() => {
    console.log('\n🎉 Migration process completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration process failed:', error);
    process.exit(1);
  });