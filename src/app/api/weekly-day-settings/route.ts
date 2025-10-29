import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { db, weeklyDaySettings, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { format, startOfWeek } from 'date-fns';

// Helper function to get Monday of the week for consistency
function getWeekStartDate(date: Date): string {
  const monday = startOfWeek(date, { weekStartsOn: 1 }); // Start week on Monday
  return format(monday, 'yyyy-MM-dd');
}

async function getHandler(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const weekStart = searchParams.get('weekStart');
    
    if (!weekStart) {
      return NextResponse.json({ error: 'weekStart parameter is required' }, { status: 400 });
    }

    // Get or create weekly day settings for the specified week
    let weekSettings = await db
      .select()
      .from(weeklyDaySettings)
      .where(eq(weeklyDaySettings.weekStartDate, weekStart))
      .limit(1);

    if (weekSettings.length === 0) {
      // Create default settings for this week (all categories enabled for all days)
      const defaultSettings = await db
        .insert(weeklyDaySettings)
        .values({
          weekStartDate: weekStart,
          enabledCategories: {
            sunday: { breakfast: true, lunch: true, dinner: true, snack: true },
            monday: { breakfast: true, lunch: true, dinner: true, snack: true },
            tuesday: { breakfast: true, lunch: true, dinner: true, snack: true },
            wednesday: { breakfast: true, lunch: true, dinner: true, snack: true },
            thursday: { breakfast: true, lunch: true, dinner: true, snack: true },
            friday: { breakfast: true, lunch: true, dinner: true, snack: true },
            saturday: { breakfast: true, lunch: true, dinner: true, snack: true }
          },
          lastUpdatedBy: null
        })
        .returning();

      weekSettings = defaultSettings;
    }

    // Get user info for the last updater
    let lastUpdatedByUser = null;
    if (weekSettings[0].lastUpdatedBy) {
      const userResult = await db
        .select({
          id: users.id,
          username: users.username,
          displayName: users.displayName
        })
        .from(users)
        .where(eq(users.id, weekSettings[0].lastUpdatedBy))
        .limit(1);

      if (userResult.length > 0) {
        lastUpdatedByUser = userResult[0];
      }
    }

    return NextResponse.json({
      weekStartDate: weekSettings[0].weekStartDate,
      enabledCategories: weekSettings[0].enabledCategories,
      lastUpdatedBy: lastUpdatedByUser,
      updatedAt: weekSettings[0].updatedAt
    });
  } catch (error) {
    console.error('Error getting weekly day settings:', error);
    return NextResponse.json({ error: 'Failed to get weekly day settings' }, { status: 500 });
  }
}

async function putHandler(request: AuthenticatedRequest) {
  try {
    const userId = request.user!.userId;
    const body = await request.json();
    const { weekStart, enabledCategories } = body;

    if (!weekStart || !enabledCategories) {
      return NextResponse.json({ error: 'weekStart and enabledCategories are required' }, { status: 400 });
    }

    // Validate enabledCategories structure
    const requiredDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const requiredCategories = ['breakfast', 'lunch', 'dinner', 'snack'];
    
    for (const day of requiredDays) {
      if (!enabledCategories[day] || typeof enabledCategories[day] !== 'object') {
        return NextResponse.json({ error: `Invalid enabledCategories format: ${day} must be an object` }, { status: 400 });
      }
      
      for (const category of requiredCategories) {
        if (typeof enabledCategories[day][category] !== 'boolean') {
          return NextResponse.json({ error: `Invalid enabledCategories format: ${day}.${category} must be boolean` }, { status: 400 });
        }
      }
    }

    // Update or create weekly day settings
    const existingSettings = await db
      .select()
      .from(weeklyDaySettings)
      .where(eq(weeklyDaySettings.weekStartDate, weekStart))
      .limit(1);

    let updatedSettings;
    if (existingSettings.length > 0) {
      // Update existing settings
      updatedSettings = await db
        .update(weeklyDaySettings)
        .set({
          enabledCategories,
          lastUpdatedBy: userId,
          updatedAt: new Date()
        })
        .where(eq(weeklyDaySettings.weekStartDate, weekStart))
        .returning();
    } else {
      // Create new settings
      updatedSettings = await db
        .insert(weeklyDaySettings)
        .values({
          weekStartDate: weekStart,
          enabledCategories,
          lastUpdatedBy: userId
        })
        .returning();
    }

    // Get user info for response
    const userResult = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return NextResponse.json({
      weekStartDate: updatedSettings[0].weekStartDate,
      enabledCategories: updatedSettings[0].enabledCategories,
      lastUpdatedBy: userResult[0] || null,
      updatedAt: updatedSettings[0].updatedAt
    });
  } catch (error) {
    console.error('Error updating weekly day settings:', error);
    return NextResponse.json({ error: 'Failed to update weekly day settings' }, { status: 500 });
  }
}

export const GET = withAuth(getHandler);
export const PUT = withAuth(putHandler);
