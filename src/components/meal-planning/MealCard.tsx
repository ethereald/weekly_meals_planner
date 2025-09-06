'use client';

import { useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';

export interface Meal {
  id: string;
  name: string;
  description?: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  time?: string;
  calories?: number;
  prepTime?: number;
  addedBy?: {
    userId: string;
    username: string;
    addedAt: string; // ISO date string
  };
}

interface MealCardProps {
  meal: Meal;
  onEdit: (meal: Meal) => void;
  onDelete: (mealId: string) => void;
  compact?: boolean;
}

export default function MealCard({ meal, onEdit, onDelete, compact = false }: MealCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'breakfast':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'lunch':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'dinner':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'snack':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow ${
      compact ? 'p-3' : 'p-4'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(meal.category)}`}>
              {meal.category}
            </span>
            {meal.time && (
              <span className="text-xs text-gray-500">{meal.time}</span>
            )}
          </div>
          
          <h3 className={`font-semibold text-gray-900 truncate ${compact ? 'text-sm' : 'text-base'}`}>
            {meal.name}
          </h3>
          
          {meal.description && !compact && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {meal.description}
            </p>
          )}
          
          {(meal.calories || meal.prepTime) && (
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              {meal.calories && (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {meal.calories} cal
                </span>
              )}
              {meal.prepTime && (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {meal.prepTime}m
                </span>
              )}
            </div>
          )}
          
          {/* User Information */}
          {meal.addedBy && (
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Added by {meal.addedBy.username}</span>
              {!compact && (
                <span title={format(new Date(meal.addedBy.addedAt), 'PPp')}>
                  • {formatDistanceToNow(new Date(meal.addedBy.addedAt), { addSuffix: true })}
                </span>
              )}
            </div>
          )}
        </div>
        
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
              <button
                onClick={() => {
                  onEdit(meal);
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-t-md"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  onDelete(meal.id);
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-b-md"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
