import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { db, meals, dailyPlannedMeals, users, tags, mealTags } from '@/lib/db';
import { eq, and, gte, lte } from 'drizzle-orm';

async function getHandler(request: AuthenticatedRequest) {
  try {
    const userId = request.user!.userId;
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const userOnly = searchParams.get('userOnly'); // New parameter to get only current user's meals
    
    if (date) {
      // Get planned meals for a specific date from ALL users with creator info
      const plannedMealsData = await db
        .select({
          id: dailyPlannedMeals.id,
          mealId: dailyPlannedMeals.mealId,
          plannedDate: dailyPlannedMeals.plannedDate,
          mealSlot: dailyPlannedMeals.mealSlot,
          servings: dailyPlannedMeals.servings,
          notes: dailyPlannedMeals.notes,
          meal: meals,
          creator: {
            userId: users.id,
            username: users.username
          }
        })
        .from(dailyPlannedMeals)
        .innerJoin(meals, eq(dailyPlannedMeals.mealId, meals.id))
        .innerJoin(users, eq(meals.userId, users.id))
        .where(eq(dailyPlannedMeals.plannedDate, date));

      return NextResponse.json({ meals: plannedMealsData });
    } else if (startDate && endDate) {
      // Get planned meals for a date range from ALL users with creator info
      const plannedMealsData = await db
        .select({
          id: dailyPlannedMeals.id,
          mealId: dailyPlannedMeals.mealId,
          plannedDate: dailyPlannedMeals.plannedDate,
          mealSlot: dailyPlannedMeals.mealSlot,
          servings: dailyPlannedMeals.servings,
          notes: dailyPlannedMeals.notes,
          meal: meals,
          creator: {
            userId: users.id,
            username: users.username
          }
        })
        .from(dailyPlannedMeals)
        .innerJoin(meals, eq(dailyPlannedMeals.mealId, meals.id))
        .innerJoin(users, eq(meals.userId, users.id))
        .where(
          and(
            gte(dailyPlannedMeals.plannedDate, startDate),
            lte(dailyPlannedMeals.plannedDate, endDate)
          )
        );

      return NextResponse.json({ meals: plannedMealsData });
    } else {
      if (userOnly === 'true') {
        // Get only current user's meals with tags (for saved meals dropdown)
        const userMeals = await db
          .select({
            id: meals.id,
            userId: meals.userId,
            name: meals.name,
            description: meals.description,
            calories: meals.calories,
            cookTime: meals.cookTime,
            createdAt: meals.createdAt,
            updatedAt: meals.updatedAt,
          })
          .from(meals)
          .where(eq(meals.userId, userId));

        // Get tags for each meal
        const mealsWithTags = await Promise.all(
          userMeals.map(async (meal: any) => {
            const mealTagsData = await db
              .select({
                id: tags.id,
                name: tags.name,
                color: tags.color,
              })
              .from(mealTags)
              .innerJoin(tags, eq(mealTags.tagId, tags.id))
              .where(eq(mealTags.mealId, meal.id));

            return {
              ...meal,
              tags: mealTagsData,
            };
          })
        );

        return NextResponse.json({ meals: mealsWithTags });
      } else {
        // Get all meals from ALL users (for general meal library)
        const allMeals = await db
          .select()
          .from(meals);

        return NextResponse.json({ meals: allMeals });
      }
    }
  } catch (error) {
    console.error('Error fetching meals:', error);
    return NextResponse.json({ error: 'Failed to fetch meals' }, { status: 500 });
  }
}

