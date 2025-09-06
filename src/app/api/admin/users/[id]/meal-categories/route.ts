import { NextRequest, NextResponse } from 'next/server';
import { db, userSettings, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth';

const VALID_MEAL_CATEGORIES = ['breakfast', 'lunch', 'dinner', 'snack'];

// GET /api/admin/users/[id]/meal-categories - Get user's meal categories
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    // Check if user is admin
    const adminUser = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
    if (!adminUser[0] || adminUser[0].role !== 'admin') {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const { id: userId } = await params;

    // Get user's settings
    const settings = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    if (settings.length === 0) {
      // Return default categories if no settings exist
      return NextResponse.json({
        userId,
        enabledMealCategories: VALID_MEAL_CATEGORIES
      });
    }

    const enabledCategories = settings[0].enabledMealCategories
      ? JSON.parse(settings[0].enabledMealCategories)
      : VALID_MEAL_CATEGORIES;

    return NextResponse.json({
      userId,
      enabledMealCategories: enabledCategories
    });
  } catch (error) {
    console.error('Error fetching user meal categories:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/users/[id]/meal-categories - Update user's meal categories
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    // Check if user is admin
    const adminUser = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
    if (!adminUser[0] || adminUser[0].role !== 'admin') {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const { id: userId } = await params;
    const body = await request.json();
    const { enabledMealCategories } = body;

    // Validate input
    if (!Array.isArray(enabledMealCategories)) {
      return NextResponse.json({ message: 'enabledMealCategories must be an array' }, { status: 400 });
    }

    // Validate each category
    const invalidCategories = enabledMealCategories.filter(cat => !VALID_MEAL_CATEGORIES.includes(cat));
    if (invalidCategories.length > 0) {
      return NextResponse.json({
        message: `Invalid meal categories: ${invalidCategories.join(', ')}. Valid categories are: ${VALID_MEAL_CATEGORIES.join(', ')}`
      }, { status: 400 });
    }

    // Check if user exists
    const targetUser = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!targetUser[0]) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Check if user settings exist
    const existingSettings = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    const categoriesJson = JSON.stringify(enabledMealCategories);

    if (existingSettings.length === 0) {
      // Create new settings
      await db.insert(userSettings).values({
        userId,
        enabledMealCategories: categoriesJson,
        updatedAt: new Date().toISOString()
      });
    } else {
      // Update existing settings
      await db
        .update(userSettings)
        .set({
          enabledMealCategories: categoriesJson,
          updatedAt: new Date().toISOString()
        })
        .where(eq(userSettings.userId, userId));
    }

    return NextResponse.json({
      message: 'Meal categories updated successfully',
      userId,
      enabledMealCategories
    });
  } catch (error) {
    console.error('Error updating user meal categories:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
