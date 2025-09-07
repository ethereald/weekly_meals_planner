// API functions for meal management

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface PlannedMeal {
  id: string;
  mealId: string;
  plannedDate: string;
  mealSlot: string | null;
  servings: number;
  notes: string | null;
  meal: {
    id: string;
    userId: string;
    name: string;
    description: string | null;
    calories: number | null;
    cookTime: number | null;
    tags?: Tag[];
    createdAt: string;
    updatedAt: string;
  };
  creator: {
    userId: string;
    username: string;
  };
}

export interface SavedMeal {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  calories: number | null;
  cookTime: number | null;
  tags?: Tag[];
  createdAt: string;
  updatedAt: string;
}

export const mealsApi = {
  // Get planned meals for a specific date
  async getPlannedMeals(date: string): Promise<PlannedMeal[]> {
    try {
      const response = await fetch(`/api/meals?date=${date}`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch planned meals');
      }
      
      const data = await response.json();
      return data.meals || [];
    } catch (error) {
      console.error('Error fetching planned meals:', error);
      return [];
    }
  },

  // Get planned meals for a date range
  async getPlannedMealsInRange(startDate: string, endDate: string): Promise<PlannedMeal[]> {
    try {
      const response = await fetch(`/api/meals?startDate=${startDate}&endDate=${endDate}`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch planned meals for date range');
      }
      
      const data = await response.json();
      return data.meals || [];
    } catch (error) {
      console.error('Error fetching planned meals for date range:', error);
      return [];
    }
  },

  // Get all saved meals for the user
  async getSavedMeals(): Promise<SavedMeal[]> {
    try {
      const response = await fetch('/api/meals', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch saved meals');
      }
      
      const data = await response.json();
      return data.meals || [];
    } catch (error) {
      console.error('Error fetching saved meals:', error);
      return [];
    }
  },

  // Get only current user's saved meals (for dropdown)
  async getUserSavedMeals(): Promise<SavedMeal[]> {
    try {
      const response = await fetch('/api/meals?userOnly=true', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user saved meals');
      }
      
      const data = await response.json();
      return data.meals || [];
    } catch (error) {
      console.error('Error fetching user saved meals:', error);
      return [];
    }
  },

  // Create a new meal or plan an existing meal
  async createPlannedMeal(mealData: {
    name: string;
    category: string;
    time?: string;
    plannedDate: string;
    description?: string;
    calories?: number;
    cookTime?: number;
  }): Promise<PlannedMeal | null> {
    try {
      const response = await fetch('/api/meals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(mealData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create planned meal');
      }
      
      const data = await response.json();
      return data.meal;
    } catch (error) {
      console.error('Error creating planned meal:', error);
      return null;
    }
  },

  // Delete a planned meal
  async deletePlannedMeal(plannedMealId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/meals?id=${plannedMealId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete planned meal');
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting planned meal:', error);
      return false;
    }
  },

  // Update a saved meal
  async updateSavedMeal(mealId: string, updates: Partial<SavedMeal>): Promise<SavedMeal | null> {
    try {
      const response = await fetch(`/api/meals/saved/${mealId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update saved meal');
      }
      
      const data = await response.json();
      return data.meal;
    } catch (error) {
      console.error('Error updating saved meal:', error);
      return null;
    }
  },

  // Delete a saved meal
  async deleteSavedMeal(mealId: string, force: boolean = false): Promise<boolean> {
    try {
      const url = force ? `/api/meals/saved/${mealId}?force=true` : `/api/meals/saved/${mealId}`;
      const response = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Delete meal failed:', {
          status: response.status,
          statusText: response.statusText,
          body: errorData
        });
        throw new Error(`Failed to delete saved meal: ${response.status} ${response.statusText}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting saved meal:', error);
      return false;
    }
  },

  // Get planned meals info for a recipe (to show where it's being used)
  async getPlannedMealsForRecipe(mealId: string): Promise<{ count: number; dates: string[] }> {
    try {
      const response = await fetch(`/api/meals/saved/${mealId}/planned`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', response.status, errorText);
        throw new Error(`Failed to get planned meals info: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting planned meals info:', error);
      return { count: 0, dates: [] };
    }
  },
};
