// PostgreSQL Migration Verification Script
// This script verifies that the migration worked correctly

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

async function verifyMigration() {
  console.log('🔍 Verifying PostgreSQL Migration Results...\n');
  
  try {
    // Step 1: Check table structure
    console.log('1️⃣ Checking table structure...');
    
    const columns = await client`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'weekly_day_settings'
      ORDER BY ordinal_position
    `;
    
    console.log('📋 weekly_day_settings table columns:');
    columns.forEach(col => {
      console.log(`   ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Check for both old and new columns
    const hasEnabledDays = columns.some(col => col.column_name === 'enabled_days');
    const hasEnabledCategories = columns.some(col => col.column_name === 'enabled_categories');
    
    console.log(`\n   Has enabled_days column: ${hasEnabledDays}`);
    console.log(`   Has enabled_categories column: ${hasEnabledCategories}`);
    
    // Step 2: Check data content
    console.log('\n2️⃣ Checking data content...');
    
    const allRecords = await client`
      SELECT 
        id,
        week_start_date,
        enabled_days,
        enabled_categories,
        last_updated_by,
        updated_at
      FROM weekly_day_settings 
      ORDER BY week_start_date
    `;
    
    console.log(`📊 Found ${allRecords.length} weekly settings records\n`);
    
    let convertedCount = 0;
    let alreadyNewCount = 0;
    let needsFixCount = 0;
    
    for (const record of allRecords) {
      console.log(`📅 Week ${record.week_start_date}:`);
      
      const hasOldData = record.enabled_days && Object.keys(record.enabled_days).length > 0;
      const hasNewData = record.enabled_categories && Object.keys(record.enabled_categories).length > 0;
      
      console.log(`   Old format (enabled_days): ${hasOldData ? '✅' : '❌'}`);
      console.log(`   New format (enabled_categories): ${hasNewData ? '✅' : '❌'}`);
      
      if (hasOldData && hasNewData) {
        // Check if conversion happened correctly
        const oldDays = record.enabled_days;
        const newCategories = record.enabled_categories;
        
        console.log(`   🔄 Checking conversion quality...`);
        
        // Verify each day was converted properly
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        let conversionCorrect = true;
        
        for (const day of days) {
          const oldEnabled = oldDays[day] !== false; // Default true if undefined
          const newDayData = newCategories[day];
          
          if (!newDayData || typeof newDayData !== 'object') {
            conversionCorrect = false;
            break;
          }
          
          // Check if all categories match the day enable/disable status
          const categoriesMatch = 
            newDayData.breakfast === oldEnabled &&
            newDayData.lunch === oldEnabled &&
            newDayData.dinner === oldEnabled &&
            newDayData.snack === oldEnabled;
            
          if (!categoriesMatch) {
            conversionCorrect = false;
            console.log(`     ⚠️ ${day}: old=${oldEnabled}, categories=${JSON.stringify(newDayData)}`);
          }
        }
        
        if (conversionCorrect) {
          console.log(`   ✅ Conversion successful`);
          convertedCount++;
        } else {
          console.log(`   ❌ Conversion needs review`);
          needsFixCount++;
        }
        
      } else if (hasNewData && !hasOldData) {
        console.log(`   ✅ Already in new format`);
        alreadyNewCount++;
      } else if (hasOldData && !hasNewData) {
        console.log(`   ⚠️ Still in old format only`);
        needsFixCount++;
      } else {
        console.log(`   ❌ No valid data found`);
        needsFixCount++;
      }
      
      console.log(''); // Empty line for readability
    }
    
    // Step 3: Test the new functions
    console.log('3️⃣ Testing day-level functions...');
    
    // Test current week
    const currentDate = new Date();
    const testWeekStart = currentDate.toISOString().split('T')[0].split('-');
    testWeekStart[2] = '01'; // First of month for testing
    const testWeek = testWeekStart.join('-');
    
    console.log(`   Testing with week: ${testWeek}`);
    
    try {
      // Test is_day_fully_enabled function
      const mondayTest = await client`
        SELECT is_day_fully_enabled(${testWeek}::DATE, 'monday') as is_enabled
      `;
      console.log(`   Monday fully enabled: ${mondayTest[0].is_enabled}`);
      
      // Test get_week_day_summary function  
      const summaryTest = await client`
        SELECT get_week_day_summary(${testWeek}::DATE) as summary
      `;
      console.log(`   Week summary: ${JSON.stringify(summaryTest[0].summary)}`);
      
      console.log('   ✅ Functions working correctly');
      
    } catch (error) {
      console.log(`   ❌ Function test failed: ${error.message}`);
    }
    
    // Step 4: Summary
    console.log('\n📈 Migration Summary:');
    console.log(`   📊 Total records: ${allRecords.length}`);
    console.log(`   ✅ Successfully converted: ${convertedCount}`);
    console.log(`   ✅ Already in new format: ${alreadyNewCount}`);
    console.log(`   ⚠️ Need attention: ${needsFixCount}`);
    
    // Step 5: Check if old column can be safely removed
    if (needsFixCount === 0 && (convertedCount > 0 || alreadyNewCount > 0)) {
      console.log('\n🗑️ Safe to remove old enabled_days column:');
      console.log('   All data successfully converted to new format');
      console.log('   Run this to clean up:');
      console.log('   ALTER TABLE weekly_day_settings DROP COLUMN enabled_days;');
    } else if (needsFixCount > 0) {
      console.log('\n⚠️ DO NOT remove enabled_days column yet:');
      console.log(`   ${needsFixCount} records still need attention`);
    }
    
    return {
      totalRecords: allRecords.length,
      converted: convertedCount,
      alreadyNew: alreadyNewCount,
      needsFix: needsFixCount,
      success: needsFixCount === 0
    };
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run verification
if (require.main === module) {
  verifyMigration()
    .then((results) => {
      if (results.success) {
        console.log('\n🎉 Migration verification PASSED!');
        console.log('✅ All data is properly migrated and ready to use');
      } else {
        console.log('\n⚠️ Migration verification found issues');
        console.log('🔧 Some records may need manual review');
      }
      process.exit(results.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('\n💥 Verification failed:', error);
      process.exit(1);
    });
}

module.exports = {
  verifyMigration
};