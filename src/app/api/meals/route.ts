import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { db, meals, dailyPlannedMeals, users } from '@/lib/db';
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
        // Get only current user's meals (for saved meals dropdown)
        const userMeals = await db
          .select()
          .from(meals)
          .where(eq(meals.userId, userId));

        return NextResponse.json({ meals: userMeals });
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
          name,
          description: description || null,
          calories: calories || null,
          cookTime: cookTime || null,
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

    if (!plannedMealId) {
      return NextResponse.json({ error: 'Planned meal ID required' }, { status: 400 });
    }

    // Delete the planned meal (only if it belongs to the current user)
    const result = await db
      .delete(dailyPlannedMeals)
      .where(
        and(
          eq(dailyPlannedMeals.id, plannedMealId),
          eq(dailyPlannedMeals.userId, userId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting meal:', error);
    return NextResponse.json({ error: 'Failed to delete meal' }, { status: 500 });
  }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
export const DELETE = withAuth(deleteHandler);
