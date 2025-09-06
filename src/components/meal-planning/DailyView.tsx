'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import MealCard, { Meal } from './MealCard';
import MealFormModal from './MealFormModal';

interface DailyViewProps {
  currentDate: Date;
  meals: Meal[];
  onAddMeal: (meal: Omit<Meal, 'id'>) => void;
  onEditMeal: (id: string, meal: Omit<Meal, 'id'>) => void;
  onDeleteMeal: (id: string) => void;
}

export default function DailyView({
  currentDate,
  meals,
  onAddMeal,
  onEditMeal,
  onDeleteMeal
}: DailyViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack' | undefined>();

  const mealCategories = [
    { key: 'breakfast', label: 'Breakfast', icon: '🌅' },
    { key: 'lunch', label: 'Lunch', icon: '☀️' },
    { key: 'dinner', label: 'Dinner', icon: '🌙' },
    { key: 'snack', label: 'Snacks', icon: '🍿' }
  ] as const;

  const getMealsForCategory = (category: string) => {
    return meals.filter(meal => meal.category === category);
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
      onAddMeal(mealData);
    }
  };

  const getTotalCalories = () => {
    return meals.reduce((total, meal) => total + (meal.calories || 0), 0);
  };

  return (
    <div className="space-y-6">
      {/* Daily Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {format(currentDate, 'EEEE, MMMM d, yyyy')}
          </h2>
          <div className="text-sm text-gray-600">
            Total: <span className="font-semibold text-gray-900">{getTotalCalories()} calories</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {mealCategories.map((category) => {
            const categoryMeals = getMealsForCategory(category.key);
            const categoryCalories = categoryMeals.reduce((total, meal) => total + (meal.calories || 0), 0);
            
            return (
              <div key={category.key} className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-1">{category.icon}</div>
                <div className="text-sm font-medium text-gray-900">{category.label}</div>
                <div className="text-xs text-gray-600">{categoryMeals.length} meals</div>
                <div className="text-xs text-gray-600">{categoryCalories} cal</div>
              </div>
            );
          })}
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
                  {categoryMeals.map((meal) => (
                    <MealCard
                      key={meal.id}
                      meal={meal}
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
      />
    </div>
  );
}
