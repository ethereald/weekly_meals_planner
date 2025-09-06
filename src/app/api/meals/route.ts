import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { db } from '@/lib/db';
import { meals, dailyPlannedMeals } from '@/lib/db/sqlite-schema';
import { eq, and } from 'drizzle-orm';

async function getHandler(request: AuthenticatedRequest) {
  try {
    const userId = request.user!.userId;

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    
    if (date) {
      // Get planned meals for a specific date
      const plannedMealsData = await db
        .select({
          id: dailyPlannedMeals.id,
          mealId: dailyPlannedMeals.mealId,
          plannedDate: dailyPlannedMeals.plannedDate,
          plannedTime: dailyPlannedMeals.plannedTime,
          servings: dailyPlannedMeals.servings,
          notes: dailyPlannedMeals.notes,
          meal: meals
        })
        .from(dailyPlannedMeals)
        .innerJoin(meals, eq(dailyPlannedMeals.mealId, meals.id))
        .where(
          and(
            eq(dailyPlannedMeals.userId, userId),
            eq(dailyPlannedMeals.plannedDate, date)
          )
        );

      return NextResponse.json({ meals: plannedMealsData });
    } else {
      // Get all user's meals (for saved meals dropdown)
      const userMeals = await db
        .select()
        .from(meals)
        .where(eq(meals.userId, userId));

      return NextResponse.json({ meals: userMeals });
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
    const { name, category, time, plannedDate, description, calories, prepTime } = body;

    if (!name || !category || !plannedDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // First, check if a meal with this name already exists for this user
    let existingMeal = await db
      .select()
      .from(meals)
      .where(
        and(
          eq(meals.userId, userId),
          eq(meals.name, name)
        )
      )
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
          mealType: category,
          calories: calories || null,
          prepTime: prepTime || null,
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
        plannedTime: time || null,
      })
      .returning();

    // Return the complete meal data
    const completeMeal = await db
      .select({
        id: dailyPlannedMeals.id,
        mealId: dailyPlannedMeals.mealId,
        plannedDate: dailyPlannedMeals.plannedDate,
        plannedTime: dailyPlannedMeals.plannedTime,
        servings: dailyPlannedMeals.servings,
        notes: dailyPlannedMeals.notes,
        meal: meals
      })
      .from(dailyPlannedMeals)
      .innerJoin(meals, eq(dailyPlannedMeals.mealId, meals.id))
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

    // Delete the planned meal (not the meal itself, as it might be used elsewhere)
    await db
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
