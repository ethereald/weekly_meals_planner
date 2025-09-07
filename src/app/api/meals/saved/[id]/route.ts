import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { db } from '@/lib/db';
import { meals, dailyPlannedMeals } from '@/lib/db/sqlite-schema';
import { eq, and } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const PUT = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const mealId = pathSegments[pathSegments.length - 1];
    
    const userId = request.user!.userId;
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
});

export const DELETE = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const mealId = pathSegments[pathSegments.length - 1];
    
    const userId = request.user!.userId;

    // First verify the meal belongs to the user
    const existingMeal = await db
      .select()
      .from(meals)
      .where(and(eq(meals.id, mealId), eq(meals.userId, userId)))
      .limit(1);

    if (existingMeal.length === 0) {
      return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
    }

    // Check if meal is being used in any planned meals
    const plannedMealsCount = await db
      .select()
      .from(dailyPlannedMeals)
      .where(eq(dailyPlannedMeals.mealId, mealId));

    if (plannedMealsCount.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete meal that is currently planned. Please remove from meal plans first.' 
      }, { status: 400 });
    }

    // Delete the meal
    await db
      .delete(meals)
      .where(and(eq(meals.id, mealId), eq(meals.userId, userId)));

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting saved meal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
