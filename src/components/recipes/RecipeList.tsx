'use client';

import { useState, useEffect } from 'react';
import { SavedMeal, mealsApi } from '@/lib/api/meals';

interface RecipeListProps {
  recipes: SavedMeal[];
  onEditRecipe: (recipe: SavedMeal) => void;
  onDeleteRecipe: (recipeId: string) => void;
}

export default function RecipeList({ recipes, onEditRecipe, onDeleteRecipe }: RecipeListProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<{
    recipe: SavedMeal | null;
    plannedInfo: { count: number; dates: string[] } | null;
    isLoading: boolean;
  }>({
    recipe: null,
    plannedInfo: null,
    isLoading: false
  });
  
  const [recipeCounts, setRecipeCounts] = useState<Record<string, number>>({});
  const [countsLoading, setCountsLoading] = useState(true);

  // Load planned meal counts for all recipes
  useEffect(() => {
    const loadRecipeCounts = async () => {
      if (recipes.length === 0) {
        setCountsLoading(false);
        return;
      }

      setCountsLoading(true);
      const counts: Record<string, number> = {};
      
      // Load counts for all recipes in parallel
      const countPromises = recipes.map(async (recipe) => {
        try {
          const plannedInfo = await mealsApi.getPlannedMealsForRecipe(recipe.id);
          counts[recipe.id] = plannedInfo.count;
        } catch (error) {
          console.error(`Failed to load count for recipe ${recipe.id}:`, error);
          counts[recipe.id] = 0;
        }
      });
      
      await Promise.all(countPromises);
      setRecipeCounts(counts);
      setCountsLoading(false);
    };

    loadRecipeCounts();
  }, [recipes]);

  const handleDeleteClick = async (recipe: SavedMeal) => {
    setDeleteConfirm({ recipe, plannedInfo: null, isLoading: true });
    
    // Get planned meals info
    const plannedInfo = await mealsApi.getPlannedMealsForRecipe(recipe.id);
    setDeleteConfirm({ recipe, plannedInfo, isLoading: false });
  };

  const handleConfirmDelete = async (force: boolean = false) => {
    if (!deleteConfirm.recipe) return;
    
    try {
      const success = await mealsApi.deleteSavedMeal(deleteConfirm.recipe.id, force);
      if (success) {
        onDeleteRecipe(deleteConfirm.recipe.id);
        setDeleteConfirm({ recipe: null, plannedInfo: null, isLoading: false });
      }
    } catch (error) {
      console.error('Failed to delete recipe:', error);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirm({ recipe: null, plannedInfo: null, isLoading: false });
  };

  if (recipes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No recipes yet</h3>
        <p className="text-gray-500 mb-4">
          You haven't created any recipes yet. Start by adding meals to your meal plans, and they'll appear here for editing.
        </p>
        <button
          onClick={() => window.location.href = '/meal-planning'}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          Go to Meal Planning
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {recipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            plannedCount={recipeCounts[recipe.id] || 0}
            countLoading={countsLoading}
            onEdit={() => onEditRecipe(recipe)}
            onDelete={() => handleDeleteClick(recipe)}
          />
        ))}
      </div>
      
      {/* Delete Confirmation Modal */}
      {deleteConfirm.recipe && (
        <DeleteConfirmModal
          recipe={deleteConfirm.recipe}
          plannedInfo={deleteConfirm.plannedInfo}
          isLoading={deleteConfirm.isLoading}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </>
  );
}

interface RecipeCardProps {
  recipe: SavedMeal;
  plannedCount: number;
  countLoading: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

function RecipeCard({ recipe, plannedCount, countLoading, onEdit, onDelete }: RecipeCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-gray-900 truncate" title={recipe.name}>
                {recipe.name}
              </h3>
              {/* Planned count badge */}
              {countLoading ? (
                <div className="animate-pulse bg-gray-200 rounded-full px-2 py-1 text-xs">
                  <span className="invisible">0</span>
                </div>
              ) : (
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  plannedCount > 0 
                    ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}>
                  {plannedCount} cooked
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              {/* Tags */}
              {recipe.tags && recipe.tags.length > 0 ? (
                recipe.tags.slice(0, 2).map((tag) => (
                  <span 
                    key={tag.id}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                    style={{ 
                      backgroundColor: `${tag.color}20`,
                      color: tag.color,
                      borderColor: `${tag.color}40`
                    }}
                  >
                    {tag.name}
                  </span>
                ))
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                  Untagged
                </span>
              )}
              {recipe.tags && recipe.tags.length > 2 && (
                <span className="text-xs text-gray-400">
                  +{recipe.tags.length - 2} more
                </span>
              )}
              {recipe.calories && (
                <span className="text-xs text-gray-500">
                  {recipe.calories} cal
                </span>
              )}
            </div>
          </div>
          
          {/* Action Menu */}
          <div className="flex items-center gap-1">
            <button
              onClick={onEdit}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Edit recipe"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Delete recipe"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {recipe.description ? (
          <p className="text-sm text-gray-600 line-clamp-3">
            {recipe.description}
          </p>
        ) : (
          <p className="text-sm text-gray-400 italic">
            No description provided
          </p>
        )}

        {/* Stats */}
        <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
          {recipe.cookTime ? (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {recipe.cookTime} min cook
            </span>
          ) : (
            <span></span>
          )}
          
          <span className="text-gray-400">
            Created {new Date(recipe.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}

interface DeleteConfirmModalProps {
  recipe: SavedMeal;
  plannedInfo: { count: number; dates: string[] } | null;
  isLoading: boolean;
  onConfirm: (force?: boolean) => void;
  onCancel: () => void;
}

function DeleteConfirmModal({ recipe, plannedInfo, isLoading, onConfirm, onCancel }: DeleteConfirmModalProps) {
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="fixed inset-0 bg-black bg-opacity-50" />
          <div className="relative bg-white rounded-lg p-6 max-w-md w-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Checking meal usage...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasPlannedMeals = plannedInfo && plannedInfo.count > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onCancel} />
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Recipe</h3>
                <p className="text-sm text-gray-500">"{recipe.name}"</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {hasPlannedMeals ? (
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                      <h4 className="font-medium text-yellow-800">Recipe In Use</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        This recipe is currently planned in {plannedInfo!.count} meal slot{plannedInfo!.count !== 1 ? 's' : ''} 
                        {plannedInfo!.dates.length > 0 && (
                          <> on {plannedInfo!.dates.slice(0, 3).join(', ')}{plannedInfo!.dates.length > 3 ? ', ...' : ''}</>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    You can either remove it from your meal plans first, or force delete it which will remove it from all planned meals.
                  </p>
                  
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => onConfirm(true)}
                      className="w-full px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
                    >
                      Force Delete (Remove from {plannedInfo!.count} planned meal{plannedInfo!.count !== 1 ? 's' : ''})
                    </button>
                    <button
                      onClick={onCancel}
                      className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Cancel - I'll remove it manually first
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Are you sure you want to delete this recipe? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => onConfirm(false)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
                  >
                    Delete Recipe
                  </button>
                  <button
                    onClick={onCancel}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
