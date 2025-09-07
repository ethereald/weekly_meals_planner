// Script to promote the admin user to admin role
const { createClient } = require('@libsql/client');
const path = require('path');

async function promoteAdminUser() {
  try {
    // Use the same database path as the app
    const dbPath = path.join(process.cwd(), 'sqlite.db');
    console.log('Connecting to SQLite database at:', dbPath);
    
    const client = createClient({
      url: `file:${dbPath}`
    });
    
    // Check current users
    const users = await client.execute("SELECT id, username, role FROM users");
    console.log('Current users:', users.rows);
    
    // Update admin user role
    const result = await client.execute(`
      UPDATE users 
      SET role = 'admin', updatedAt = datetime('now') 
      WHERE username = 'admin'
    `);
    
    console.log('Update result:', result);
    
    // Verify the update
    const updatedUsers = await client.execute("SELECT id, username, role FROM users WHERE username = 'admin'");
    console.log('Updated admin user:', updatedUsers.rows);
    
    await client.close();
    console.log('Admin user role updated successfully!');
  } catch (error) {
    console.error('Error updating admin user role:', error);
  }
}

promoteAdminUser();
