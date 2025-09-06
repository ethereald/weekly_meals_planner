'use client';

import { useState, useEffect } from 'react';
import { Meal } from './MealCard';
import { SavedMeal } from '../../lib/api/meals';

interface MealFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (meal: Omit<Meal, 'id'>) => void;
  editingMeal?: Meal | null;
  selectedDate?: Date;
  selectedCategory?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  existingMeals?: SavedMeal[]; // Pass saved meals from API
}

export default function MealFormModal({
  isOpen,
  onClose,
  onSave,
  editingMeal,
  selectedDate,
  selectedCategory,
  existingMeals = []
}: MealFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'breakfast' as 'breakfast' | 'lunch' | 'dinner' | 'snack',
    time: '',
    selectedMealId: ''
  });

  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
  const [isLoadingMeals, setIsLoadingMeals] = useState(false);

  // Use existing meals passed as prop
  useEffect(() => {
    if (isOpen) {
      setSavedMeals(existingMeals || []);
    }
  }, [isOpen, existingMeals]);

  useEffect(() => {
    if (editingMeal) {
      setFormData({
        name: editingMeal.name,
        category: editingMeal.category,
        time: editingMeal.time || '',
        selectedMealId: ''
      });
    } else {
      setFormData({
        name: '',
        category: selectedCategory || 'breakfast',
        time: '',
        selectedMealId: ''
      });
    }
  }, [editingMeal, selectedCategory]);

  const handleMealSelection = (mealId: string) => {
    const selectedMeal = savedMeals.find(meal => meal.id === mealId);
    if (selectedMeal) {
      setFormData({
        ...formData,
        name: selectedMeal.name,
        selectedMealId: mealId
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const mealData: Omit<Meal, 'id'> = {
      mealId: formData.selectedMealId || '', // Will be set by API if creating new meal
      name: formData.name,
      category: formData.category,
      time: formData.time || undefined
    };

    onSave(mealData);
    onClose();
  };

  if (!isOpen) return null;

  // Filter meals by current category for better UX
  const filteredMeals = savedMeals.filter(meal => 
    meal.mealType === formData.category
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingMeal ? 'Edit Meal' : 'Add New Meal'}
            </h2>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              id="category"
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as any, selectedMealId: '', name: '' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
          </div>

          {!isLoadingMeals && filteredMeals.length > 0 && (
            <div>
              <label htmlFor="savedMeal" className="block text-sm font-medium text-gray-700 mb-1">
                Select from saved meals
              </label>
              <select
                id="savedMeal"
                value={formData.selectedMealId}
                onChange={(e) => handleMealSelection(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose a saved meal...</option>
                {filteredMeals.map((meal) => (
                  <option key={meal.id} value={meal.id}>
                    {meal.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Or create a new meal by entering a name below
              </p>
            </div>
          )}

          {isLoadingMeals && (
            <div className="text-center py-2">
              <div className="inline-flex items-center gap-2 text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                Loading saved meals...
              </div>
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Meal Name *
            </label>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value, selectedMealId: '' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter meal name or select from saved meals above"
            />
          </div>

          <div>
            <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
              Time (optional)
            </label>
            <input
              type="time"
              id="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex items-start">
              <svg className="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-700">
                <p className="font-medium">Quick planning mode</p>
                <p>Add detailed nutritional info and instructions in the Meal Management section later.</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              {editingMeal ? 'Update' : 'Add'} Meal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
