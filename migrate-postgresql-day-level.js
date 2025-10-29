// PostgreSQL Migration Script for Day-Level Category Control
// This script ensures that when a day is enabled/disabled, it applies to all categories of that day

const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { eq, sql } = require('drizzle-orm');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

// Initialize PostgreSQL connection
const client = postgres(DATABASE_URL, {
  prepare: false,
  max: 10,
});

const db = drizzle(client);

async function createDayLevelFunctions() {
  console.log('🔧 Creating PostgreSQL functions for day-level category control...');

  try {
    // Function to enable/disable all categories for a specific day in a week
    await client`
      CREATE OR REPLACE FUNCTION toggle_day_categories(
        week_start_input DATE,
        day_name TEXT,
        enabled BOOLEAN,
        user_id_input UUID DEFAULT NULL
      ) RETURNS JSONB AS $$
      DECLARE
        current_settings JSONB;
        updated_settings JSONB;
        day_categories JSONB;
      BEGIN
        -- Validate day_name
        IF day_name NOT IN ('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday') THEN
          RAISE EXCEPTION 'Invalid day_name: %', day_name;
        END IF;
        
        -- Get current settings or create default if not exists
        SELECT enabled_categories INTO current_settings
        FROM weekly_day_settings
        WHERE week_start_date = week_start_input;
        
        -- If no record exists, create default settings
        IF current_settings IS NULL THEN
          current_settings := '{
            "sunday": {"breakfast": true, "lunch": true, "dinner": true, "snack": true},
            "monday": {"breakfast": true, "lunch": true, "dinner": true, "snack": true},
            "tuesday": {"breakfast": true, "lunch": true, "dinner": true, "snack": true},
            "wednesday": {"breakfast": true, "lunch": true, "dinner": true, "snack": true},
            "thursday": {"breakfast": true, "lunch": true, "dinner": true, "snack": true},
            "friday": {"breakfast": true, "lunch": true, "dinner": true, "snack": true},
            "saturday": {"breakfast": true, "lunch": true, "dinner": true, "snack": true}
          }'::JSONB;
        END IF;
        
        -- Update the specific day's categories
        day_categories := jsonb_build_object(
          'breakfast', enabled,
          'lunch', enabled,
          'dinner', enabled,
          'snack', enabled
        );
        
        updated_settings := jsonb_set(current_settings, ARRAY[day_name], day_categories);
        
        -- Insert or update the weekly_day_settings record
        INSERT INTO weekly_day_settings (
          week_start_date,
          enabled_categories,
          last_updated_by,
          created_at,
          updated_at
        ) VALUES (
          week_start_input,
          updated_settings,
          user_id_input,
          NOW(),
          NOW()
        )
        ON CONFLICT (week_start_date) 
        DO UPDATE SET
          enabled_categories = updated_settings,
          last_updated_by = user_id_input,
          updated_at = NOW();
        
        RETURN updated_settings;
      END;
      $$ LANGUAGE plpgsql;
    `;

    // Function to check if a day is fully enabled (all categories enabled)
    await client`
      CREATE OR REPLACE FUNCTION is_day_fully_enabled(
        week_start_input DATE,
        day_name TEXT
      ) RETURNS BOOLEAN AS $$
      DECLARE
        day_settings JSONB;
        is_enabled BOOLEAN := TRUE;
      BEGIN
        -- Validate day_name
        IF day_name NOT IN ('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday') THEN
          RETURN FALSE;
        END IF;
        
        -- Get the day's settings
        SELECT enabled_categories->day_name INTO day_settings
        FROM weekly_day_settings
        WHERE week_start_date = week_start_input;
        
        -- If no settings found, assume default (enabled)
        IF day_settings IS NULL THEN
          RETURN TRUE;
        END IF;
        
        -- Check if all categories are enabled for this day
        IF (day_settings->>'breakfast')::BOOLEAN = FALSE THEN is_enabled := FALSE; END IF;
        IF (day_settings->>'lunch')::BOOLEAN = FALSE THEN is_enabled := FALSE; END IF;
        IF (day_settings->>'dinner')::BOOLEAN = FALSE THEN is_enabled := FALSE; END IF;
        IF (day_settings->>'snack')::BOOLEAN = FALSE THEN is_enabled := FALSE; END IF;
        
        RETURN is_enabled;
      END;
      $$ LANGUAGE plpgsql;
    `;

    // Function to get summary of enabled/disabled days for a week
    await client`
      CREATE OR REPLACE FUNCTION get_week_day_summary(
        week_start_input DATE
      ) RETURNS JSONB AS $$
      DECLARE
        settings JSONB;
        summary JSONB := '{}';
        day_name TEXT;
      BEGIN
        -- Get current settings
        SELECT enabled_categories INTO settings
        FROM weekly_day_settings
        WHERE week_start_date = week_start_input;
        
        -- If no settings found, all days are enabled by default
        IF settings IS NULL THEN
          RETURN '{
            "sunday": true,
            "monday": true,
            "tuesday": true,
            "wednesday": true,
            "thursday": true,
            "friday": true,
            "saturday": true
          }'::JSONB;
        END IF;
        
        -- Check each day
        FOR day_name IN SELECT unnest(ARRAY['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']) LOOP
          summary := jsonb_set(
            summary,
            ARRAY[day_name],
            to_jsonb(is_day_fully_enabled(week_start_input, day_name))
          );
        END LOOP;
        
        RETURN summary;
      END;
      $$ LANGUAGE plpgsql;
    `;

    console.log('✅ PostgreSQL functions created successfully');

    // Create an index for better query performance if it doesn't exist
    await client`
      CREATE INDEX IF NOT EXISTS idx_weekly_day_settings_week_start 
      ON weekly_day_settings(week_start_date);
    `;

    await client`
      CREATE INDEX IF NOT EXISTS idx_weekly_day_settings_enabled_categories_gin 
      ON weekly_day_settings USING gin(enabled_categories);
    `;

    console.log('✅ Database indexes ensured');

  } catch (error) {
    console.error('❌ Failed to create PostgreSQL functions:', error);
    throw error;
  }
}

