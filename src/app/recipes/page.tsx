'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { mealsApi, SavedMeal } from '@/lib/api/meals';
import RecipeList from '@/components/recipes/RecipeList';
import RecipeEditModal from '@/components/recipes/RecipeEditModal';
import AddMealModal from '@/components/recipes/AddMealModal';

export default function RecipesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [recipes, setRecipes] = useState<SavedMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRecipe, setEditingRecipe] = useState<SavedMeal | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<SavedMeal[]>([]);

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

  // Filter recipes based on selected tags
  useEffect(() => {
    if (selectedTags.length === 0) {
      setFilteredRecipes(recipes);
    } else {
      const filtered = recipes.filter(recipe => {
        if (!recipe.tags || recipe.tags.length === 0) {
          return false; // Don't show untagged recipes when tags are selected
        }
        // Recipe must have at least one of the selected tags
        return recipe.tags.some(tag => selectedTags.includes(tag.id));
      });
      setFilteredRecipes(filtered);
    }
  }, [recipes, selectedTags]);

  // Get all unique tags from recipes
  const getAllTags = () => {
    const tagMap = new Map();
    recipes.forEach(recipe => {
      if (recipe.tags) {
        recipe.tags.forEach(tag => {
          tagMap.set(tag.id, tag);
        });
      }
    });
    return Array.from(tagMap.values());
  };

  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const clearTagFilters = () => {
    setSelectedTags([]);
  };

  const handleEditRecipe = (recipe: SavedMeal) => {
    setEditingRecipe(recipe);
    setIsEditModalOpen(true);
  };

  const handleUpdateRecipe = async (updatedRecipe: Partial<SavedMeal>) => {
    if (!editingRecipe) return;

    try {
      console.log('Frontend: Updating recipe with:', updatedRecipe);
      
      // Update the recipe via API
      const updated = await mealsApi.updateSavedMeal(editingRecipe.id, updatedRecipe);
      
      console.log('Frontend: Received updated recipe from API:', updated);
      
      if (updated) {
        // Update local state with the complete recipe from API response
        setRecipes(recipes.map(recipe => 
          recipe.id === editingRecipe.id ? updated : recipe
        ));
        // Note: filteredRecipes will be updated automatically by the useEffect
        
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
    // Note: filteredRecipes will be updated automatically by the useEffect
  };

  const handleAddMeal = (newMeal: SavedMeal) => {
    // Add the new meal to the local state
    setRecipes(prevRecipes => [newMeal, ...prevRecipes]);
    // Note: filteredRecipes will be updated automatically by the useEffect
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
          {/* Title row */}
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
          
          {/* Button row - separate on mobile, inline on desktop */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-gray-600 order-2 sm:order-1">
              Manage your personal recipe collection. Edit details, add ingredients, and update nutritional information.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors order-1 sm:order-2 sm:flex-shrink-0"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Meal
            </button>
          </div>
        </div>

        {/* Tag Filter Section */}
        {recipes.length > 0 && (
          <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Filter by tags:</span>
              </div>
              
              <div className="flex-1 min-w-0">
                {getAllTags().length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {getAllTags().map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => handleTagToggle(tag.id)}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                          selectedTags.includes(tag.id)
                            ? 'border-2 shadow-sm'
                            : 'border hover:shadow-sm'
                        }`}
                        style={{
                          backgroundColor: selectedTags.includes(tag.id) ? tag.color : `${tag.color}20`,
                          borderColor: selectedTags.includes(tag.id) ? tag.color : `${tag.color}60`,
                          color: selectedTags.includes(tag.id) ? 'white' : tag.color
                        }}
                      >
                        {tag.name}
                        {selectedTags.includes(tag.id) && (
                          <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No tags available</p>
                )}
              </div>
              
              {selectedTags.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {filteredRecipes.length} of {recipes.length} recipes
                  </span>
                  <button
                    onClick={clearTagFilters}
                    className="inline-flex items-center px-2 py-1 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <RecipeList
          recipes={filteredRecipes}
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

        <AddMealModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onMealAdded={handleAddMeal}
        />
      </div>
    </div>
  );
}
