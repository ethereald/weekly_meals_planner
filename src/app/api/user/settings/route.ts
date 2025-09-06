import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getUserSettings } from '@/lib/db/utils';

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
        enabledMealCategories: ['breakfast', 'lunch', 'dinner', 'snack'],
        weeklyMealGoal: 21,
        servingSize: 2,
        notificationsEnabled: true
      });
    }

    // Parse enabled meal categories
    const enabledMealCategories = settings.enabledMealCategories
      ? JSON.parse(settings.enabledMealCategories)
      : ['breakfast', 'lunch', 'dinner', 'snack'];

    return NextResponse.json({
      enabledMealCategories,
      weeklyMealGoal: settings.weeklyMealGoal,
      servingSize: settings.servingSize,
      budgetRange: settings.budgetRange,
      shoppingDay: settings.shoppingDay,
      notificationsEnabled: settings.notificationsEnabled,
      dietaryRestrictions: settings.dietaryRestrictions,
      preferredMealTimes: settings.preferredMealTimes
    });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
