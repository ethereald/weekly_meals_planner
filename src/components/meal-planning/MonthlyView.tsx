'use client';

import { useState } from 'react';
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

interface MonthlyViewProps {
  currentDate: Date;
  meals: Meal[];
  onAddMeal: (meal: Omit<Meal, 'id'>, date: Date) => void;
  onEditMeal: (id: string, meal: Omit<Meal, 'id'>) => void;
  onDeleteMeal: (id: string) => void;
  onDateSelect: (date: Date) => void;
}

export default function MonthlyView({
  currentDate,
  meals,
  onAddMeal,
  onEditMeal,
  onDeleteMeal,
  onDateSelect
}: MonthlyViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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

  const getMealsForDate = (date: Date) => {
    // For demo purposes, return some meals
    // In a real app, you'd filter meals by date
    return meals.slice(0, Math.floor(Math.random() * 4));
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

  return (
    <div className="space-y-6">
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
                        const colors = {
                          breakfast: 'bg-yellow-200',
                          lunch: 'bg-green-200',
                          dinner: 'bg-blue-200',
                          snack: 'bg-purple-200'
                        };
                        
                        return (
                          <div
                            key={index}
                            className={`text-xs p-1 rounded truncate ${colors[meal.category]} ${
                              meal.category === 'breakfast' ? 'text-yellow-800' :
                              meal.category === 'lunch' ? 'text-green-800' :
                              meal.category === 'dinner' ? 'text-blue-800' :
                              'text-purple-800'
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
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-200 rounded"></div>
            <span className="text-xs text-gray-600">Breakfast</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-200 rounded"></div>
            <span className="text-xs text-gray-600">Lunch</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-200 rounded"></div>
            <span className="text-xs text-gray-600">Dinner</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-200 rounded"></div>
            <span className="text-xs text-gray-600">Snacks</span>
          </div>
        </div>
      </div>

      {/* Meal Form Modal */}
      <MealFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveMeal}
        editingMeal={null}
        selectedDate={selectedDate || currentDate}
      />
    </div>
  );
}
