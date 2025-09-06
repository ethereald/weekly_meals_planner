import { db } from './db';
import { users } from './db/sqlite-schema';
import { hashPassword } from './auth';

async function createTestUser() {
  try {
    console.log('Creating test user...');
    
    const hashedPassword = await hashPassword('testpass123');
    
    const newUser = await db.insert(users).values({
      username: 'testuser',
      password: hashedPassword,
    }).returning();
    
    console.log('Test user created:', newUser[0]);
    console.log('You can now login with:');
    console.log('Username: testuser');
    console.log('Password: testpass123');
  } catch (error) {
    console.error('Error creating test user:', error);
  }
}

createTestUser();
