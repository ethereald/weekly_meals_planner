'use client';

import { useState } from 'react';

// Generate consistent colors for users based on their username
const getUserColor = (username: string) => {
  const colors = [
    { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
    { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
    { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
    { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
    { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
    { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-200' },
    { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200' },
    { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
    { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-200' },
    { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-200' },
    { bg: 'bg-lime-100', text: 'text-lime-800', border: 'border-lime-200' },
    { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
    { bg: 'bg-sky-100', text: 'text-sky-800', border: 'border-sky-200' },
    { bg: 'bg-violet-100', text: 'text-violet-800', border: 'border-violet-200' },
    { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-200' },
  ];
  
  // Improved hash function for better distribution
  let hash = 0;
  if (username.length === 0) return `${colors[0].bg} ${colors[0].text} ${colors[0].border}`;
  
  for (let i = 0; i < username.length; i++) {
    const char = username.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Ensure positive index
  const colorIndex = Math.abs(hash) % colors.length;
  const color = colors[colorIndex];
  
  console.log(`🎨 User "${username}" -> hash: ${hash} -> index: ${colorIndex} -> color: ${color.bg}`);
  
  return `${color.bg} ${color.text} ${color.border}`;
};

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
    addedAt: string; // ISO date string
  };
}

interface MealCardProps {
  meal: Meal;
  currentUser: { id: string; username: string; role: string } | null;
  onEdit: (meal: Meal) => void;
  onDelete: (mealId: string) => void;
  compact?: boolean;
}

export default function MealCard({ meal, currentUser, onEdit, onDelete, compact = false }: MealCardProps) {
  const [showMenu, setShowMenu] = useState(false);

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
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow ${
      compact ? 'p-3' : 'p-4'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {/* User bubble - show who added this meal */}
            {meal.addedBy && (
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getUserColor(meal.addedBy.username)}`}>
                {meal.addedBy.username}
              </span>
            )}
            {meal.time && meal.time !== meal.category && (
              <span className="text-xs text-gray-500">{meal.time}</span>
            )}
          </div>
          
          <h3 className={`font-semibold text-gray-900 truncate ${compact ? 'text-sm' : 'text-base'}`}>
            {meal.meal?.name || meal.name}
          </h3>
          
          {(meal.meal?.description || meal.description) && !compact && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {meal.meal?.description || meal.description}
            </p>
          )}
          
          {meal.notes && !compact && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800 italic">
                Note: {meal.notes}
              </p>
            </div>
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
                      onDelete(meal.id);
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
  );
}
