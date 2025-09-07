'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { mealsApi, SavedMeal } from '@/lib/api/meals';
import RecipeList from '@/components/recipes/RecipeList';
import RecipeEditModal from '@/components/recipes/RecipeEditModal';

export default function RecipesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [recipes, setRecipes] = useState<SavedMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRecipe, setEditingRecipe] = useState<SavedMeal | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, isLoading, router]);

  // Load recipes when authenticated
  useEffect(() => {
    const loadRecipes = async () => {
      if (!isAuthenticated) return;
      
      try {
        setLoading(true);
        const savedMeals = await mealsApi.getUserSavedMeals();
        setRecipes(savedMeals);
      } catch (error) {
        console.error('Failed to load recipes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecipes();
  }, [isAuthenticated]);

  const handleEditRecipe = (recipe: SavedMeal) => {
    setEditingRecipe(recipe);
    setIsEditModalOpen(true);
  };

  const handleUpdateRecipe = async (updatedRecipe: Partial<SavedMeal>) => {
    if (!editingRecipe) return;

    try {
      // Update the recipe via API
      const updated = await mealsApi.updateSavedMeal(editingRecipe.id, updatedRecipe);
      
      if (updated) {
        // Update local state
        setRecipes(recipes.map(recipe => 
          recipe.id === editingRecipe.id ? { ...recipe, ...updatedRecipe } : recipe
        ));
        
        setIsEditModalOpen(false);
        setEditingRecipe(null);
      }
    } catch (error) {
      console.error('Failed to update recipe:', error);
    }
  };

  const handleDeleteRecipe = (recipeId: string) => {
    // Remove recipe from local state (RecipeList handles the actual deletion)
    setRecipes(recipes.filter(recipe => recipe.id !== recipeId));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading recipes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.push('/')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Recipe Database</h1>
          </div>
          <p className="text-gray-600">
            Manage your personal recipe collection. Edit details, add ingredients, and update nutritional information.
          </p>
        </div>

        <RecipeList
          recipes={recipes}
          onEditRecipe={handleEditRecipe}
          onDeleteRecipe={handleDeleteRecipe}
        />

        <RecipeEditModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingRecipe(null);
          }}
          recipe={editingRecipe}
          onSave={handleUpdateRecipe}
        />
      </div>
    </div>
  );
}
