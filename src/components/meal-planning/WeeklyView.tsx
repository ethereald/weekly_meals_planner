'use client';

import { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import MealCard, { Meal } from './MealCard';
import MealFormModal from './MealFormModal';
import { SavedMeal } from '../../lib/api/meals';
import { authApi, UserSettings } from '../../lib/auth-client';

interface WeeklyViewProps {
  currentDate: Date;
  meals: Meal[];
  existingMeals?: SavedMeal[];
  onAddMeal: (meal: Omit<Meal, 'id'>, date: Date) => void;
  onEditMeal: (id: string, meal: Omit<Meal, 'id'>) => void;
  onDeleteMeal: (id: string) => void;
  isDebugMode?: boolean;
}

export default function WeeklyView({
  currentDate,
  meals,
  existingMeals = [],
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

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 }); // Sunday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const allMealCategories = [
    { key: 'breakfast', label: 'Breakfast', color: 'border-l-yellow-400' },
    { key: 'lunch', label: 'Lunch', color: 'border-l-green-400' },
    { key: 'dinner', label: 'Dinner', color: 'border-l-blue-400' },
    { key: 'snack', label: 'Snacks', color: 'border-l-purple-400' }
  ] as const;

  // Filter meal categories based on user settings
  const mealCategories = allMealCategories.filter(category => 
    userSettings?.enabledMealCategories.includes(category.key)
  );

  const getMealsForDateAndCategory = (date: Date, category: string) => {
    // Check if category is enabled
    if (!userSettings?.enabledMealCategories.includes(category)) {
      return [];
    }
    
    return meals.filter(meal => {
      const mealCategory = meal.meal?.mealType || meal.category;
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

  const handleSaveMeal = (mealData: Omit<Meal, 'id'>) => {
    if (editingMeal) {
      onEditMeal(editingMeal.id, mealData);
    } else if (selectedDate) {
      onAddMeal(mealData, selectedDate);
    }
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
  if (settingsLoading) {
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
      
      {/* Weekly Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Week of {format(weekStart, 'MMMM d, yyyy')}
        </h2>
        
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const isToday = isSameDay(day, new Date());
            const totalCalories = getDayTotalCalories(day);
            
            return (
              <div key={day.toISOString()} className={`text-center p-3 rounded-lg ${
                isToday ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
              }`}>
                <div className={`text-sm font-medium ${isToday ? 'text-blue-900' : 'text-gray-900'}`}>
                  {format(day, 'EEE')}
                </div>
                <div className={`text-lg font-semibold ${isToday ? 'text-blue-900' : 'text-gray-900'}`}>
                  {format(day, 'd')}
                </div>
                <div className={`text-xs ${isToday ? 'text-blue-700' : 'text-gray-600'}`}>
                  {totalCalories} cal
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly Grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-8 divide-x divide-gray-200">
          {/* Header */}
          <div className="bg-gray-50 p-4 min-w-0">
            <div className="text-sm font-medium text-gray-900">Meals</div>
          </div>
          {weekDays.map((day) => {
            const isToday = isSameDay(day, new Date());
            return (
              <div key={day.toISOString()} className={`p-4 min-w-0 ${isToday ? 'bg-blue-50' : 'bg-gray-50'}`}>
                <div className={`text-sm font-medium ${isToday ? 'text-blue-900' : 'text-gray-900'}`}>
                  {format(day, 'EEE')}
                </div>
                <div className={`text-lg font-semibold ${isToday ? 'text-blue-900' : 'text-gray-900'}`}>
                  {format(day, 'd')}
                </div>
              </div>
            );
          })}

          {/* Meal Categories */}
          {mealCategories.map((category) => (
            <div key={category.key} className="contents">
              {/* Category Label */}
              <div className={`p-4 bg-gray-50 border-l-4 ${category.color} flex items-center min-w-0`}>
                <div className="text-sm font-medium text-gray-900 capitalize">
                  {category.label}
                </div>
              </div>

              {/* Day Cells */}
              {weekDays.map((day) => {
                const dayMeals = getMealsForDateAndCategory(day, category.key);
                const isToday = isSameDay(day, new Date());
                
                return (
                  <div key={`${day.toISOString()}-${category.key}`} className={`p-2 min-h-[120px] min-w-0 ${
                    isToday ? 'bg-blue-25' : ''
                  }`}>
                    <div className="space-y-2">
                      {dayMeals.slice(0, 2).map((meal) => (
                        <MealCard
                          key={meal.id}
                          meal={meal}
                          onEdit={handleEditMeal}
                          onDelete={onDeleteMeal}
                          compact
                        />
                      ))}
                      
                      {dayMeals.length > 2 && (
                        <div className="text-xs text-gray-500 text-center py-1">
                          +{dayMeals.length - 2} more
                        </div>
                      )}
                      
                      <button
                        onClick={() => handleAddMeal(day, category.key)}
                        className="w-full p-2 border-2 border-dashed border-gray-300 rounded-md text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors text-xs"
                      >
                        <svg className="w-4 h-4 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
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
      />
    </div>
  );
}
