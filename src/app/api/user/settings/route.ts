import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getUserSettings } from '@/lib/db/utils';
import { db } from '@/lib/db';
import { userSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    // Get user settings
    const settings = await getUserSettings(payload.userId);
    
    if (!settings) {
      // Return default settings if none exist
      return NextResponse.json({
        settings: {
          enabledMealCategories: ['breakfast', 'lunch', 'dinner', 'snack'],
          weeklyMealGoal: 21,
          servingSize: 2,
          notificationsEnabled: true,
          theme: 'light'
        }
      });
    }

    // Parse enabled meal categories
    const enabledMealCategories = settings.enabledMealCategories
      ? JSON.parse(settings.enabledMealCategories)
      : ['breakfast', 'lunch', 'dinner', 'snack'];

    return NextResponse.json({
      settings: {
        enabledMealCategories,
        weeklyMealGoal: settings.weeklyMealGoal,
        servingSize: settings.servingSize,
        budgetRange: settings.budgetRange,
        shoppingDay: settings.shoppingDay,
        notificationsEnabled: settings.notificationsEnabled,
        dietaryRestrictions: settings.dietaryRestrictions,
        preferredMealTimes: settings.preferredMealTimes,
        theme: settings.theme || 'light'
      }
    });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { theme } = body;

    // Validate theme value
    const validThemes = ['light', 'dark', 'ocean', 'forest', 'sunset'];
    if (theme && !validThemes.includes(theme)) {
      return NextResponse.json(
        { message: 'Invalid theme value' },
        { status: 400 }
      );
    }

    // Check if user settings exist
    const existingSettings = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, payload.userId))
      .limit(1);

    if (existingSettings.length > 0) {
      // Update existing settings
      await db
        .update(userSettings)
        .set({
          theme,
          updatedAt: new Date(),
        })
        .where(eq(userSettings.userId, payload.userId));
    } else {
      // Create new settings
      await db
        .insert(userSettings)
        .values({
          userId: payload.userId,
          theme,
        });
    }

    // Get updated settings
    const updatedSettings = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, payload.userId))
      .limit(1);

    return NextResponse.json({
      success: true,
      settings: updatedSettings[0],
    });
  } catch (error) {
    console.error('Error updating user settings:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
