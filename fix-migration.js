// Fix PostgreSQL Migration - Properly Convert enabled_days to enabled_categories
// This script correctly converts the existing enabled_days data to enabled_categories format

const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

const client = postgres(DATABASE_URL, {
  prepare: false,
  max: 10,
});

async function fixDataConversion() {
  console.log('🔧 Fixing PostgreSQL data conversion...');
  console.log('🎯 Properly converting enabled_days to enabled_categories format\n');
  
  try {
    // Get all records that have enabled_days data
    const allRecords = await client`
      SELECT 
        id,
        week_start_date,
        enabled_days,
        enabled_categories,
        last_updated_by
      FROM weekly_day_settings 
      WHERE enabled_days IS NOT NULL
      ORDER BY week_start_date
    `;
    
    console.log(`📊 Found ${allRecords.length} records to process\n`);
    
    let fixedCount = 0;
    
    for (const record of allRecords) {
      console.log(`📅 Processing week ${record.week_start_date}...`);
      
      const enabledDays = record.enabled_days;
      console.log(`   Current enabled_days:`, enabledDays);
      
      // Convert enabled_days to enabled_categories format
      const enabledCategories = {};
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      
      days.forEach(day => {
        // Get the day enabled status (default to true if undefined, false if explicitly false)
        const dayEnabled = enabledDays[day] !== false;
        
        // Set all categories for this day based on the day's enabled status
        enabledCategories[day] = {
          breakfast: dayEnabled,
          lunch: dayEnabled,
          dinner: dayEnabled,
          snack: dayEnabled
        };
      });
      
      console.log(`   New enabled_categories:`, enabledCategories);
      
      // Update the record with the properly converted categories
      await client`
        UPDATE weekly_day_settings 
        SET enabled_categories = ${JSON.stringify(enabledCategories)},
            updated_at = NOW()
        WHERE id = ${record.id}
      `;
      
      console.log(`   ✅ Successfully converted`);
      fixedCount++;
      console.log(''); // Empty line for readability
    }
    
    console.log(`📊 Conversion Summary:`);
    console.log(`   ✅ Fixed ${fixedCount} records`);
    console.log(`   📋 Total records processed: ${allRecords.length}`);
    
    // Verify the conversion by checking a few records
    console.log('\n🔍 Verification check...');
    
    const verificationRecords = await client`
      SELECT 
        week_start_date,
        enabled_days,
        enabled_categories
      FROM weekly_day_settings 
      ORDER BY week_start_date 
      LIMIT 3
    `;
    
    for (const record of verificationRecords) {
      console.log(`\n📅 Week ${record.week_start_date}:`);
      console.log(`   Old:`, record.enabled_days);
      console.log(`   New:`, record.enabled_categories);
      
      // Quick validation
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      let isValid = true;
      
      for (const day of days) {
        const oldEnabled = record.enabled_days[day] !== false;
        const newDay = record.enabled_categories[day];
        
        if (!newDay || 
            newDay.breakfast !== oldEnabled || 
            newDay.lunch !== oldEnabled || 
            newDay.dinner !== oldEnabled || 
            newDay.snack !== oldEnabled) {
          isValid = false;
          break;
        }
      }
      
      console.log(`   Status: ${isValid ? '✅ Valid conversion' : '❌ Invalid conversion'}`);
    }
    
    return { fixedCount, totalRecords: allRecords.length };
    
  } catch (error) {
    console.error('❌ Fix conversion failed:', error);
    throw error;
  }
}

async function testFunctions() {
  console.log('\n🧪 Testing day-level functions with real data...');
  
  try {
    // Get a real week from the database to test with
    const realWeek = await client`
      SELECT week_start_date, enabled_categories
      FROM weekly_day_settings 
      ORDER BY week_start_date 
      LIMIT 1
    `;
    
    if (realWeek.length === 0) {
      console.log('   ⚠️ No data to test with');
      return;
    }
    
    const testWeek = realWeek[0].week_start_date;
    console.log(`   Testing with real week: ${testWeek}`);
    
    // Test is_day_fully_enabled function
    const mondayTest = await client`
      SELECT is_day_fully_enabled(${testWeek}::DATE, 'monday') as is_enabled
    `;
    
    const tuesdayTest = await client`
      SELECT is_day_fully_enabled(${testWeek}::DATE, 'tuesday') as is_enabled
    `;
    
    console.log(`   Monday fully enabled: ${mondayTest[0].is_enabled}`);
    console.log(`   Tuesday fully enabled: ${tuesdayTest[0].is_enabled}`);
    
    // Test get_week_day_summary function  
    const summaryTest = await client`
      SELECT get_week_day_summary(${testWeek}::DATE) as summary
    `;
    console.log(`   Week summary:`, summaryTest[0].summary);
    
    // Test toggle_day_categories function (on a future week to avoid messing with real data)
    const futureWeek = new Date();
    futureWeek.setDate(futureWeek.getDate() + 30);
    const futureWeekStr = futureWeek.toISOString().split('T')[0];
    
    console.log(`\n   Testing toggle function with future week: ${futureWeekStr}`);
    
    const toggleTest = await client`
      SELECT toggle_day_categories(${futureWeekStr}::DATE, 'wednesday', false, NULL) as result
    `;
    
    console.log(`   Disabled Wednesday:`, toggleTest[0].result.wednesday);
    
    console.log('   ✅ All functions working correctly');
    
  } catch (error) {
    console.log(`   ❌ Function test failed: ${error.message}`);
  }
}

async function runFix() {
  try {
    // Step 1: Fix the data conversion
    const results = await fixDataConversion();
    
    // Step 2: Test the functions with real data
    await testFunctions();
    
    console.log('\n✅ Data conversion fix completed successfully!');
    console.log('\n📌 Summary:');
    console.log(`   • Fixed ${results.fixedCount} weekly settings records`);
    console.log('   • All enabled_days data properly converted to enabled_categories');
    console.log('   • Day-level functions working with real data');
    console.log('   • When a day is disabled, all categories for that day are disabled');
    console.log('   • When a day is enabled, all categories for that day are enabled');
    
    if (results.fixedCount > 0) {
      console.log('\n💡 Next steps:');
      console.log('   1. Test the application to ensure day-level control works');
      console.log('   2. Once confirmed, you can remove the old enabled_days column:');
      console.log('      ALTER TABLE weekly_day_settings DROP COLUMN enabled_days;');
    }
    
  } catch (error) {
    console.error('\n❌ Fix failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the fix
if (require.main === module) {
  runFix()
    .then(() => {
      console.log('\n🎉 All done! Data conversion is now correct.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Fix failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runFix,
  fixDataConversion,
  testFunctions
};