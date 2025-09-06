import { db } from './index';
import { users, userSettings, categories } from './index';
import { eq } from 'drizzle-orm';

// Test database connection
export async function testDatabaseConnection() {
  try {
    if (!db) {
      console.log('ℹ️ Database not configured');
      return false;
    }
    await db.select().from(users).limit(1);
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Seed initial data
export async function seedDatabase() {
  try {
    // Check if categories already exist
    const existingCategories = await db.select().from(categories).limit(1);
    
    if (existingCategories.length === 0) {
      // Insert default categories
      await db.insert(categories).values([
        {
          name: 'Breakfast',
          description: 'Morning meals to start your day',
          color: '#F59E0B',
        },
        {
          name: 'Lunch',
          description: 'Midday meals for sustained energy',
          color: '#10B981',
        },
        {
          name: 'Dinner',
          description: 'Evening meals for the family',
          color: '#3B82F6',
        },
        {
          name: 'Snacks',
          description: 'Quick bites between meals',
          color: '#8B5CF6',
        },
        {
          name: 'Desserts',
          description: 'Sweet treats and desserts',
          color: '#EF4444',
        },
        {
          name: 'Vegetarian',
          description: 'Plant-based meals',
          color: '#059669',
        },
        {
          name: 'Quick & Easy',
          description: 'Meals ready in 30 minutes or less',
          color: '#DC2626',
        },
        {
          name: 'Healthy',
          description: 'Nutritious and balanced meals',
          color: '#16A34A',
        },
      ]);
      
      console.log('✅ Database seeded with default categories');
    } else {
      console.log('ℹ️ Database already contains data, skipping seed');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    return false;
  }
}

// Get user by email

export async function getUserByUsername(username: string) {
  try {
    const user = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return user[0] || null;
  } catch (error) {
    console.error('Error fetching user by username:', error);
    return null;
  }
}

// Get user settings
export async function getUserSettings(userId: string) {
  try {
    const settings = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
    return settings[0] || null;
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return null;
  }
}

// Create default user settings
export async function createDefaultUserSettings(userId: string) {
  try {
    const newSettings = await db.insert(userSettings).values({
      userId,
      dietaryRestrictions: JSON.stringify([]), // Convert array to JSON string for SQLite
      preferredMealTimes: JSON.stringify({
        breakfast: '08:00',
        lunch: '12:00',
        dinner: '18:00'
      }),
      weeklyMealGoal: 21,
      servingSize: 2,
      shoppingDay: 'sunday',
      notificationsEnabled: true,
    }).returning();
    
    return newSettings[0];
  } catch (error) {
    console.error('Error creating default user settings:', error);
    throw error;
  }
}
