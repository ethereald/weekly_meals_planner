'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/auth-client';
import { mealsApi, SavedMeal } from '@/lib/api/meals';
import RecipeList from '@/components/recipes/RecipeList';
import RecipeEditModal from '@/components/recipes/RecipeEditModal';

export default function RecipesPage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<SavedMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRecipe, setEditingRecipe] = useState<SavedMeal | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string } | null>(null);

  // Load user and recipes
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Get current user
        const profile = await authApi.getProfile();
        const user = { id: profile.user.id, username: profile.user.username };
        setCurrentUser(user);

        // Load user's saved meals/recipes
        const savedMeals = await mealsApi.getUserSavedMeals();
        setRecipes(savedMeals);
      } catch (error) {
        console.error('Failed to load recipes:', error);
        // Redirect to login if auth fails
        router.push('/auth');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [router]);

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

  const handleDeleteRecipe = async (recipeId: string) => {
    if (!confirm('Are you sure you want to delete this recipe? This action cannot be undone.')) {
      return;
    }

    try {
      const success = await mealsApi.deleteSavedMeal(recipeId);
      if (success) {
        setRecipes(recipes.filter(recipe => recipe.id !== recipeId));
      }
    } catch (error) {
      console.error('Failed to delete recipe:', error);
    }
  };

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
