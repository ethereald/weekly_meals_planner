'use client';

import { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import MealCard, { Meal } from './MealCard';
import MealFormModal from './MealFormModal';
import RemarkIcon from './RemarkIcon';
import { SavedMeal } from '../../lib/api/meals';
import { authApi, UserSettings } from '../../lib/auth-client';

interface WeeklyViewProps {
  currentDate: Date;
  meals: Meal[];
  existingMeals?: SavedMeal[];
  currentUser: { id: string; username: string; displayName?: string; role: string } | null;
  onAddMeal: (meal: Omit<Meal, 'id'>, date: Date) => void;
  onEditMeal: (id: string, meal: Omit<Meal, 'id'>) => void;
  onDeleteMeal: (id: string) => void;
  isDebugMode?: boolean;
}

export default function WeeklyView({
  currentDate,
  meals,
  existingMeals = [],
  currentUser,
  onAddMeal,
  onEditMeal,
  onDeleteMeal,
  isDebugMode = false
}: WeeklyViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack' | undefined>();
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  
  // Global refresh trigger for remark icons
  const [remarkRefreshTrigger, setRemarkRefreshTrigger] = useState(0);
  
  // State for category enable/disable functionality
  const [isEditMode, setIsEditMode] = useState(false);
  const [enabledCategories, setEnabledCategories] = useState<Record<string, Record<string, boolean>>>(() => {
    // Initialize all categories for all days as enabled by default
    const initialState: Record<string, Record<string, boolean>> = {};
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    days.forEach((dayName, i) => {
      const day = addDays(weekStart, i);
      const dayKey = format(day, 'yyyy-MM-dd');
      initialState[dayKey] = {
        breakfast: true,
        lunch: true,
        dinner: true,
        snack: true
      };
    });
    return initialState;
  });
  const [daySettingsLoading, setDaySettingsLoading] = useState(true);

  // Load user settings on component mount
  useEffect(() => {
    const loadUserSettings = async () => {
      try {
        const settings = await authApi.getUserSettings();
        setUserSettings(settings);
      } catch (error) {
        console.error('Failed to load user settings:', error);
        // Fallback to default settings
        setUserSettings({
          enabledMealCategories: ['breakfast', 'lunch', 'dinner', 'snack']
        });
      } finally {
        setSettingsLoading(false);
      }
    };

    loadUserSettings();
  }, []);

  // Load weekly category settings when the week changes
  useEffect(() => {
    const loadWeeklyDaySettings = async () => {
      setDaySettingsLoading(true);
      try {
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
        const weekStartDate = format(weekStart, 'yyyy-MM-dd');
        
        const response = await fetch(`/api/weekly-day-settings?weekStart=${weekStartDate}`);
        if (response.ok) {
          const data = await response.json();
          if (data.enabledCategories) {
            // Convert the database format to our component format
            const dayMapping: Record<string, string> = {
              'sunday': format(addDays(weekStart, 0), 'yyyy-MM-dd'),
              'monday': format(addDays(weekStart, 1), 'yyyy-MM-dd'),
              'tuesday': format(addDays(weekStart, 2), 'yyyy-MM-dd'),
              'wednesday': format(addDays(weekStart, 3), 'yyyy-MM-dd'),
              'thursday': format(addDays(weekStart, 4), 'yyyy-MM-dd'),
              'friday': format(addDays(weekStart, 5), 'yyyy-MM-dd'),
              'saturday': format(addDays(weekStart, 6), 'yyyy-MM-dd'),
            };
            
            const newEnabledCategories: Record<string, Record<string, boolean>> = {};
            Object.entries(dayMapping).forEach(([dayName, dateStr]) => {
              newEnabledCategories[dateStr] = data.enabledCategories[dayName] ?? {
                breakfast: true,
                lunch: true,
                dinner: true,
                snack: true
              };
            });
            
            setEnabledCategories(newEnabledCategories);
          } else {
            // No settings found, use default (all enabled)
            const defaultEnabledCategories: Record<string, Record<string, boolean>> = {};
            for (let i = 0; i < 7; i++) {
              const day = addDays(weekStart, i);
              defaultEnabledCategories[format(day, 'yyyy-MM-dd')] = {
                breakfast: true,
                lunch: true,
                dinner: true,
                snack: true
              };
            }
            setEnabledCategories(defaultEnabledCategories);
          }
        } else {
          console.error('Failed to load weekly day settings');
          // Fallback to default
          const defaultEnabledCategories: Record<string, Record<string, boolean>> = {};
          const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
          for (let i = 0; i < 7; i++) {
            const day = addDays(weekStart, i);
            defaultEnabledCategories[format(day, 'yyyy-MM-dd')] = {
              breakfast: true,
              lunch: true,
              dinner: true,
              snack: true
            };
          }
          setEnabledCategories(defaultEnabledCategories);
        }
      } catch (error) {
        console.error('Error loading weekly day settings:', error);
        // Fallback to default
        const defaultEnabledCategories: Record<string, Record<string, boolean>> = {};
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
        for (let i = 0; i < 7; i++) {
          const day = addDays(weekStart, i);
          defaultEnabledCategories[format(day, 'yyyy-MM-dd')] = {
            breakfast: true,
            lunch: true,
            dinner: true,
            snack: true
          };
        }
        setEnabledCategories(defaultEnabledCategories);
      } finally {
        setDaySettingsLoading(false);
      }
    };

    loadWeeklyDaySettings();
  }, [currentDate]);

  // Effect to ensure remarks are loaded when the component is ready
  useEffect(() => {
    if (!settingsLoading && !daySettingsLoading) {
      // Trigger a refresh to ensure all RemarkIcon components load their data
      setRemarkRefreshTrigger(prev => prev + 1);
    }
  }, [settingsLoading, daySettingsLoading]);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 }); // Sunday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Function to save weekly category settings to the database
  const saveWeeklyCategorySettings = async (newEnabledCategories: Record<string, Record<string, boolean>>) => {
    try {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
      const weekStartDate = format(weekStart, 'yyyy-MM-dd');
      
      // Convert our component format to the database format
      const enabledCategories = {
        sunday: newEnabledCategories[format(addDays(weekStart, 0), 'yyyy-MM-dd')] ?? { breakfast: true, lunch: true, dinner: true, snack: true },
        monday: newEnabledCategories[format(addDays(weekStart, 1), 'yyyy-MM-dd')] ?? { breakfast: true, lunch: true, dinner: true, snack: true },
        tuesday: newEnabledCategories[format(addDays(weekStart, 2), 'yyyy-MM-dd')] ?? { breakfast: true, lunch: true, dinner: true, snack: true },
        wednesday: newEnabledCategories[format(addDays(weekStart, 3), 'yyyy-MM-dd')] ?? { breakfast: true, lunch: true, dinner: true, snack: true },
        thursday: newEnabledCategories[format(addDays(weekStart, 4), 'yyyy-MM-dd')] ?? { breakfast: true, lunch: true, dinner: true, snack: true },
        friday: newEnabledCategories[format(addDays(weekStart, 5), 'yyyy-MM-dd')] ?? { breakfast: true, lunch: true, dinner: true, snack: true },
        saturday: newEnabledCategories[format(addDays(weekStart, 6), 'yyyy-MM-dd')] ?? { breakfast: true, lunch: true, dinner: true, snack: true },
      };
      
      const response = await fetch('/api/weekly-day-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weekStart: weekStartDate,
          enabledCategories,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save weekly category settings');
      }
      
      console.log('Weekly category settings saved successfully');
    } catch (error) {
      console.error('Error saving weekly category settings:', error);
      // Could show a toast notification here
    }
  };

  // Helper function to check if a category is enabled for a specific day
  const isCategoryEnabled = (date: Date, category: string) => {
    const dayKey = format(date, 'yyyy-MM-dd');
    return enabledCategories[dayKey]?.[category] ?? true;
  };

  // Helper function to check if any category is enabled for a day
  const isDayEnabled = (date: Date) => {
    const dayKey = format(date, 'yyyy-MM-dd');
    const dayCategories = enabledCategories[dayKey];
    if (!dayCategories) return true;
    
    // Check if any category is enabled
    return Object.values(dayCategories).some(enabled => enabled);
  };

  // Helper function to toggle category enabled state
  const toggleCategoryEnabled = async (date: Date, category: string) => {
    const dayKey = format(date, 'yyyy-MM-dd');
    const newEnabledCategories = {
      ...enabledCategories,
      [dayKey]: {
        ...enabledCategories[dayKey],
        [category]: !enabledCategories[dayKey]?.[category]
      }
    };
    
    setEnabledCategories(newEnabledCategories);
    
    // Save to database
    await saveWeeklyCategorySettings(newEnabledCategories);
  };

  // Helper function to toggle all user's categories for a day (for single category users)
  const toggleDayEnabled = async (date: Date) => {
    const dayKey = format(date, 'yyyy-MM-dd');
    const userCategories = userSettings?.enabledMealCategories || ['breakfast', 'lunch', 'dinner', 'snack'];
    
    // Check if day is currently enabled (any user category is enabled)
    const currentlyEnabled = userCategories.some(category => 
      enabledCategories[dayKey]?.[category] ?? true
    );
    
    // Create new state: toggle all user categories
    const newDayState: Record<string, boolean> = { ...enabledCategories[dayKey] };
    userCategories.forEach(category => {
      newDayState[category] = !currentlyEnabled;
    });
    
    const newEnabledCategories = {
      ...enabledCategories,
      [dayKey]: newDayState
    };
    
    setEnabledCategories(newEnabledCategories);
    
    // Save to database
    await saveWeeklyCategorySettings(newEnabledCategories);
  };

  // Helper function to check if day is enabled for the user's categories
  const isDayEnabledForUser = (date: Date) => {
    const dayKey = format(date, 'yyyy-MM-dd');
    const userCategories = userSettings?.enabledMealCategories || ['breakfast', 'lunch', 'dinner', 'snack'];
    
    // Check if any of the user's enabled categories are enabled for this day
    return userCategories.some(category => 
      enabledCategories[dayKey]?.[category] ?? true
    );
  };

  const allMealCategories = [
    { key: 'breakfast', label: 'Breakfast', color: 'border-l-yellow-400' },
    { key: 'lunch', label: 'Lunch', color: 'border-l-green-400' },
    { key: 'dinner', label: 'Dinner', color: 'border-l-blue-400' },
    { key: 'snack', label: 'Snacks', color: 'border-l-purple-400' }
  ] as const;

  // Filter meal categories based on user settings
  const mealCategories = allMealCategories.filter(category => 
    userSettings?.enabledMealCategories?.includes(category.key) ?? true
  );

  const getMealsForDateAndCategory = (date: Date, category: string) => {
    // Check if category is enabled
    if (!userSettings?.enabledMealCategories?.includes(category)) {
      return [];
    }
    
    return meals.filter(meal => {
      const mealCategory = meal.meal?.tags?.[0]?.name || meal.category;
      // Filter by both date and category
      if (meal.plannedDate) {
        // Fix date parsing - create date in local timezone
        const [year, month, day] = meal.plannedDate.split('-').map(Number);
        const mealDate = new Date(year, month - 1, day); // month is 0-indexed
        return mealCategory === category && isSameDay(mealDate, date);
      }
      return mealCategory === category && isSameDay(date, new Date()); // Fallback for meals without plannedDate
    });
  };

  const handleAddMeal = (date: Date, category: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    // Don't allow adding meals to disabled categories
    if (!isCategoryEnabled(date, category)) {
      return;
    }
    
    setSelectedDate(date);
    setSelectedCategory(category);
    setEditingMeal(null);
    setIsModalOpen(true);
  };

  const handleEditMeal = (meal: Meal) => {
    setEditingMeal(meal);
    setSelectedDate(null);
    setSelectedCategory(undefined);
    setIsModalOpen(true);
  };

  const handleSaveMeal = (mealData: Omit<Meal, 'id'>, customDate?: Date) => {
    if (editingMeal) {
      // When editing, we need to pass the custom date if it changed
      const updatedMealData = { ...mealData };
      if (customDate) {
        // Include the planned date in the meal data for editing
        (updatedMealData as any).plannedDate = format(customDate, 'yyyy-MM-dd');
      }
      onEditMeal(editingMeal.id, updatedMealData);
    } else {
      // Use customDate if provided (from date picker), otherwise fall back to selectedDate
      const targetDate = customDate || selectedDate;
      if (targetDate) {
        onAddMeal(mealData, targetDate);
      }
    }
  };

  // Callback to refresh all remark icons when a remark is changed
  const handleRemarkChange = () => {
    setRemarkRefreshTrigger(prev => prev + 1);
  };

  const getDayTotalCalories = (date: Date) => {
    let total = 0;
    mealCategories.forEach(category => {
      const categoryMeals = getMealsForDateAndCategory(date, category.key);
      total += categoryMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
    });
    return total;
  };

  // Show loading state while settings are being fetched
  if (settingsLoading || daySettingsLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4 w-1/4"></div>
            <div className="grid grid-cols-8 gap-4">
              {Array.from({ length: 32 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Debug Info - Only show when debug mode is enabled */}
      {isDebugMode && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-sm text-yellow-800">
            <strong>Weekly Debug Info:</strong> Total meals: {meals.length}, Current week: {format(weekStart, 'yyyy-MM-dd')} to {format(addDays(weekStart, 6), 'yyyy-MM-dd')}
            <br />
            <strong>Meals by day:</strong>
            {weekDays.map(day => {
              const dayMeals = meals.filter(meal => {
                if (meal.plannedDate) {
                  const [year, month, dayNum] = meal.plannedDate.split('-').map(Number);
                  const mealDate = new Date(year, month - 1, dayNum);
                  return isSameDay(mealDate, day);
                }
                return false;
              });
              return (
                <div key={day.toISOString()}>
                  <strong>{format(day, 'EEE d')}:</strong> {dayMeals.length} meals
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Sticky Weekly Summary */}
      <div className="sticky top-24 z-10 bg-gray-50 pb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
            <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 truncate min-w-0 flex-1">
              <span className="hidden sm:inline">Week of </span>
              <span className="sm:hidden">Week </span>
              {format(weekStart, 'MMM d, yyyy')}
            </h2>
            
            {/* Edit Toggle Button */}
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                isEditMode
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span className="hidden xs:inline">{isEditMode ? 'Done' : 'Edit Categories'}</span>
              <span className="xs:hidden">{isEditMode ? 'Done' : 'Edit'}</span>
            </button>
          </div>
          
          {isEditMode && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 mb-2">
                <strong>Edit Mode:</strong> {mealCategories.length === 1 
                  ? 'Click on day boxes below to enable/disable days for meal planning. Disabled days will be greyed out and won\'t allow new meals to be added.'
                  : 'Click on category boxes below to enable/disable meal categories for each day. Disabled categories will be greyed out and won\'t allow new meals to be added.'
                }
              </p>
              
              {/* Bulk Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={async () => {
                    const userCategories = userSettings?.enabledMealCategories || ['breakfast', 'lunch', 'dinner', 'snack'];
                    const allEnabled: Record<string, Record<string, boolean>> = {};
                    weekDays.forEach(day => {
                      const dayState = { ...enabledCategories[format(day, 'yyyy-MM-dd')] };
                      userCategories.forEach(category => {
                        dayState[category] = true;
                      });
                      allEnabled[format(day, 'yyyy-MM-dd')] = dayState;
                    });
                    setEnabledCategories(allEnabled);
                    await saveWeeklyCategorySettings(allEnabled);
                  }}
                  className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                >
                  {mealCategories.length === 1 ? 'Enable All Days' : 'Enable All Categories'}
                </button>
                <button
                  onClick={async () => {
                    const userCategories = userSettings?.enabledMealCategories || ['breakfast', 'lunch', 'dinner', 'snack'];
                    const allDisabled: Record<string, Record<string, boolean>> = {};
                    weekDays.forEach(day => {
                      const dayState = { ...enabledCategories[format(day, 'yyyy-MM-dd')] };
                      userCategories.forEach(category => {
                        dayState[category] = false;
                      });
                      allDisabled[format(day, 'yyyy-MM-dd')] = dayState;
                    });
                    setEnabledCategories(allDisabled);
                    await saveWeeklyCategorySettings(allDisabled);
                  }}
                  className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  {mealCategories.length === 1 ? 'Disable All Days' : 'Disable All Categories'}
                </button>
              </div>
            </div>
          )}
        
        {/* Category Groups */}
        <div className="space-y-6">
          {mealCategories.length === 1 ? (
            // Single category: Show as one group with overlapping label
            <div className="relative">
              {/* Overlapping Category Label */}
              <div className="absolute -top-3 left-4 z-10">
                <span className="bg-white px-3 py-1 text-xs font-medium text-gray-700 border border-gray-200 rounded-full shadow-sm">
                  {mealCategories[0].label}
                </span>
              </div>
              
              {/* Group Box */}
              <div className="bg-white border border-gray-200 rounded-lg pt-4 pb-3 px-3">
                <div className="grid grid-cols-7 gap-1">
                  {weekDays.map((day) => {
                    const isToday = isSameDay(day, new Date());
                    const userCategories = userSettings?.enabledMealCategories || [];
                    const dayEnabled = userCategories.some(category => 
                      enabledCategories[format(day, 'yyyy-MM-dd')]?.[category] ?? true
                    );
                    const dayMeals = getMealsForDateAndCategory(day, mealCategories[0].key);
                    
                    if (isEditMode) {
                      // Edit mode: Show toggle
                      return (
                        <button
                          key={day.toISOString()}
                          onClick={() => toggleDayEnabled(day)}
                          className={`min-h-[70px] sm:min-h-[80px] w-full text-center p-2 rounded transition-all border flex flex-col justify-center ${
                            dayEnabled
                              ? (isToday 
                                ? 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100' 
                                : 'bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100')
                              : 'bg-red-100 border-red-200 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          <div className="text-xs sm:text-sm lg:text-lg xl:text-xl font-medium">{format(day, 'EEE')}</div>
                          <div className="text-xs sm:text-sm lg:text-lg xl:text-2xl font-semibold">{format(day, 'd')}</div>
                          <div className="text-sm lg:text-base xl:text-lg font-bold">{dayEnabled ? '✓' : '✗'}</div>
                        </button>
                      );
                    } else {
                      // Display mode: Show meal counts
                      return (
                        <div
                          key={day.toISOString()}
                          className={`aspect-square text-center p-2 rounded transition-all flex flex-col justify-center ${
                            !dayEnabled 
                              ? 'bg-red-100 border border-red-200' 
                              : isToday 
                                ? 'bg-blue-50 border border-blue-200' 
                                : 'bg-gray-50 border border-gray-200'
                          }`}
                        >
                          <div className={`text-sm lg:text-lg xl:text-xl font-medium ${
                            !dayEnabled 
                              ? 'text-red-700' 
                              : isToday 
                                ? 'text-blue-800' 
                                : 'text-gray-700'
                          }`}>{format(day, 'EEE')}</div>
                          <div className={`text-sm lg:text-lg xl:text-2xl font-semibold ${
                            !dayEnabled 
                              ? 'text-red-700' 
                              : isToday 
                                ? 'text-blue-800' 
                                : 'text-gray-700'
                          }`}>{format(day, 'd')}</div>
                          <div className={`text-sm lg:text-base xl:text-lg ${
                            !dayEnabled 
                              ? 'text-red-700' 
                              : isToday 
                                ? 'text-blue-800' 
                                : 'text-gray-700'
                          }`}>
                            <span className="sm:hidden">{dayMeals.length}</span>
                            <span className="hidden sm:inline">{dayMeals.length} meal{dayMeals.length !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      );
                    }
                  })}
                </div>
              </div>
            </div>
          ) : (
            // Multiple categories: Show separate groups for each category with overlapping labels
            mealCategories.map((category) => (
              <div key={category.key} className="relative">
                {/* Overlapping Category Label */}
                <div className="absolute -top-3 left-4 z-10">
                  <span className="bg-white px-3 py-1 text-xs font-medium text-gray-700 border border-gray-200 rounded-full shadow-sm">
                    {category.label}
                  </span>
                </div>
                
                {/* Group Box */}
                <div className="bg-white border border-gray-200 rounded-lg pt-4 pb-3 px-3">
                  <div className="grid grid-cols-7 gap-1">
                    {weekDays.map((day) => {
                      const isToday = isSameDay(day, new Date());
                      const isEnabled = isCategoryEnabled(day, category.key);
                      const dayMeals = getMealsForDateAndCategory(day, category.key);
                      
                      if (isEditMode) {
                        // Edit mode: Show toggles
                        return (
                          <button
                            key={day.toISOString()}
                            onClick={() => toggleCategoryEnabled(day, category.key)}
                            className={`min-h-[70px] sm:min-h-[80px] w-full text-center p-2 rounded transition-all border flex flex-col justify-center ${
                              isEnabled
                                ? (isToday 
                                  ? 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100' 
                                  : 'bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100')
                                : 'bg-red-100 border-red-200 text-red-700 hover:bg-red-200'
                            }`}
                          >
                            <div className="text-xs sm:text-sm lg:text-lg xl:text-xl font-medium">{format(day, 'EEE')}</div>
                            <div className="text-xs sm:text-sm lg:text-lg xl:text-2xl font-semibold">{format(day, 'd')}</div>
                            <div className="text-sm lg:text-base xl:text-lg font-bold">{isEnabled ? '✓' : '✗'}</div>
                          </button>
                        );
                      } else {
                        // Display mode: Show meal counts
                        return (
                          <div
                            key={day.toISOString()}
                            className={`aspect-square text-center p-2 rounded transition-all flex flex-col justify-center ${
                              !isEnabled 
                                ? 'bg-red-100 border border-red-200' 
                                : isToday 
                                  ? 'bg-blue-50 border border-blue-200' 
                                  : 'bg-gray-50 border border-gray-200'
                            }`}
                          >
                            <div className={`text-sm lg:text-lg xl:text-xl font-medium ${
                              !isEnabled 
                                ? 'text-red-700' 
                                : isToday 
                                  ? 'text-blue-800' 
                                  : 'text-gray-700'
                            }`}>{format(day, 'EEE')}</div>
                            <div className={`text-sm lg:text-lg xl:text-2xl font-semibold ${
                              !isEnabled 
                                ? 'text-red-700' 
                                : isToday 
                                  ? 'text-blue-800' 
                                  : 'text-gray-700'
                            }`}>{format(day, 'd')}</div>
                            <div className={`text-sm lg:text-base xl:text-lg ${
                              !isEnabled 
                                ? 'text-red-700' 
                                : isToday 
                                  ? 'text-blue-800' 
                                  : 'text-gray-700'
                            }`}>
                              <span className="sm:hidden">{dayMeals.length}</span>
                              <span className="hidden sm:inline">{dayMeals.length} meal{dayMeals.length !== 1 ? 's' : ''}</span>
                            </div>
                          </div>
                        );
                      }
                    })}
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Dedicated Remarks Group with Overlapping Label */}
          <div className="relative">
            {/* Overlapping Remarks Label */}
            <div className="absolute -top-3 left-4 z-10">
              <span className="bg-white px-3 py-1 text-xs font-medium text-gray-700 border border-gray-200 rounded-full shadow-sm">
                Remarks
              </span>
            </div>
            
            {/* Group Box */}
            <div className="bg-white border border-gray-200 rounded-lg pt-4 pb-3 px-3">
              <div className="grid grid-cols-7 gap-1">
                {weekDays.map((day) => {
                  const isToday = isSameDay(day, new Date());
                  
                  return (
                    <div
                      key={day.toISOString()}
                      className={`aspect-square text-center p-2 rounded transition-all flex flex-col justify-center ${
                        isToday 
                          ? 'bg-blue-50 border border-blue-200' 
                          : 'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <div className={`text-sm lg:text-lg xl:text-xl font-medium ${
                        isToday 
                          ? 'text-blue-800' 
                          : 'text-gray-700'
                      }`}>{format(day, 'EEE')}</div>
                      <div className={`text-sm lg:text-lg xl:text-2xl font-semibold ${
                        isToday 
                          ? 'text-blue-800' 
                          : 'text-gray-700'
                      }`}>{format(day, 'd')}</div>
                      <div className="flex justify-center mt-1">
                        <RemarkIcon 
                          date={day} 
                          size="small" 
                          showAddButton={true}
                          externalRefreshTrigger={remarkRefreshTrigger}
                          onRemarkChange={handleRemarkChange}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Horizontal Days Layout */}
      <div className="space-y-4">
        {weekDays.filter((day) => isDayEnabledForUser(day)).length === 0 ? (
          /* Show message when all categories for all days are disabled */
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4v10m4-10v10m-8 4h12a2 2 0 002-2V9a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Categories Enabled</h3>
            <p className="text-gray-600 mb-4">
              All meal categories for this week are currently disabled. Use the "Edit Categories" button above to enable categories for meal planning.
            </p>
            <button
              onClick={() => setIsEditMode(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Enable Categories
            </button>
          </div>
        ) : (
          weekDays
            .filter((day) => isDayEnabledForUser(day)) // Only show days enabled for user's categories
            .map((day) => {
          const isToday = isSameDay(day, new Date());
          const totalCalories = getDayTotalCalories(day);
          const dayEnabled = isDayEnabled(day);
          
          return (
            <div key={day.toISOString()} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Day Header */}
              <div className={`px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 ${
                isToday 
                  ? 'bg-blue-50' 
                  : 'bg-gray-50'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <h3 className={`text-base sm:text-lg font-semibold truncate ${
                      isToday 
                        ? 'text-blue-900' 
                        : 'text-gray-900'
                    }`}>
                      {format(day, 'EEEE, MMMM d')}
                    </h3>
                    <RemarkIcon 
                      date={day} 
                      size="medium"
                      externalRefreshTrigger={remarkRefreshTrigger}
                      onRemarkChange={handleRemarkChange}
                    />
                    {isToday && (
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full flex-shrink-0">
                        Today
                      </span>
                    )}
                  </div>
                  <div className={`text-sm flex-shrink-0 ml-2 ${
                    isToday 
                      ? 'text-blue-700' 
                      : 'text-gray-600'
                  }`}>
                    {totalCalories} calories
                  </div>
                </div>
              </div>

              {/* Meal Categories for this day */}
              <div className="p-3 sm:p-6">
                <div className={(() => {
                  // Dynamic grid based on number of enabled categories for this day
                  const enabledCategoriesForDay = mealCategories.filter(category => isCategoryEnabled(day, category.key));
                  const numCategories = enabledCategoriesForDay.length;
                  let gridClass = 'grid gap-3 sm:gap-4 ';
                  
                  if (numCategories === 1) {
                    return gridClass + 'grid-cols-1'; // Single category uses full width
                  } else if (numCategories === 2) {
                    return gridClass + 'grid-cols-1 sm:grid-cols-2'; // Two categories
                  } else if (numCategories === 3) {
                    return gridClass + 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'; // Three categories
                  } else {
                    return gridClass + 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'; // Four categories (original)
                  }
                })()}>
                  {mealCategories.filter(category => isCategoryEnabled(day, category.key)).map((category) => {
                    const dayMeals = getMealsForDateAndCategory(day, category.key);
                    const categoryCalories = dayMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
                    
                    return (
                      <div key={category.key} className={`border-l-4 ${category.color} bg-gray-50 rounded-r-lg`}>
                        {/* Category Header */}
                        <div className="px-3 py-2 border-b border-gray-200">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900">
                              {category.label}
                            </h4>
                            <span className="text-xs text-gray-600">
                              {categoryCalories} cal
                            </span>
                          </div>
                        </div>
                        
                        {/* Meals */}
                        <div className="p-3 space-y-2 min-h-[100px]">
                          {dayMeals
                            .sort((a, b) => {
                              // Sort meals by username (group by user)
                              const userA = a.addedBy?.username || '';
                              const userB = b.addedBy?.username || '';
                              return userA.localeCompare(userB);
                            })
                            .map((meal) => (
                            <div key={meal.id}>
                              <MealCard
                                meal={meal}
                                currentUser={currentUser}
                                onEdit={handleEditMeal}
                                onDelete={onDeleteMeal}
                                compact
                              />
                            </div>
                          ))}
                          
                          {/* Add Meal Button */}
                          <button
                            onClick={() => handleAddMeal(day, category.key)}
                            className="w-full p-2 border-2 border-dashed border-gray-300 rounded-md text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors text-xs"
                          >
                            <svg className="w-4 h-4 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add {category.label}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })
        )}
      </div>

      {/* Meal Form Modal */}
      <MealFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveMeal}
        editingMeal={editingMeal}
        selectedDate={selectedDate || currentDate}
        selectedCategory={selectedCategory}
        existingMeals={existingMeals}
        userSettings={userSettings}
      />
    </div>
  );
}
