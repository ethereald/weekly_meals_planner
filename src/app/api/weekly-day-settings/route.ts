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
      // Create default settings for this week (all days enabled)
      const defaultSettings = await db
        .insert(weeklyDaySettings)
        .values({
          weekStartDate: weekStart,
          enabledDays: {
            sunday: true,
            monday: true,
            tuesday: true,
            wednesday: true,
            thursday: true,
            friday: true,
            saturday: true
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
      enabledDays: weekSettings[0].enabledDays,
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
    const { weekStart, enabledDays } = body;

    if (!weekStart || !enabledDays) {
      return NextResponse.json({ error: 'weekStart and enabledDays are required' }, { status: 400 });
    }

    // Validate enabledDays structure
    const requiredDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    for (const day of requiredDays) {
      if (typeof enabledDays[day] !== 'boolean') {
        return NextResponse.json({ error: `Invalid enabledDays format: ${day} must be boolean` }, { status: 400 });
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
          enabledDays,
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
          enabledDays,
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
      enabledDays: updatedSettings[0].enabledDays,
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
