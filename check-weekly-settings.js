// Simple check to see what data exists in weekly_day_settings table
const { drizzle } = require('drizzle-orm/better-sqlite3');
const Database = require('better-sqlite3');

try {
  const sqlite = new Database('./sqlite.db');
  
  // First, let's check if the table exists and what columns it has
  console.log('📋 Checking weekly_day_settings table structure...');
  
  const tableInfo = sqlite.pragma('table_info(weekly_day_settings)');
  console.log('Table columns:');
  tableInfo.forEach(column => {
    console.log(`  ${column.name} (${column.type}) - ${column.notnull ? 'NOT NULL' : 'NULL'} - Default: ${column.dflt_value}`);
  });
  
  // Check how many records exist
  const countResult = sqlite.prepare('SELECT COUNT(*) as count FROM weekly_day_settings').get();
  console.log(`\n📊 Found ${countResult.count} records in weekly_day_settings table`);
  
  if (countResult.count > 0) {
    // Get all records to see their structure
    const allRecords = sqlite.prepare('SELECT * FROM weekly_day_settings').all();
    
    console.log('\n📝 Existing records:');
    allRecords.forEach((record, index) => {
      console.log(`\nRecord ${index + 1}:`);
      console.log(`  ID: ${record.id}`);
      console.log(`  Week Start: ${record.week_start_date || record.weekStartDate || record.weekStart || 'Unknown'}`);
      
      // Check for different possible column names
      const enabledData = record.enabled_categories || record.enabledCategories || record.enabled_days || record.enabledDays;
      
      if (enabledData) {
        try {
          const parsed = typeof enabledData === 'string' ? JSON.parse(enabledData) : enabledData;
          console.log(`  Data:`, parsed);
          
          // Check format
          if (parsed.sunday && typeof parsed.sunday === 'object') {
            console.log('  ✅ Format: New category-based format');
          } else if (parsed.sunday !== undefined && typeof parsed.sunday === 'boolean') {
            console.log('  📝 Format: Old day-based format');
          } else {
            console.log('  ❓ Format: Unknown');
          }
        } catch (e) {
          console.log(`  Raw data: ${enabledData}`);
          console.log(`  ❌ Could not parse as JSON: ${e.message}`);
        }
      } else {
        console.log('  ❌ No enabled data found');
      }
    });
  }
  
  sqlite.close();
  console.log('\n✅ Database check completed');
  
} catch (error) {
  console.error('❌ Database check failed:', error.message);
  
  if (error.message.includes('no such table')) {
    console.log('\n💡 The weekly_day_settings table does not exist yet.');
    console.log('This is normal for a fresh installation - the table will be created when first used.');
  }
}