import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { hashPassword } from '@/lib/auth';

export const ADMIN_ROLE = 'admin';
export const USER_ROLE = 'user';

// Function to check if a user has admin privileges
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    return user.length > 0 && user[0].role === ADMIN_ROLE;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// Function to check if a user has admin privileges by username
export async function isAdminByUsername(username: string): Promise<boolean> {
  try {
    const user = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return user.length > 0 && user[0].role === ADMIN_ROLE;
  } catch (error) {
    console.error('Error checking admin status by username:', error);
    return false;
  }
}

// Function to create the default admin user
export async function createAdminUser(): Promise<boolean> {
  try {
    // Check if admin user already exists
    const existingAdmin = await db.select().from(users).where(eq(users.username, 'admin')).limit(1);
    
    if (existingAdmin.length > 0) {
      // If admin exists but doesn't have admin role, update it
      if (existingAdmin[0].role !== ADMIN_ROLE) {
        await db.update(users)
          .set({ role: ADMIN_ROLE, updatedAt: new Date() })
          .where(eq(users.id, existingAdmin[0].id));
        console.log('Updated existing admin user role');
      } else {
        console.log('Admin user already exists with correct role');
      }
      return true;
    }

    // Create new admin user
    const hashedPassword = await hashPassword('admin123'); // Default password
    
    await db.insert(users).values({
      username: 'admin',
      password: hashedPassword,
      role: ADMIN_ROLE,
    });
    
    console.log('Created default admin user (username: admin, password: admin123)');
    return true;
  } catch (error) {
    console.error('Error creating admin user:', error);
    return false;
  }
}

// Function to get user by ID with role information
export async function getUserWithRole(userId: string) {
  try {
    const user = await db.select({
      id: users.id,
      username: users.username,
      role: users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    }).from(users).where(eq(users.id, userId)).limit(1);
    
    return user.length > 0 ? user[0] : null;
  } catch (error) {
    console.error('Error getting user with role:', error);
    return null;
  }
}

// Function to promote a user to admin
export async function promoteToAdmin(userId: string): Promise<boolean> {
  try {
    await db.update(users)
      .set({ role: ADMIN_ROLE, updatedAt: new Date() })
      .where(eq(users.id, userId));
    return true;
  } catch (error) {
    console.error('Error promoting user to admin:', error);
    return false;
  }
}

// Function to demote an admin to regular user
export async function demoteFromAdmin(userId: string): Promise<boolean> {
  try {
    await db.update(users)
      .set({ role: USER_ROLE, updatedAt: new Date() })
      .where(eq(users.id, userId));
    return true;
  } catch (error) {
    console.error('Error demoting user from admin:', error);
    return false;
  }
}
