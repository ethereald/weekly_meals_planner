'use client';

import { useState } from 'react';
import { getUserColor } from '@/lib/utils/userColors';

export interface Meal {
  id: string; // This is the planned meal ID
  mealId: string; // This is the actual meal ID
  name: string;
  description?: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  time?: string;
  notes?: string; // Notes for this specific planned meal instance
  calories?: number;
  cookTime?: number;
  plannedDate?: string;
  meal?: {
    id: string;
    userId: string;
    name: string;
    description: string | null;
    calories: number | null;
    cookTime: number | null;
    createdAt: string;
    updatedAt: string;
    tags?: Array<{
      id: string;
      name: string;
      color: string;
    }>;
  };
  addedBy?: {
    userId: string;
    username: string;
    displayName?: string;
    addedAt: string; // ISO date string
  };
}

interface MealCardProps {
  meal: Meal;
  currentUser: { id: string; username: string; displayName?: string; role: string } | null;
  onEdit: (meal: Meal) => void;
  onDelete: (mealId: string) => void;
  compact?: boolean;
}

export default function MealCard({ meal, currentUser, onEdit, onDelete, compact = false }: MealCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Get display name for showing to user, but use username for color consistency
  const getDisplayName = (user: { username: string; displayName?: string }) => {
    return user.displayName || user.username;
  };

  // Check if current user can delete this meal
  const canDeleteMeal = () => {
    if (!currentUser) return false;
    
    // Admin can delete any meal
    if (currentUser.role === 'admin') return true;
    
    // User can delete their own meals
    // Check if the meal was added by the current user
    return meal.addedBy?.userId === currentUser.id;
  };

  // Check if current user can edit this meal
  const canEditMeal = () => {
    if (!currentUser) return false;
    
    // Admin can edit any meal
    if (currentUser.role === 'admin') return true;
    
    // User can edit their own meals
    return meal.addedBy?.userId === currentUser.id;
  };

  // Check if any actions are available
  const hasAnyActions = () => {
    return canEditMeal() || canDeleteMeal();
  };

  return (
    <>
      <div className={`bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow ${
        compact ? 'p-3' : 'p-4'
      }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {/* User bubble - show who added this meal */}
            {meal.addedBy && (
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getUserColor(meal.addedBy.username)}`}>
                {getDisplayName(meal.addedBy)}
              </span>
            )}
            {meal.time && meal.time !== meal.category && (
              <span className="text-xs text-gray-500">{meal.time}</span>
            )}
          </div>
          
          <h3 className={`font-semibold text-gray-900 truncate ${compact ? 'text-sm' : 'text-base'}`}>
            {meal.meal?.name || meal.name}
          </h3>
          
          {meal.notes && (
            <p className={`text-gray-600 mt-1 ${
              compact 
                ? 'text-xs truncate' // Single line with ellipsis for compact mode
                : 'text-sm line-clamp-2' // Two lines for full mode
            }`}>
              {meal.notes}
            </p>
          )}
          
          {((meal.meal?.calories || meal.calories) || (meal.meal?.cookTime || meal.cookTime)) && (
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              {(meal.meal?.calories || meal.calories) && (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {meal.meal?.calories || meal.calories} cal
                </span>
              )}
              {(meal.meal?.cookTime || meal.cookTime) && (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {meal.meal?.cookTime || meal.cookTime}m
                </span>
              )}
            </div>
          )}
        </div>
        
        {hasAnyActions() && (
          <div className="relative ml-2">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                {canEditMeal() && (
                  <button
                    onClick={() => {
                      onEdit(meal);
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-t-md"
                  >
                    Edit
                  </button>
                )}
                {canDeleteMeal() && (
                  <button
                    onClick={() => {
                      console.log('🗑️ MealCard: Delete button clicked for meal:', meal.id, meal.name);
                      setShowConfirmDelete(true);
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-b-md"
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>

    {/* Confirmation Dialog */}
    {showConfirmDelete && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Meal</h3>
          <p className="text-gray-600 mb-4">
            Are you sure you want to delete "{meal.name}"? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowConfirmDelete(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                console.log('🗑️ MealCard: Confirmed deletion for meal:', meal.id, meal.name);
                onDelete(meal.id);
                setShowConfirmDelete(false);
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
