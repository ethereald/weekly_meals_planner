'use client';

import { useState } from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import MealCard, { Meal } from './MealCard';
import MealFormModal from './MealFormModal';
import { SavedMeal } from '../../lib/api/meals';

interface WeeklyViewProps {
  currentDate: Date;
  meals: Meal[];
  existingMeals?: SavedMeal[];
  onAddMeal: (meal: Omit<Meal, 'id'>, date: Date) => void;
  onEditMeal: (id: string, meal: Omit<Meal, 'id'>) => void;
  onDeleteMeal: (id: string) => void;
}

export default function WeeklyView({
  currentDate,
  meals,
  existingMeals = [],
  onAddMeal,
  onEditMeal,
  onDeleteMeal
}: WeeklyViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack' | undefined>();

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 }); // Sunday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const mealCategories = [
    { key: 'breakfast', label: 'Breakfast', color: 'border-l-yellow-400' },
    { key: 'lunch', label: 'Lunch', color: 'border-l-green-400' },
    { key: 'dinner', label: 'Dinner', color: 'border-l-blue-400' },
    { key: 'snack', label: 'Snacks', color: 'border-l-purple-400' }
  ] as const;

  const getMealsForDateAndCategory = (date: Date, category: string) => {
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

  return (
    <div className="space-y-6">
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
