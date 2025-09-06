// API functions for meal management

export interface PlannedMeal {
  id: string;
  mealId: string;
  plannedDate: string;
  plannedTime: string | null;
  servings: number;
  notes: string | null;
  meal: {
    id: string;
    userId: string;
    name: string;
    description: string | null;
    mealType: string;
    calories: number | null;
    prepTime: number | null;
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
  mealType: string;
  calories: number | null;
  prepTime: number | null;
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
    prepTime?: number;
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
};