async function testDayLevelFunctions() {
  console.log('🧪 Testing day-level functions...');

  try {
    // Test with next week's date
    const testDate = new Date();
    testDate.setDate(testDate.getDate() + 7);
    const testWeekStart = testDate.toISOString().split('T')[0];

    console.log(`Testing with week start: ${testWeekStart}`);

    // Test 1: Disable Monday (all categories should be disabled)
    console.log('Test 1: Disabling Monday...');
    const result1 = await client`
      SELECT toggle_day_categories(${testWeekStart}::DATE, 'monday', false) as result
    `;
    console.log('Monday disabled result:', result1[0].result.monday);

    // Test 2: Check if Monday is fully enabled (should be false)
    const result2 = await client`
      SELECT is_day_fully_enabled(${testWeekStart}::DATE, 'monday') as is_enabled
    `;
    console.log('Is Monday fully enabled?', result2[0].is_enabled);

    // Test 3: Enable Tuesday (all categories should be enabled)
    console.log('Test 3: Enabling Tuesday...');
    const result3 = await client`
      SELECT toggle_day_categories(${testWeekStart}::DATE, 'tuesday', true) as result
    `;
    console.log('Tuesday enabled result:', result3[0].result.tuesday);

    // Test 4: Get week summary
    console.log('Test 4: Getting week summary...');
    const result4 = await client`
      SELECT get_week_day_summary(${testWeekStart}::DATE) as summary
    `;
    console.log('Week summary:', result4[0].summary);

    // Test 5: Verify the data was saved correctly
    console.log('Test 5: Verifying saved data...');
    const savedData = await client`
      SELECT * FROM weekly_day_settings 
      WHERE week_start_date = ${testWeekStart}
      LIMIT 1
    `;

    if (savedData.length > 0) {
      console.log('Saved settings:', savedData[0].enabled_categories);
    } else {
      console.log('No saved data found');
    }

    console.log('✅ All tests passed successfully');

  } catch (error) {
    console.error('❌ Function tests failed:', error);
    throw error;
  }
}

async function addEnabledCategoriesColumn() {
  console.log('🔧 Ensuring enabled_categories column exists...');
  
  try {
    // Check if enabled_categories column exists
    const columnExists = await client`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'weekly_day_settings' 
      AND column_name = 'enabled_categories'
    `;

    if (columnExists.length === 0) {
      console.log('📝 Adding enabled_categories column...');
      
      // Add the new column with default value
      await client`
        ALTER TABLE weekly_day_settings 
        ADD COLUMN enabled_categories JSONB DEFAULT '{
          "sunday":{"breakfast":true,"lunch":true,"dinner":true,"snack":true},
          "monday":{"breakfast":true,"lunch":true,"dinner":true,"snack":true},
          "tuesday":{"breakfast":true,"lunch":true,"dinner":true,"snack":true},
          "wednesday":{"breakfast":true,"lunch":true,"dinner":true,"snack":true},
          "thursday":{"breakfast":true,"lunch":true,"dinner":true,"snack":true},
          "friday":{"breakfast":true,"lunch":true,"dinner":true,"snack":true},
          "saturday":{"breakfast":true,"lunch":true,"dinner":true,"snack":true}
        }'::JSONB
      `;
      
      console.log('✅ enabled_categories column added');
    } else {
      console.log('✅ enabled_categories column already exists');
    }

  } catch (error) {
    console.error('❌ Failed to add enabled_categories column:', error);
    throw error;
  }
}

