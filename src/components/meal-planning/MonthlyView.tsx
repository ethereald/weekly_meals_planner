'use client';

import { useState, useEffect } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  isSameMonth, 
  isSameDay,
  isToday 
} from 'date-fns';
import { Meal } from './MealCard';
import MealFormModal from './MealFormModal';
import { SavedMeal } from '../../lib/api/meals';
import { authApi, UserSettings } from '../../lib/auth-client';

interface MonthlyViewProps {
  currentDate: Date;
  meals: Meal[];
  existingMeals?: SavedMeal[];
  currentUser: { id: string; username: string; role: string } | null;
  onAddMeal: (meal: Omit<Meal, 'id'>, date: Date) => void;
  onEditMeal: (id: string, meal: Omit<Meal, 'id'>) => void;
  onDeleteMeal: (id: string) => void;
  onDateSelect: (date: Date) => void;
  isDebugMode?: boolean;
}

export default function MonthlyView({
  currentDate,
  meals,
  existingMeals = [],
  currentUser,
  onAddMeal,
  onEditMeal,
  onDeleteMeal,
  onDateSelect,
  isDebugMode = false
}: MonthlyViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);

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

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const calendarDays = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    calendarDays.push(day);
    day = addDays(day, 1);
  }

  // Define meal category colors and labels
  const mealCategoryConfig = {
    breakfast: { color: 'bg-yellow-200', textColor: 'text-yellow-800', label: 'Breakfast' },
    lunch: { color: 'bg-green-200', textColor: 'text-green-800', label: 'Lunch' },
    dinner: { color: 'bg-blue-200', textColor: 'text-blue-800', label: 'Dinner' },
    snack: { color: 'bg-purple-200', textColor: 'text-purple-800', label: 'Snacks' }
  };

  // Get enabled meal categories with their configs
  const enabledCategories = (userSettings?.enabledMealCategories || []).map(key => ({
    key,
    ...mealCategoryConfig[key as keyof typeof mealCategoryConfig]
  }));

  const getMealsForDate = (date: Date) => {
    // Filter meals by the specific date and enabled categories
    return meals.filter(meal => {
      // Check if meal category is enabled
      const mealCategory = meal.meal?.tags?.[0]?.name || meal.category;
      const isCategoryEnabled = userSettings?.enabledMealCategories.includes(mealCategory);
      
      if (!isCategoryEnabled) {
        return false;
      }
      
      if (meal.plannedDate) {
        // Fix date parsing - create date in local timezone
        const [year, month, day] = meal.plannedDate.split('-').map(Number);
        const mealDate = new Date(year, month - 1, day); // month is 0-indexed
        return isSameDay(mealDate, date);
      }
      return false;
    });
  };

  const getDayMealCount = (date: Date) => {
    const dayMeals = getMealsForDate(date);
    return dayMeals.length;
  };

  const getDayCalories = (date: Date) => {
    const dayMeals = getMealsForDate(date);
    return dayMeals.reduce((total, meal) => total + (meal.calories || 0), 0);
  };

  const handleDayClick = (date: Date) => {
    onDateSelect(date);
  };

  const handleAddMeal = (date: Date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleSaveMeal = (mealData: Omit<Meal, 'id'>) => {
    if (selectedDate) {
      onAddMeal(mealData, selectedDate);
    }
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Show loading state while settings are being fetched
  if (settingsLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
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
            <strong>Monthly Debug Info:</strong> Total meals: {meals.length}, Current month: {format(currentDate, 'MMMM yyyy')}
            <br />
            <strong>Month date range:</strong> {format(monthStart, 'yyyy-MM-dd')} to {format(monthEnd, 'yyyy-MM-dd')}
            <br />
            <strong>Calendar range:</strong> {format(calendarStart, 'yyyy-MM-dd')} to {format(calendarEnd, 'yyyy-MM-dd')}
            <br />
            <strong>Days with meals:</strong> {calendarDays.filter(day => isSameMonth(day, currentDate) && getDayMealCount(day) > 0).length}
            <br />
            <strong>Total meals in month:</strong> {calendarDays.filter(day => isSameMonth(day, currentDate)).reduce((total, day) => total + getDayMealCount(day), 0)}
            <br />
            <strong>Meals by category:</strong>
            {(userSettings?.enabledMealCategories || []).map(category => {
              const categoryMeals = meals.filter(meal => meal.category === category);
              return (
                <div key={category}>
                  <strong>{category}:</strong> {categoryMeals.length} meals
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Monthly Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {calendarDays.filter(day => isSameMonth(day, currentDate) && getDayMealCount(day) > 0).length}
            </div>
            <div className="text-sm text-yellow-800">Days with meals</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {calendarDays
                .filter(day => isSameMonth(day, currentDate))
                .reduce((total, day) => total + getDayMealCount(day), 0)
              }
            </div>
            <div className="text-sm text-green-800">Total meals</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(
                calendarDays
                  .filter(day => isSameMonth(day, currentDate))
                  .reduce((total, day) => total + getDayCalories(day), 0) /
                calendarDays.filter(day => isSameMonth(day, currentDate) && getDayMealCount(day) > 0).length || 0
              )}
            </div>
            <div className="text-sm text-blue-800">Avg calories/day</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {calendarDays
                .filter(day => isSameMonth(day, currentDate))
                .reduce((total, day) => total + getDayCalories(day), 0)
              }
            </div>
            <div className="text-sm text-purple-800">Total calories</div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Calendar Header */}
        <div className="grid grid-cols-7 divide-x divide-gray-200 bg-gray-50">
          {weekDays.map((day) => (
            <div key={day} className="p-4 text-center">
              <div className="text-sm font-medium text-gray-900">{day}</div>
            </div>
          ))}
        </div>

        {/* Calendar Body */}
        <div className="grid grid-cols-7 divide-x divide-gray-200">
          {calendarDays.map((day) => {
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isCurrentDay = isToday(day);
            const dayMeals = getMealsForDate(day);
            const dayCalories = getDayCalories(day);
            const mealCount = getDayMealCount(day);

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[120px] p-2 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                  !isCurrentMonth ? 'bg-gray-25 text-gray-400' : ''
                } ${isCurrentDay ? 'bg-blue-50' : ''}`}
                onClick={() => handleDayClick(day)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${
                    isCurrentDay ? 'text-blue-600' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {format(day, 'd')}
                  </span>
                  {isCurrentMonth && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddMeal(day);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 hover:bg-white rounded-full transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  )}
                </div>

                {isCurrentMonth && mealCount > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">{mealCount} meals</span>
                      <span className="text-gray-600">{dayCalories} cal</span>
                    </div>
                    
                    {/* Meal indicators */}
                    <div className="space-y-1">
                      {dayMeals.slice(0, 3).map((meal, index) => {
                        const categoryConfig = mealCategoryConfig[meal.category as keyof typeof mealCategoryConfig];
                        
                        return (
                          <div
                            key={index}
                            className={`text-xs p-1 rounded truncate ${categoryConfig?.color || 'bg-gray-200'} ${
                              categoryConfig?.textColor || 'text-gray-800'
                            }`}
                          >
                            {meal.name}
                          </div>
                        );
                      })}
                      {mealCount > 3 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{mealCount - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {isCurrentMonth && mealCount === 0 && (
                  <div className="text-center py-4">
                    <div className="text-xs text-gray-400">No meals</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Meal Types</h3>
        <div className="flex flex-wrap gap-4">
          {enabledCategories.map(category => (
            <div key={category.key} className="flex items-center gap-2">
              <div className={`w-3 h-3 ${category.color} rounded`}></div>
              <span className="text-xs text-gray-600">{category.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Meal Form Modal */}
      <MealFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveMeal}
        editingMeal={null}
        selectedDate={selectedDate || currentDate}
        existingMeals={existingMeals}
        userSettings={userSettings}
      />
    </div>
  );
}
