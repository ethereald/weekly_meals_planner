import { db, client } from '@/lib/db';

async function addRoleColumn() {
  try {
    console.log('🔄 Adding role column to users table...');

    // Add role column to users table
    await client.execute('ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT \'user\'');
    
    console.log('✅ Role column added successfully!');

    // Update existing users to have user role
    await client.execute('UPDATE users SET role = \'user\' WHERE role IS NULL OR role = \'\'');
    
    console.log('✅ Updated existing users with default role');

    // Show current users
    console.log('\n📊 Current users in database:');
    const currentUsers = await client.execute('SELECT username, role, created_at FROM users');
    
    currentUsers.rows.forEach((row: any) => {
      console.log(`   - ${row.username} (${row.role}) - Created: ${new Date(row.created_at).toLocaleDateString()}`);
    });

  } catch (error) {
    console.error('❌ Error adding role column:', error);
    
    // If column already exists, that's okay
    if (error instanceof Error && error.message.includes('duplicate column name')) {
      console.log('✅ Role column already exists');
      return;
    }
    
    throw error;
  }
}

// Run the migration
addRoleColumn()
  .then(() => {
    console.log('\n🎉 Migration completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
