import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { toggleDayCategories, isDayFullyEnabled, getWeekDaySummary, batchToggleDays } from '@/lib/day-level-api';

async function postHandler(request: AuthenticatedRequest) {
  try {
    const userId = request.user!.userId;
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'toggleDay': {
        const { weekStart, day, enabled } = params;
        
        if (!weekStart || !day || typeof enabled !== 'boolean') {
          return NextResponse.json({ 
            error: 'weekStart, day, and enabled are required for toggleDay action' 
          }, { status: 400 });
        }

        const result = await toggleDayCategories({
          weekStart,
          day,
          enabled,
          userId
        });

        return NextResponse.json(result);
      }

      case 'checkDay': {
        const { weekStart, day } = params;
        
        if (!weekStart || !day) {
          return NextResponse.json({ 
            error: 'weekStart and day are required for checkDay action' 
          }, { status: 400 });
        }

        const isEnabled = await isDayFullyEnabled(weekStart, day);
        
        return NextResponse.json({
          weekStartDate: weekStart,
          day,
          isFullyEnabled: isEnabled
        });
      }

      case 'getWeekSummary': {
        const { weekStart } = params;
        
        if (!weekStart) {
          return NextResponse.json({ 
            error: 'weekStart is required for getWeekSummary action' 
          }, { status: 400 });
        }

        const summary = await getWeekDaySummary(weekStart);
        
        return NextResponse.json({
          weekStartDate: weekStart,
          daySummary: summary
        });
      }

      case 'batchToggle': {
        const { weekStart, daySettings } = params;
        
        if (!weekStart || !daySettings || typeof daySettings !== 'object') {
          return NextResponse.json({ 
            error: 'weekStart and daySettings object are required for batchToggle action' 
          }, { status: 400 });
        }

        const result = await batchToggleDays(weekStart, daySettings, userId);
        
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ 
          error: `Unknown action: ${action}. Valid actions: toggleDay, checkDay, getWeekSummary, batchToggle` 
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in day-level API:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to process day-level request' 
    }, { status: 500 });
  }
}

export const POST = withAuth(postHandler);