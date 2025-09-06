const Database = require('better-sqlite3');
const path = require('path');

// Path to the SQLite database
const dbPath = path.join(process.cwd(), 'sqlite.db');

console.log('Running migration to add enabled_meal_categories column...');

try {
  const db = new Database(dbPath);
  
  // Check if the column already exists
  const tableInfo = db.prepare("PRAGMA table_info(user_settings)").all();
  const hasColumn = tableInfo.some(col => col.name === 'enabled_meal_categories');
  
  if (hasColumn) {
    console.log('Column enabled_meal_categories already exists, skipping migration.');
  } else {
    // Add the new column
    db.exec(`
      ALTER TABLE user_settings 
      ADD COLUMN enabled_meal_categories TEXT DEFAULT '["breakfast","lunch","dinner","snack"]'
    `);
    
    console.log('Successfully added enabled_meal_categories column to user_settings table.');
  }
  
  db.close();
  console.log('Migration completed.');
} catch (error) {
  console.error('Migration failed:', error);
  process.exit(1);
}
