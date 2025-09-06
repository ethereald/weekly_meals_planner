'use client';

import { useState, useEffect } from 'react';
import { Meal } from './MealCard';

interface MealFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (meal: Omit<Meal, 'id'>) => void;
  editingMeal?: Meal | null;
  selectedDate?: Date;
  selectedCategory?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export default function MealFormModal({
  isOpen,
  onClose,
  onSave,
  editingMeal,
  selectedDate,
  selectedCategory
}: MealFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'breakfast' as 'breakfast' | 'lunch' | 'dinner' | 'snack',
    time: '',
    calories: '',
    prepTime: ''
  });

  useEffect(() => {
    if (editingMeal) {
      setFormData({
        name: editingMeal.name,
        description: editingMeal.description || '',
        category: editingMeal.category,
        time: editingMeal.time || '',
        calories: editingMeal.calories?.toString() || '',
        prepTime: editingMeal.prepTime?.toString() || ''
      });
    } else {
      setFormData({
        name: '',
        description: '',
        category: selectedCategory || 'breakfast',
        time: '',
        calories: '',
        prepTime: ''
      });
    }
  }, [editingMeal, selectedCategory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const mealData: Omit<Meal, 'id'> = {
      name: formData.name,
      description: formData.description || undefined,
      category: formData.category,
      time: formData.time || undefined,
      calories: formData.calories ? parseInt(formData.calories) : undefined,
      prepTime: formData.prepTime ? parseInt(formData.prepTime) : undefined
    };

    onSave(mealData);
    onClose();
  };

  if (!isOpen) return null;

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
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Meal Name *
            </label>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter meal name"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              id="category"
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
          </div>

          <div>
            <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
              Time
            </label>
            <input
              type="time"
              id="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Enter meal description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="calories" className="block text-sm font-medium text-gray-700 mb-1">
                Calories
              </label>
              <input
                type="number"
                id="calories"
                min="0"
                value={formData.calories}
                onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
            </div>

            <div>
              <label htmlFor="prepTime" className="block text-sm font-medium text-gray-700 mb-1">
                Prep Time (min)
              </label>
              <input
                type="number"
                id="prepTime"
                min="0"
                value={formData.prepTime}
                onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
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