async function migrateExistingData() {
  console.log('📋 Checking for existing data that might need migration...');

  try {
    // Get all existing weekly day settings using raw SQL
    const existingSettings = await client`
      SELECT * FROM weekly_day_settings ORDER BY week_start_date
    `;

    console.log(`Found ${existingSettings.length} existing weekly settings records`);

    let migratedCount = 0;
    
    for (const setting of existingSettings) {
      console.log(`\n📝 Processing week ${setting.week_start_date}...`);
      
      // Check if the record has the old format (enabled_days) or new format (enabled_categories)
      const hasOldFormat = setting.enabled_days && !setting.enabled_categories;
      const hasNewFormat = setting.enabled_categories;
      
      if (hasOldFormat) {
        console.log('  🔄 Converting from old enabled_days format...');
        
        // Convert enabled_days to enabled_categories format
        const enabledDays = setting.enabled_days;
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

        console.log(`    Old: ${JSON.stringify(enabledDays)}`);
        console.log(`    New: ${JSON.stringify(enabledCategories)}`);
        
        // Add the new column and update the record
        await client`
          UPDATE weekly_day_settings 
          SET enabled_categories = ${JSON.stringify(enabledCategories)},
              updated_at = NOW()
          WHERE id = ${setting.id}
        `;
        
        migratedCount++;
        console.log('  ✅ Converted to category-based format');
        
      } else if (hasNewFormat) {
        console.log('  ✅ Already using new format');
        
        // Verify the structure has all required days and categories
        const categories = setting.enabled_categories;
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const mealCategories = ['breakfast', 'lunch', 'dinner', 'snack'];
        let needsUpdate = false;
        const updatedCategories = { ...categories };

        for (const day of days) {
          if (!updatedCategories[day] || typeof updatedCategories[day] !== 'object') {
            updatedCategories[day] = { breakfast: true, lunch: true, dinner: true, snack: true };
            needsUpdate = true;
          } else {
            for (const meal of mealCategories) {
              if (typeof updatedCategories[day][meal] !== 'boolean') {
                updatedCategories[day][meal] = true;
                needsUpdate = true;
              }
            }
          }
        }

        if (needsUpdate) {
          await client`
            UPDATE weekly_day_settings 
            SET enabled_categories = ${JSON.stringify(updatedCategories)},
                updated_at = NOW()
            WHERE id = ${setting.id}
          `;
          
          migratedCount++;
          console.log('  ✅ Fixed missing categories/days');
        }
        
      } else {
        console.log('  ⚠️ No enabled_days or enabled_categories found, setting defaults...');
        
        // Update with default structure
        const defaultCategories = {
          sunday: { breakfast: true, lunch: true, dinner: true, snack: true },
          monday: { breakfast: true, lunch: true, dinner: true, snack: true },
          tuesday: { breakfast: true, lunch: true, dinner: true, snack: true },
          wednesday: { breakfast: true, lunch: true, dinner: true, snack: true },
          thursday: { breakfast: true, lunch: true, dinner: true, snack: true },
          friday: { breakfast: true, lunch: true, dinner: true, snack: true },
          saturday: { breakfast: true, lunch: true, dinner: true, snack: true }
        };
        
        await client`
          UPDATE weekly_day_settings 
          SET enabled_categories = ${JSON.stringify(defaultCategories)},
              updated_at = NOW()
          WHERE id = ${setting.id}
        `;
        
        migratedCount++;
        console.log('  ✅ Updated with default category structure');
      }
    }

    console.log(`\n📊 Migration complete: ${migratedCount} records updated`);

  } catch (error) {
    console.error('❌ Data migration failed:', error);
    throw error;
  }
}

async function runMigration() {
  console.log('🚀 Starting PostgreSQL Day-Level Migration...');
  console.log('📍 Target: PostgreSQL with day-level enable/disable for all categories\n');

  try {
    // Step 1: Add enabled_categories column if needed
    await addEnabledCategoriesColumn();
    
    // Step 2: Create the database functions
    await createDayLevelFunctions();
    
    // Step 3: Migrate existing data
    await migrateExistingData();
    
    // Step 4: Test the functions
    await testDayLevelFunctions();

    console.log('\n✅ PostgreSQL Day-Level Migration completed successfully!');
    console.log('\n📌 Summary:');
    console.log('   • Added PostgreSQL functions for day-level category control');
    console.log('   • toggle_day_categories(week_start, day_name, enabled, user_id)');
    console.log('   • is_day_fully_enabled(week_start, day_name)');
    console.log('   • get_week_day_summary(week_start)');
    console.log('   • Ensured all existing data has proper structure');
    console.log('   • Added performance indexes');
    console.log('\n💡 Usage Examples:');
    console.log('   • Disable all Monday categories: SELECT toggle_day_categories(\'2025-10-27\'::DATE, \'monday\', false);');
    console.log('   • Check if Tuesday is enabled: SELECT is_day_fully_enabled(\'2025-10-27\'::DATE, \'tuesday\');');
    console.log('   • Get week summary: SELECT get_week_day_summary(\'2025-10-27\'::DATE);');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the migration
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('\n🎉 All done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runMigration,
  createDayLevelFunctions,
  testDayLevelFunctions,
  migrateExistingData
};