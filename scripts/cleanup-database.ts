import { db } from '../src/lib/db';
import * as schema from '../src/lib/db/sqlite-schema';

async function cleanupDatabase() {
  try {
    if (!db) {
      console.error('Database not available');
      return;
    }

    console.log('Starting database cleanup...');

    // Delete in order to respect foreign key constraints
    await db.delete(schema.shoppingListItems);
    console.log('✓ Cleaned shopping list items');

    await db.delete(schema.shoppingLists);
    console.log('✓ Cleaned shopping lists');

    await db.delete(schema.dailyPlannedMeals);
    console.log('✓ Cleaned daily planned meals');

    await db.delete(schema.plannedMeals);
    console.log('✓ Cleaned planned meals');

    await db.delete(schema.weeklyMealPlans);
    console.log('✓ Cleaned weekly meal plans');

    await db.delete(schema.mealIngredients);
    console.log('✓ Cleaned meal ingredients');

    await db.delete(schema.meals);
    console.log('✓ Cleaned meals');

    await db.delete(schema.ingredients);
    console.log('✓ Cleaned ingredients');

    await db.delete(schema.categories);
    console.log('✓ Cleaned categories');

    await db.delete(schema.nutritionalGoals);
    console.log('✓ Cleaned nutritional goals');

    await db.delete(schema.userSettings);
    console.log('✓ Cleaned user settings');

    console.log('✅ Database cleanup completed successfully!');
    console.log('📝 Users table was preserved');

  } catch (error) {
    console.error('❌ Database cleanup failed:', error);
  }
}

// Run cleanup if this script is executed directly
if (require.main === module) {
  cleanupDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error during cleanup:', error);
      process.exit(1);
    });
}

export { cleanupDatabase };
