const Database = require('better-sqlite3');

try {
  const db = new Database('./sqlite.db');
  
  // Check if users table exists
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").all();
  console.log('Users table exists:', tables.length > 0);
  
  if (tables.length > 0) {
    // Count users
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    console.log('User count:', userCount.count);
    
    // List all users
    const users = db.prepare('SELECT id, username, role, createdAt FROM users').all();
    console.log('Users:', users);
  }
  
  db.close();
} catch (error) {
  console.error('Database error:', error.message);
}
