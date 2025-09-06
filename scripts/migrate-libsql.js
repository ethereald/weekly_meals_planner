const { createClient } = require('@libsql/client');
const path = require('path');

console.log('Running migration to add enabled_meal_categories column...');

async function runMigration() {
  try {
    // Use the same database path as the app
    const dbPath = path.join(process.cwd(), 'sqlite.db');
    console.log('Connecting to SQLite database at:', dbPath);
    
    const client = createClient({
      url: `file:${dbPath}`
    });
    
    // Check if the column already exists
    const tableInfo = await client.execute("PRAGMA table_info(user_settings)");
    const hasColumn = tableInfo.rows.some(row => row[1] === 'enabled_meal_categories');
    
    if (hasColumn) {
      console.log('Column enabled_meal_categories already exists, skipping migration.');
    } else {
      // Add the new column
      await client.execute(`
        ALTER TABLE user_settings 
        ADD COLUMN enabled_meal_categories TEXT DEFAULT '["breakfast","lunch","dinner","snack"]'
      `);
      
      console.log('Successfully added enabled_meal_categories column to user_settings table.');
      
      // Update existing records to have the default value
      await client.execute(`
        UPDATE user_settings 
        SET enabled_meal_categories = '["breakfast","lunch","dinner","snack"]' 
        WHERE enabled_meal_categories IS NULL
      `);
      
      console.log('Updated existing user settings with default meal categories.');
    }
    
    await client.close();
    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
