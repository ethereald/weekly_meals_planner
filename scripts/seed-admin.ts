import { db, users } from '@/lib/db';
import { createAdminUser } from '@/lib/admin';
import { eq } from 'drizzle-orm';

async function seedAdminUser() {
  try {
    console.log('🌱 Starting admin user seeding...');

    // Add role column to existing users if they don't have it
    console.log('📝 Updating existing users to have default role...');
    
    try {
      // Get all users
      const allUsers = await db.select().from(users);
      
      for (const user of allUsers) {
        // Check if user has role field (might be null/undefined in old schema)
        if (!user.role) {
          await db.update(users)
            .set({ 
              role: 'user',
              updatedAt: new Date().toISOString()
            })
            .where(eq(users.id, user.id));
          console.log(`✅ Updated user ${user.username} with default role`);
        }
      }
    } catch (error) {
      console.log('⚠️  Note: Some users might already have role field');
    }

    // Create admin user
    console.log('👑 Creating admin user...');
    const adminCreated = await createAdminUser();
    
    if (adminCreated) {
      console.log('✅ Admin user setup completed successfully!');
      console.log('🔑 Default admin credentials:');
      console.log('   Username: admin');
      console.log('   Password: admin123');
      console.log('⚠️  Please change the admin password after first login!');
    } else {
      console.log('❌ Failed to create admin user');
    }

    // Show current users
    console.log('\n📊 Current users in database:');
    const currentUsers = await db.select({
      username: users.username,
      role: users.role,
      createdAt: users.createdAt
    }).from(users);
    
    currentUsers.forEach((user: { username: string; role: string | null; createdAt: string }) => {
      console.log(`   - ${user.username} (${user.role || 'user'}) - Created: ${new Date(user.createdAt).toLocaleDateString()}`);
    });

  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedAdminUser()
  .then(() => {
    console.log('\n🎉 Seeding completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