async function postHandler(request: AuthenticatedRequest) {
  try {
    const userId = request.user!.userId;

    const body = await request.json();
    const { name, category, time, plannedDate, description, calories, cookTime } = body;

    if (!name || !plannedDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // First, check if a meal with this name already exists (from any user)
    const existingMeal = await db
      .select()
      .from(meals)
      .where(eq(meals.name, name))
      .limit(1);

    let mealId: string;

    if (existingMeal.length > 0) {
      // Use existing meal
      mealId = existingMeal[0].id;
    } else {
      // Create new meal
      const newMeal = await db
        .insert(meals)
        .values({
          userId,
          categoryId: null, // Optional field - can be null
          name,
          description: description || null,
          difficulty: 'easy', // Default value
          cookTime: cookTime || null,
          servings: 2, // Default value
          calories: calories || null,
          protein: null,
          carbs: null,
          fat: null,
          fiber: null,
          sugar: null,
          sodium: null,
          instructions: '', // Required field - provide empty string
          notes: null,
          imageUrl: null,
          isPublic: false, // Default value
          isFavorite: false, // Default value
        })
        .returning();

      mealId = newMeal[0].id;
    }

    // Add to daily planned meals for the specific date
    const plannedMeal = await db
      .insert(dailyPlannedMeals)
      .values({
        userId,
        mealId,
        plannedDate,
        mealSlot: time || null,
      })
      .returning();

    // Return the complete meal data with creator info
    const completeMeal = await db
      .select({
        id: dailyPlannedMeals.id,
        mealId: dailyPlannedMeals.mealId,
        plannedDate: dailyPlannedMeals.plannedDate,
        mealSlot: dailyPlannedMeals.mealSlot,
        servings: dailyPlannedMeals.servings,
        notes: dailyPlannedMeals.notes,
        meal: meals,
        creator: {
          userId: users.id,
          username: users.username
        }
      })
      .from(dailyPlannedMeals)
      .innerJoin(meals, eq(dailyPlannedMeals.mealId, meals.id))
      .innerJoin(users, eq(meals.userId, users.id))
      .where(eq(dailyPlannedMeals.id, plannedMeal[0].id))
      .limit(1);

    return NextResponse.json({ meal: completeMeal[0] });
  } catch (error) {
    console.error('Error creating meal:', error);
    return NextResponse.json({ error: 'Failed to create meal' }, { status: 500 });
  }
}

async function deleteHandler(request: AuthenticatedRequest) {
  try {
    const userId = request.user!.userId;

    const { searchParams } = new URL(request.url);
    const plannedMealId = searchParams.get('id');

    console.log('🗑️ DELETE: Attempting to delete planned meal:', {
      plannedMealId,
      userId
    });

    if (!plannedMealId) {
      return NextResponse.json({ error: 'Planned meal ID required' }, { status: 400 });
    }

    // First, check if the planned meal exists and who owns it
    const existingMeal = await db
      .select()
      .from(dailyPlannedMeals)
      .where(eq(dailyPlannedMeals.id, plannedMealId));

    console.log('🗑️ DELETE: Found existing meal:', existingMeal);

    if (existingMeal.length === 0) {
      console.log('🗑️ DELETE: No meal found with ID:', plannedMealId);
      return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
    }

    console.log('🗑️ DELETE: Meal owner userId:', existingMeal[0].userId, 'Current user:', userId);

    // Get current user's role from database
    const currentUser = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const userRole = currentUser[0]?.role || 'user';
    console.log('🗑️ DELETE: User role:', userRole);

    // Check if user is admin or owns the meal
    const isAdmin = userRole === 'admin';
    const ownsmeal = existingMeal[0].userId === userId;

    if (!isAdmin && !ownsmeal) {
      console.log('🗑️ DELETE: Permission denied - not admin and not owner');
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    console.log('🗑️ DELETE: Permission granted -', isAdmin ? 'admin user' : 'meal owner');

    // Delete the planned meal (admin can delete any meal, user can only delete their own)
    const deleteCondition = isAdmin 
      ? eq(dailyPlannedMeals.id, plannedMealId)
      : and(
          eq(dailyPlannedMeals.id, plannedMealId),
          eq(dailyPlannedMeals.userId, userId)
        );

    const result = await db
      .delete(dailyPlannedMeals)
      .where(deleteCondition);

    console.log('🗑️ DELETE: Delete result:', result);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting meal:', error);
    return NextResponse.json({ error: 'Failed to delete meal' }, { status: 500 });
  }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
export const DELETE = withAuth(deleteHandler);
