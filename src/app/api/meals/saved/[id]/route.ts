import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db, meals, dailyPlannedMeals } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

interface Context {
  params: Promise<{
    id: string;
  }>;
}

// PUT /api/meals/saved/[id] - Update saved meal
export async function PUT(request: NextRequest, context: Context) {
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
    const updates = await request.json();

    // First verify the meal belongs to the user
    const existingMeal = await db
      .select()
      .from(meals)
      .where(and(eq(meals.id, mealId), eq(meals.userId, userId)))
      .limit(1);

    if (existingMeal.length === 0) {
      return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
    }

    // Build update object with only allowed fields
    const allowedFields = ['name', 'description', 'mealType', 'calories', 'prepTime'];
    const updateData: any = { updatedAt: new Date() };

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    }

    if (Object.keys(updateData).length === 1) { // Only updatedAt
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Update the meal
    const updatedMeal = await db
      .update(meals)
      .set(updateData)
      .where(and(eq(meals.id, mealId), eq(meals.userId, userId)))
      .returning();

    if (updatedMeal.length === 0) {
      return NextResponse.json({ error: 'Failed to update meal' }, { status: 500 });
    }

    return NextResponse.json({ meal: updatedMeal[0] });

  } catch (error) {
    console.error('Error updating saved meal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/meals/saved/[id] - Delete saved meal
export async function DELETE(request: NextRequest, context: Context) {
  try {
    console.log('DELETE request received for saved meal');
    
    // Check authentication
    const token = request.cookies.get('auth_token')?.value;
    console.log('Auth token present:', !!token);
    
    if (!token) {
      console.log('No auth token found');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    console.log('Token decoded:', !!decoded);
    
    if (!decoded) {
      console.log('Token verification failed');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const params = await context.params;
    const mealId = params.id;
    const userId = decoded.userId;
    
    // Check for force delete parameter
    const url = new URL(request.url);
    const forceDelete = url.searchParams.get('force') === 'true';
    
    console.log('Delete request for meal:', mealId, 'by user:', userId, 'force:', forceDelete);

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

    console.log('Existing meal found:', existingMeal.length > 0);

    if (existingMeal.length === 0) {
      console.log('Meal not found or not owned by user');
      return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
    }

    // Check if meal is being used in any planned meals
    const plannedMealsCount = await db
      .select()
      .from(dailyPlannedMeals)
      .where(eq(dailyPlannedMeals.mealId, mealId));

    console.log('Planned meals using this recipe:', plannedMealsCount.length);

    if (plannedMealsCount.length > 0) {
      if (!forceDelete) {
        console.log('Cannot delete meal - still in use in meal plans');
        return NextResponse.json({ 
          error: 'Cannot delete meal that is currently planned. Please remove from meal plans first.',
          plannedMealsCount: plannedMealsCount.length
        }, { status: 400 });
      } else {
        // Force delete: remove from all planned meals first
        console.log('Force deleting meal - removing from all planned meals first');
        await db
          .delete(dailyPlannedMeals)
          .where(eq(dailyPlannedMeals.mealId, mealId));
        console.log('Removed meal from', plannedMealsCount.length, 'planned meals');
      }
    }

    // Delete the meal
    await db
      .delete(meals)
      .where(and(eq(meals.id, mealId), eq(meals.userId, userId)));

    console.log('Meal deleted successfully');
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting saved meal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
