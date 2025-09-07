'use client';

import { useState, useEffect, useMemo } from 'react';
import { Meal } from './MealCard';
import { SavedMeal } from '../../lib/api/meals';
import { UserSettings } from '../../lib/auth-client';

interface MealFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (meal: Omit<Meal, 'id'>) => void;
  editingMeal?: Meal | null;
  selectedDate?: Date;
  selectedCategory?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  existingMeals?: SavedMeal[]; // Pass saved meals from API
  userSettings?: UserSettings | null; // Add user settings prop
}

export default function MealFormModal({
  isOpen,
  onClose,
  onSave,
  editingMeal,
  selectedDate,
  selectedCategory,
  existingMeals = [],
  userSettings
}: MealFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'breakfast' as 'breakfast' | 'lunch' | 'dinner' | 'snack',
    selectedMealId: '',
    notes: ''
  });

  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
  const [isLoadingMeals, setIsLoadingMeals] = useState(false);

  // Get enabled categories from user settings
  const enabledCategories = userSettings?.enabledMealCategories || ['breakfast', 'lunch', 'dinner', 'snack'];
  
  // Memoize category options to prevent infinite re-renders
  const categoryOptions = useMemo(() => [
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'dinner', label: 'Dinner' },
    { value: 'snack', label: 'Snack' }
  ].filter(option => enabledCategories.includes(option.value)), [enabledCategories]);

  // Check if there's only one enabled category
  const hasOnlyOneCategory = categoryOptions.length === 1;
  const singleCategory = hasOnlyOneCategory ? categoryOptions[0].value as 'breakfast' | 'lunch' | 'dinner' | 'snack' : null;

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
        selectedMealId: '',
        notes: editingMeal.notes || ''
      });
    } else {
      // Auto-select single category if only one is enabled
      const defaultCategory = singleCategory || selectedCategory || categoryOptions[0]?.value || 'breakfast';
      setFormData({
        name: '',
        category: defaultCategory as 'breakfast' | 'lunch' | 'dinner' | 'snack',
        selectedMealId: '',
        notes: ''
      });
    }
  }, [editingMeal, selectedCategory, singleCategory, enabledCategories]);

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
      time: formData.category, // Use category as the meal slot/time
      notes: formData.notes || undefined
    };

    onSave(mealData);
    onClose();
  };

  if (!isOpen) return null;

  // Show all saved meals - organize by relevance but don't exclude any
  const categoryMeals = savedMeals.filter(meal => 
    meal.tags?.some(tag => tag.name.toLowerCase() === formData.category.toLowerCase())
  );
  const otherMeals = savedMeals.filter(meal => 
    !meal.tags?.some(tag => tag.name.toLowerCase() === formData.category.toLowerCase())
  );
  
  // Combine category-specific meals first, then others
  const filteredMeals = [...categoryMeals, ...otherMeals];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start sm:items-center sm:justify-center p-2 sm:p-4">
      <div className="bg-white w-full max-w-[calc(100vw-1rem)] h-[calc(100dvh-1rem)] sm:h-auto sm:max-w-md sm:rounded-lg shadow-xl flex flex-col sm:max-h-[90vh] overflow-hidden">
        <div className="px-3 py-3 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-gray-900 truncate flex-1 min-w-0">
              {editingMeal ? 'Edit Meal' : 'Add New Meal'}
            </h2>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          <form onSubmit={handleSubmit} className="px-3 py-3 space-y-3 min-h-0">
            {/* Only show category selection if there's more than one enabled category */}
            {!hasOnlyOneCategory && (
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  id="category"
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as 'breakfast' | 'lunch' | 'dinner' | 'snack', selectedMealId: '', name: '' })}
                  className="w-full px-2 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-0 box-border"
                >
                  {categoryOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Show category info when only one category is enabled */}
            {hasOnlyOneCategory && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <div className="w-full px-2 py-2 text-base bg-gray-50 border border-gray-200 rounded-md text-gray-700">
                  {categoryOptions[0]?.label}
                </div>
              </div>
            )}

            {!isLoadingMeals && filteredMeals.length > 0 && (
              <div>
                <label htmlFor="savedMeal" className="block text-sm font-medium text-gray-700 mb-1">
                  Select from saved meals
                </label>
                <select
                  id="savedMeal"
                  value={formData.selectedMealId}
                  onChange={(e) => handleMealSelection(e.target.value)}
                  className="w-full px-2 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-0 box-border"
                >
                  <option value="">Choose a saved meal...</option>
                  {categoryMeals.length > 0 && (
                    <optgroup label={`${formData.category.charAt(0).toUpperCase() + formData.category.slice(1)} meals`}>
                      {categoryMeals.map((meal) => (
                        <option key={meal.id} value={meal.id}>
                          {meal.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {otherMeals.length > 0 && (
                    <optgroup label="Other meals">
                      {otherMeals.map((meal) => (
                        <option key={meal.id} value={meal.id}>
                          {meal.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
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
                className="w-full px-2 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-0 box-border"
                placeholder="Enter meal name"
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes for this meal (optional)
              </label>
              <textarea
                id="notes"
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-2 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-0 box-border resize-none"
                placeholder="Add notes for this specific meal planning (e.g., 'make extra for guests', 'use leftovers')"
              />
            </div>

            {/* Add some bottom padding to ensure content doesn't get hidden behind buttons on mobile keyboards */}
            <div className="h-16 sm:h-0"></div>
          </form>
        </div>

        <div className="px-3 py-2 border-t border-gray-200 flex-shrink-0 bg-white">
          <div className="flex gap-2 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-2 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors min-w-0 box-border"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="flex-1 px-2 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors min-w-0 box-border"
            >
              {editingMeal ? 'Update' : 'Add'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
