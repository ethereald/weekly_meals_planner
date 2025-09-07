import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { db, meals, tags, mealTags } from '@/lib/db';
import { eq, inArray } from 'drizzle-orm';

async function postHandler(request: AuthenticatedRequest) {
  try {
    const userId = request.user!.userId;
    const body = await request.json();
    const { name, description, calories, cookTime, tagNames } = body;

    console.log('Creating saved meal:', { name, tagNames });

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Meal name is required' }, { status: 400 });
    }

    // Check if a meal with this name already exists for this user
    const existingMeal = await db
      .select()
      .from(meals)
      .where(eq(meals.name, name.trim()))
      .limit(1);

    if (existingMeal.length > 0) {
      return NextResponse.json({ error: 'A meal with this name already exists' }, { status: 409 });
    }

    // Create the new meal
    const newMeal = await db
      .insert(meals)
      .values({
        userId,
        name: name.trim(),
        description: description?.trim() || null,
        instructions: '', // Provide default empty string for instructions
        calories: calories || null,
        cookTime: cookTime || null,
      })
      .returning();

    const mealId = newMeal[0].id;

    // Handle tags if provided
    if (tagNames && Array.isArray(tagNames) && tagNames.length > 0) {
      console.log('Processing tags:', tagNames);
      
      // Get existing tags that match the provided names
      const existingTags = await db
        .select()
        .from(tags)
        .where(inArray(tags.name, tagNames));

      console.log('Found existing tags:', existingTags);

      const existingTagNames = existingTags.map((tag: any) => tag.name);
      const newTagNames = tagNames.filter((name: string) => !existingTagNames.includes(name));

      console.log('New tags to create:', newTagNames);

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
        console.log('Created new tags:', newTags);
      }

      // Combine all tags and create meal-tag relationships
      const allTags = [...existingTags, ...newTags];
      console.log('All tags to associate:', allTags);
      
      if (allTags.length > 0) {
        const mealTagRelations = allTags.map((tag: any) => ({
          mealId,
          tagId: tag.id,
        }));
        console.log('Creating meal-tag relationships:', mealTagRelations);
        
        await db
          .insert(mealTags)
          .values(mealTagRelations);
        
        console.log('Meal-tag relationships created successfully');
      }
    }

    // Fetch the complete meal with tags for response
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

    return NextResponse.json({ meal: result }, { status: 201 });
  } catch (error) {
    console.error('Error creating saved meal:', error);
    return NextResponse.json({ error: 'Failed to create meal' }, { status: 500 });
  }
}

export const POST = withAuth(postHandler);
