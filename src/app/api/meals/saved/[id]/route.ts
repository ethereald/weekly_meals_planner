import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db, meals, dailyPlannedMeals, tags, mealTags } from '@/lib/db';
import { eq, and, inArray } from 'drizzle-orm';

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

    console.log('PUT: Updating meal:', mealId, 'with data:', updates);

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
    const allowedFields = ['name', 'description', 'calories', 'cookTime'];
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

    // Handle tags if provided
    if (updates.tagNames && Array.isArray(updates.tagNames)) {
      console.log('PUT: Processing tags:', updates.tagNames);
      
      // First, remove all existing meal-tag relationships
      await db
        .delete(mealTags)
        .where(eq(mealTags.mealId, mealId));
      
      console.log('PUT: Cleared existing meal-tag relationships');

      if (updates.tagNames.length > 0) {
        // Get existing tags that match the provided names
        const existingTags = await db
          .select()
          .from(tags)
          .where(inArray(tags.name, updates.tagNames));

        console.log('PUT: Found existing tags:', existingTags);

        const existingTagNames = existingTags.map((tag: any) => tag.name);
        const newTagNames = updates.tagNames.filter((name: string) => !existingTagNames.includes(name));

        console.log('PUT: New tags to create:', newTagNames);

        // Create new tags if needed
        let newTags = [];
        if (newTagNames.length > 0) {
          newTags = await db
            .insert(tags)
            .values(
              newTagNames.map((name: string) => ({
                name,
                color: '#3B82F6', // Default blue color
                userId, // Add userId to new tags
              }))
            )
            .returning();
          console.log('PUT: Created new tags:', newTags);
        }

        // Combine all tags and create meal-tag relationships
        const allTags = [...existingTags, ...newTags];
        console.log('PUT: All tags to associate:', allTags);
        
        if (allTags.length > 0) {
          const mealTagRelations = allTags.map((tag: any) => ({
            mealId,
            tagId: tag.id,
          }));
          console.log('PUT: Creating meal-tag relationships:', mealTagRelations);
          
          await db
            .insert(mealTags)
            .values(mealTagRelations);
            
          console.log('PUT: Meal-tag relationships created successfully');
        }
      }
    }

    // Fetch the complete updated meal with tags for response
    const mealWithTags = await db
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
      .where(eq(meals.id, mealId))
      .limit(1);

    // Get tags for this meal
    const mealTagsData = await db
      .select({
        id: tags.id,
        name: tags.name,
        color: tags.color,
      })
      .from(mealTags)
      .innerJoin(tags, eq(mealTags.tagId, tags.id))
      .where(eq(mealTags.mealId, mealId));

    const result = {
      ...mealWithTags[0],
      tags: mealTagsData,
    };

    return NextResponse.json({ meal: result });

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
