import { db } from '../src/lib/db/sqlite.js';

console.log('Running migration to add enabled_meal_categories column...');

try {
  // Add the new column using raw SQL
  await db.run(`
    ALTER TABLE user_settings 
    ADD COLUMN enabled_meal_categories TEXT DEFAULT '["breakfast","lunch","dinner","snack"]'
  `);
  
  console.log('Successfully added enabled_meal_categories column to user_settings table.');
  
  // Update existing records to have the default value
  await db.run(`
    UPDATE user_settings 
    SET enabled_meal_categories = '["breakfast","lunch","dinner","snack"]' 
    WHERE enabled_meal_categories IS NULL
  `);
  
  console.log('Updated existing user settings with default meal categories.');
  console.log('Migration completed successfully.');
} catch (error) {
  if (error.message.includes('duplicate column name')) {
    console.log('Column enabled_meal_categories already exists, skipping migration.');
  } else {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}
