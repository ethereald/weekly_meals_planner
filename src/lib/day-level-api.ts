// Enhanced API functions that work with the new PostgreSQL day-level functions
import { db, client } from '@/lib/db';

interface DayToggleRequest {
  weekStart: string;
  day: string;
  enabled: boolean;
  userId?: string;
}

interface WeekSummaryResponse {
  [day: string]: boolean;
}

/**
 * Toggle all categories for a specific day using PostgreSQL function
 */
export async function toggleDayCategories(params: DayToggleRequest) {
  try {
    const { weekStart, day, enabled, userId } = params;

    // Validate inputs
    const validDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    if (!validDays.includes(day.toLowerCase())) {
      throw new Error(`Invalid day: ${day}. Must be one of: ${validDays.join(', ')}`);
    }

    // Use PostgreSQL function to toggle day categories
    const result = await client`
      SELECT toggle_day_categories(
        ${weekStart}::DATE, 
        ${day.toLowerCase()}, 
        ${enabled}, 
        ${userId ? `${userId}::UUID` : 'NULL'}
      ) as enabled_categories
    `;

    if (result.length === 0) {
      throw new Error('Failed to toggle day categories');
    }

    return {
      weekStartDate: weekStart,
      enabledCategories: result[0].enabled_categories,
      toggledDay: day.toLowerCase(),
      toggledTo: enabled
    };

  } catch (error) {
    console.error('Error toggling day categories:', error);
    throw error;
  }
}

/**
 * Check if a specific day is fully enabled (all categories enabled)
 */
export async function isDayFullyEnabled(weekStart: string, day: string): Promise<boolean> {
  try {
    const validDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    if (!validDays.includes(day.toLowerCase())) {
      throw new Error(`Invalid day: ${day}. Must be one of: ${validDays.join(', ')}`);
    }

    const result = await client`
      SELECT is_day_fully_enabled(${weekStart}::DATE, ${day.toLowerCase()}) as is_enabled
    `;

    return result[0]?.is_enabled || false;

  } catch (error) {
    console.error('Error checking if day is fully enabled:', error);
    throw error;
  }
}

/**
 * Get a summary of enabled/disabled days for a week
 */
export async function getWeekDaySummary(weekStart: string): Promise<WeekSummaryResponse> {
  try {
    const result = await client`
      SELECT get_week_day_summary(${weekStart}::DATE) as summary
    `;

    return result[0]?.summary || {};

  } catch (error) {
    console.error('Error getting week day summary:', error);
    throw error;
  }
}

/**
 * Batch toggle multiple days at once
 */
export async function batchToggleDays(
  weekStart: string, 
  daySettings: { [day: string]: boolean },
  userId?: string
) {
  try {
    const results = [];
    
    for (const [day, enabled] of Object.entries(daySettings)) {
      const result = await toggleDayCategories({
        weekStart,
        day,
        enabled,
        userId
      });
      results.push(result);
    }

    return {
      weekStartDate: weekStart,
      updatedDays: results,
      summary: await getWeekDaySummary(weekStart)
    };

  } catch (error) {
    console.error('Error batch toggling days:', error);
    throw error;
  }
}