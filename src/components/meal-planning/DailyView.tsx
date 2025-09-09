'use client';

import { useState, useEffect } from 'react';
import { format, isSameDay } from 'date-fns';
import MealCard, { Meal } from './MealCard';
import MealFormModal from './MealFormModal';
import DailyRemark from './DailyRemark';
import { SavedMeal } from '../../lib/api/meals';
import { authApi, UserSettings } from '../../lib/auth-client';

interface DailyViewProps {
  currentDate: Date;
  meals: Meal[];
  existingMeals?: SavedMeal[];
  currentUser: { id: string; username: string; displayName?: string; role: string } | null;
  onAddMeal: (meal: Omit<Meal, 'id'>, date?: Date) => void;
  onEditMeal: (id: string, meal: Omit<Meal, 'id'>) => void;
  onDeleteMeal: (id: string) => void;
  isDebugMode?: boolean;
}

export default function DailyView({
  currentDate,
  meals,
  existingMeals = [],
  currentUser,
  onAddMeal,
  onEditMeal,
  onDeleteMeal,
  isDebugMode = false
}: DailyViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
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

  const allMealCategories = [
    { key: 'breakfast', label: 'Breakfast', icon: '🌅' },
    { key: 'lunch', label: 'Lunch', icon: '☀️' },
    { key: 'dinner', label: 'Dinner', icon: '🌙' },
    { key: 'snack', label: 'Snacks', icon: '🍿' }
  ] as const;

  // Filter meal categories based on user settings
  const mealCategories = allMealCategories.filter(category => 
    userSettings?.enabledMealCategories.includes(category.key)
  );

  // Test function to debug the filtering issue
  const testFiltering = () => {
    const testMeal = meals[0]; // Get the first meal
    if (!testMeal) return "No meals to test";
    
    const mealCategory = testMeal.meal?.tags?.[0]?.name || testMeal.category;
    const categoryMatch = mealCategory === 'snack'; // Test against snack since that's what we have
    
    if (testMeal.plannedDate) {
      // Fix date parsing - create date in local timezone
      const [year, month, day] = testMeal.plannedDate.split('-').map(Number);
      const mealDate = new Date(year, month - 1, day); // month is 0-indexed
      const dateMatch = isSameDay(mealDate, currentDate);
      
      return {
        mealName: testMeal.name,
        mealCategory,
        categoryMatch,
        plannedDate: testMeal.plannedDate,
        mealDateParsed: mealDate.toString(),
        currentDate: currentDate.toString(),
        dateMatch,
        shouldShow: categoryMatch && dateMatch
      };
    }
    
    return "No planned date";
  };

  const getMealsForCategory = (category: string) => {
    console.log(`🔍 getMealsForCategory called for "${category}"`);
    console.log('📊 Total meals to filter:', meals.length);
    
    // Check if category is enabled
    if (!userSettings?.enabledMealCategories.includes(category)) {
      console.log(`❌ Category "${category}" is not enabled for this user`);
      return [];
    }
    
    const filteredMeals = meals.filter(meal => {
      const mealCategory = meal.meal?.tags?.[0]?.name || meal.category;
      
      console.log('🔍 Filtering meal:', {
        mealName: meal.name,
        mealCategory,
        requestedCategory: category,
        plannedDate: meal.plannedDate,
        currentDate: format(currentDate, 'yyyy-MM-dd'),
      });
      
      // Check category match first
      const categoryMatch = mealCategory === category;
      console.log('📊 Category match:', mealCategory, '===', category, '→', categoryMatch);
      
      // Only show meals for the current date
      if (meal.plannedDate) {
        // Fix date parsing - create date in local timezone
        const [year, month, day] = meal.plannedDate.split('-').map(Number);
        const mealDate = new Date(year, month - 1, day); // month is 0-indexed
        const dateMatch = isSameDay(mealDate, currentDate);
        
        console.log('📊 Date comparison:', {
          mealDateString: meal.plannedDate,
          mealDateParsed: format(mealDate, 'yyyy-MM-dd'),
          currentDateFormatted: format(currentDate, 'yyyy-MM-dd'),
          dateMatch,
          categoryMatch,
          finalResult: categoryMatch && dateMatch
        });
        
        return categoryMatch && dateMatch;
      }
      
      // If no plannedDate, just check category
      console.log('⚠️ No plannedDate, using category only:', categoryMatch);
      return categoryMatch;
    });
    
    console.log(`✅ Category "${category}" filtered meals:`, filteredMeals.length, filteredMeals);
    return filteredMeals;
  };

  const handleAddMeal = (category: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    setSelectedCategory(category);
    setEditingMeal(null);
    setIsModalOpen(true);
  };

  const handleEditMeal = (meal: Meal) => {
    setEditingMeal(meal);
    setSelectedCategory(undefined);
    setIsModalOpen(true);
  };

  const handleSaveMeal = (mealData: Omit<Meal, 'id'>) => {
    if (editingMeal) {
      onEditMeal(editingMeal.id, mealData);
    } else {
      onAddMeal(mealData, currentDate); // Pass the current date
    }
  };

  const getTotalCalories = () => {
    return meals.reduce((total, meal) => total + (meal.calories || 0), 0);
  };

  // Show loading state while settings are being fetched
  if (settingsLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
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
            <strong>Debug Info:</strong> Total meals: {meals.length}, Current date: {format(currentDate, 'yyyy-MM-dd')}
            <br />
            <strong>Meals data:</strong> {JSON.stringify(meals.map(m => ({
              name: m.name,
              category: m.category,
              tags: m.meal?.tags?.map(t => t.name),
              plannedDate: m.plannedDate
            })), null, 2)}
            <br />
            <strong>Dinner meals:</strong> {getMealsForCategory('dinner').length}
            <br />
            <strong>Breakfast meals:</strong> {getMealsForCategory('breakfast').length}
            <br />
            <strong>Lunch meals:</strong> {getMealsForCategory('lunch').length}
            <br />
            <strong>Snack meals:</strong> {getMealsForCategory('snack').length}
            <br />
            <strong>Filter test:</strong> {JSON.stringify(testFiltering(), null, 2)}
          </div>
        </div>
      )}
      
      {/* Daily Remark */}
      <DailyRemark date={currentDate} />
      
      {/* Sticky Daily Summary */}
      <div className="sticky top-24 z-10 bg-gray-50 pb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
            {format(currentDate, 'EEEE, MMMM d, yyyy')}
          </h2>
          <div className="text-sm text-gray-600 flex-shrink-0">
            Total: <span className="font-semibold text-gray-900">{getTotalCalories()} cal</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
          {mealCategories.map((category) => {
            const categoryMeals = getMealsForCategory(category.key);
            const categoryCalories = categoryMeals.reduce((total, meal) => total + (meal.calories || 0), 0);
            
            return (
              <div key={category.key} className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                <div className="text-xl sm:text-2xl mb-1">{category.icon}</div>
                <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">{category.label}</div>
                <div className="text-xs text-gray-600">{categoryMeals.length} meal{categoryMeals.length !== 1 ? 's' : ''}</div>
                <div className="text-xs text-gray-600">{categoryCalories} cal</div>
              </div>
            );
          })}
        </div>
        </div>
      </div>

      {/* Meal Categories */}
      {mealCategories.map((category) => {
        const categoryMeals = getMealsForCategory(category.key);
        
        return (
          <div key={category.key} className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{category.icon}</span>
                  <h3 className="text-lg font-semibold text-gray-900">{category.label}</h3>
                  <span className="text-sm text-gray-500">({categoryMeals.length})</span>
                </div>
                <button
                  onClick={() => handleAddMeal(category.key)}
                  className="inline-flex items-center gap-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Meal
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {categoryMeals.length > 0 ? (
                <div className="space-y-3">
                  {categoryMeals
                    .sort((a, b) => {
                      // Sort meals by username (group by user)
                      const userA = a.addedBy?.username || '';
                      const userB = b.addedBy?.username || '';
                      return userA.localeCompare(userB);
                    })
                    .map((meal) => (
                    <MealCard
                      key={meal.id}
                      meal={meal}
                      currentUser={currentUser}
                      onEdit={handleEditMeal}
                      onDelete={onDeleteMeal}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <p>No meals planned for {category.label.toLowerCase()}</p>
                  <button
                    onClick={() => handleAddMeal(category.key)}
                    className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Add your first meal
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Meal Form Modal */}
      <MealFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveMeal}
        editingMeal={editingMeal}
        selectedDate={currentDate}
        selectedCategory={selectedCategory}
        existingMeals={existingMeals}
        userSettings={userSettings}
      />
    </div>
  );
}
