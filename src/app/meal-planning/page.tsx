'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { authApi } from '../../lib/auth-client';
import { mealsApi, PlannedMeal, SavedMeal } from '../../lib/api/meals';
import MealPlanningLayout from '../../components/meal-planning/MealPlanningLayout';
import DailyView from '../../components/meal-planning/DailyView';
import WeeklyView from '../../components/meal-planning/WeeklyView';
import MonthlyView from '../../components/meal-planning/MonthlyView';
import { Meal } from '../../components/meal-planning/MealCard';

export default function MealPlanningPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [meals, setMeals] = useState<Meal[]>([]);
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string } | null>(null);
  
  // Check if debug mode is enabled via URL parameter
  const isDebugMode = searchParams.get('debug') === 'true';

  // Load user and initialize data
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Get current user
        const profile = await authApi.getProfile();
        const user = { id: profile.user.id, username: profile.user.username };
        setCurrentUser(user);

        // Load saved meals
        const savedMealsData = await mealsApi.getSavedMeals();
        setSavedMeals(savedMealsData);

        // Load planned meals for current date
        await loadPlannedMeals(currentDate);
      } catch (error) {
        console.error('Failed to load user data:', error);
        // Redirect to login if auth fails
        router.push('/auth');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [router]);

  // Load planned meals for a specific date or date range
  const loadPlannedMeals = async (date: Date, dateRange?: { start: Date; end: Date }) => {
    try {
      let plannedMeals: PlannedMeal[] = [];
      
      if (dateRange) {
        // Use the new date range API for more efficient loading
        console.log('📅 Loading meals for range:', format(dateRange.start, 'yyyy-MM-dd'), 'to', format(dateRange.end, 'yyyy-MM-dd'));
        
        const startDateStr = format(dateRange.start, 'yyyy-MM-dd');
        const endDateStr = format(dateRange.end, 'yyyy-MM-dd');
        plannedMeals = await mealsApi.getPlannedMealsInRange(startDateStr, endDateStr);
      } else {
        // Load meals for a single date
        const dateStr = format(date, 'yyyy-MM-dd');
        plannedMeals = await mealsApi.getPlannedMeals(dateStr);
      }
      
      // Convert API response to Meal interface
      const convertedMeals: Meal[] = plannedMeals.map((plannedMeal: PlannedMeal) => ({
        id: plannedMeal.id,
        mealId: plannedMeal.mealId,
        name: plannedMeal.meal.name,
        description: plannedMeal.meal.description || undefined,
        category: plannedMeal.meal.mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
        time: plannedMeal.plannedTime || undefined,
        calories: plannedMeal.meal.calories || undefined,
        prepTime: plannedMeal.meal.prepTime || undefined,
        plannedDate: plannedMeal.plannedDate,
        meal: plannedMeal.meal,
        addedBy: {
          userId: plannedMeal.creator.userId,
          username: plannedMeal.creator.username,
          addedAt: plannedMeal.meal.createdAt
        }
      }));
      
      console.log('✅ Loaded', convertedMeals.length, 'meals for', view, 'view');
      setMeals(convertedMeals);
    } catch (error) {
      console.error('Failed to load planned meals:', error);
      setMeals([]);
    }
  };

  // Helper function to get date range based on current view
  const getDateRange = (date: Date, viewType: 'daily' | 'weekly' | 'monthly') => {
    const start = new Date(date);
    const end = new Date(date);
    
    switch (viewType) {
      case 'weekly':
        // Get start of week (Sunday) and end of week (Saturday)
        const startOfWeek = start.getDate() - start.getDay();
        start.setDate(startOfWeek);
        end.setDate(startOfWeek + 6);
        break;
      case 'monthly':
        // Get start and end of month
        start.setDate(1);
        end.setMonth(end.getMonth() + 1, 0);
        break;
      case 'daily':
      default:
        // For daily view, start and end are the same date
        break;
    }
    
    return { start, end };
  };

  // Reload meals when current date or view changes
  useEffect(() => {
    if (currentUser) {
      console.log('🔄 Reloading meals for:', view, 'view, date:', format(currentDate, 'yyyy-MM-dd'));
      const dateRange = getDateRange(currentDate, view);
      if (view === 'daily') {
        loadPlannedMeals(currentDate);
      } else {
        console.log('📅 Loading date range:', format(dateRange.start, 'yyyy-MM-dd'), 'to', format(dateRange.end, 'yyyy-MM-dd'));
        loadPlannedMeals(currentDate, dateRange);
      }
    }
  }, [currentDate, view, currentUser]);

  const handleAddMeal = async (mealData: Omit<Meal, 'id'>, date?: Date) => {
    if (!currentUser) return;
    
    const targetDate = date || currentDate;
    const dateStr = format(targetDate, 'yyyy-MM-dd');
    
    try {
      console.log('➕ Adding meal for date:', dateStr, 'in', view, 'view');
      
      const plannedMeal = await mealsApi.createPlannedMeal({
        name: mealData.name,
        category: mealData.category,
        time: mealData.time,
        plannedDate: dateStr,
        description: mealData.description,
        calories: mealData.calories,
        prepTime: mealData.prepTime,
      });

      if (plannedMeal) {
        console.log('✅ Meal created successfully, reloading data...');
        
        // Always reload based on current view and ensure fresh data
        const dateRange = getDateRange(currentDate, view);
        if (view === 'daily') {
          await loadPlannedMeals(currentDate);
        } else {
          await loadPlannedMeals(currentDate, dateRange);
        }
        
        // Reload saved meals to update the dropdown
        const savedMealsData = await mealsApi.getSavedMeals();
        setSavedMeals(savedMealsData);
        
        console.log('🔄 Data reloaded after meal addition');
      }
    } catch (error) {
      console.error('Failed to add meal:', error);
    }
  };

  const handleEditMeal = async (id: string, mealData: Omit<Meal, 'id'>) => {
    // For now, we'll implement this as delete + create
    // In a real app, you'd want a proper update endpoint
    try {
      await handleDeleteMeal(id);
      await handleAddMeal(mealData);
    } catch (error) {
      console.error('Failed to edit meal:', error);
    }
  };

  const handleDeleteMeal = async (id: string) => {
    try {
      const success = await mealsApi.deletePlannedMeal(id);
      if (success) {
        // Reload meals based on current view to ensure consistency
        const dateRange = getDateRange(currentDate, view);
        if (view === 'daily') {
          await loadPlannedMeals(currentDate);
        } else {
          await loadPlannedMeals(currentDate, dateRange);
        }
      }
    } catch (error) {
      console.error('Failed to delete meal:', error);
    }
  };

  const handleViewChange = (newView: 'daily' | 'weekly' | 'monthly') => {
    setView(newView);
    // The useEffect will automatically reload meals when view changes
  };

  const handleDateSelect = (date: Date) => {
    setCurrentDate(date);
    setView('daily');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading meal plans...</p>
        </div>
      </div>
    );
  }

  return (
    <MealPlanningLayout
      currentDate={currentDate}
      onDateChange={setCurrentDate}
      view={view}
      onViewChange={handleViewChange}
    >
      {view === 'daily' && (
        <DailyView
          currentDate={currentDate}
          meals={meals}
          existingMeals={savedMeals}
          onAddMeal={handleAddMeal}
          onEditMeal={handleEditMeal}
          onDeleteMeal={handleDeleteMeal}
          isDebugMode={isDebugMode}
        />
      )}
      
      {view === 'weekly' && (
        <WeeklyView
          currentDate={currentDate}
          meals={meals}
          existingMeals={savedMeals}
          onAddMeal={handleAddMeal}
          onEditMeal={handleEditMeal}
          onDeleteMeal={handleDeleteMeal}
          isDebugMode={isDebugMode}
        />
      )}
      
      {view === 'monthly' && (
        <MonthlyView
          currentDate={currentDate}
          meals={meals}
          existingMeals={savedMeals}
          onAddMeal={handleAddMeal}
          onEditMeal={handleEditMeal}
          onDeleteMeal={handleDeleteMeal}
          onDateSelect={handleDateSelect}
          isDebugMode={isDebugMode}
        />
      )}
    </MealPlanningLayout>
  );
}
