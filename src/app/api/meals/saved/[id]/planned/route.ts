import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db, meals, dailyPlannedMeals } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

interface Context {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/meals/saved/[id]/planned - Get planned meals info for a recipe
export async function GET(request: NextRequest, context: Context) {
  try {
    // Check authentication
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const params = await context.params;
    const mealId = params.id;
    const userId = decoded.userId;

    // First verify the meal belongs to the user (select only basic columns that should exist)
    const existingMeal = await db
      .select({
        id: meals.id,
        userId: meals.userId,
        name: meals.name
      })
      .from(meals)
      .where(and(eq(meals.id, mealId), eq(meals.userId, userId)))
      .limit(1);

    if (existingMeal.length === 0) {
      return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
    }

    // Get all planned meals using this recipe
    const plannedMealsData = await db
      .select({
        plannedDate: dailyPlannedMeals.plannedDate,
        mealSlot: dailyPlannedMeals.mealSlot,
      })
      .from(dailyPlannedMeals)
      .where(eq(dailyPlannedMeals.mealId, mealId));

    const dates = plannedMealsData.map((pm: any) => pm.plannedDate).sort();
    const uniqueDates = [...new Set(dates)];

    return NextResponse.json({
      count: plannedMealsData.length,
      dates: uniqueDates,
      plannedMeals: plannedMealsData
    });

  } catch (error) {
    console.error('Error getting planned meals info:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
