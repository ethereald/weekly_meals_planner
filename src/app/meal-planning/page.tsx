'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '../../lib/auth-client';
import MealPlanningLayout from '../../components/meal-planning/MealPlanningLayout';
import DailyView from '../../components/meal-planning/DailyView';
import WeeklyView from '../../components/meal-planning/WeeklyView';
import MonthlyView from '../../components/meal-planning/MonthlyView';
import { Meal } from '../../components/meal-planning/MealCard';

export default function MealPlanningPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string } | null>(null);

  // Load user and sample meals
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Get current user
        const profile = await authApi.getProfile();
        const user = { id: profile.user.id, username: profile.user.username };
        setCurrentUser(user);

        // Sample meals with user information
        const sampleMeals: Meal[] = [
          {
            id: '1',
            name: 'Avocado Toast',
            description: 'Whole grain bread with mashed avocado, cherry tomatoes, and feta cheese',
            category: 'breakfast',
            time: '08:00',
            calories: 320,
            prepTime: 10,
            addedBy: {
              userId: user.id,
              username: user.username,
              addedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Yesterday
            }
          },
          {
            id: '2',
            name: 'Greek Salad',
            description: 'Fresh vegetables with olives, feta cheese, and olive oil dressing',
            category: 'lunch',
            time: '12:30',
            calories: 280,
            prepTime: 15,
            addedBy: {
              userId: user.id,
              username: user.username,
              addedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
            }
          },
          {
            id: '3',
            name: 'Grilled Salmon',
            description: 'Atlantic salmon with roasted vegetables and quinoa',
            category: 'dinner',
            time: '19:00',
            calories: 450,
            prepTime: 25,
            addedBy: {
              userId: user.id,
              username: user.username,
              addedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
            }
          },
          {
            id: '4',
            name: 'Mixed Nuts',
            description: 'Almonds, walnuts, and cashews',
            category: 'snack',
            time: '15:30',
            calories: 180,
            prepTime: 0,
            addedBy: {
              userId: user.id,
              username: user.username,
              addedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() // 12 hours ago
            }
          },
          {
            id: '5',
            name: 'Overnight Oats',
            description: 'Oats with almond milk, chia seeds, and berries',
            category: 'breakfast',
            time: '07:30',
            calories: 290,
            prepTime: 5,
            addedBy: {
              userId: user.id,
              username: user.username,
              addedAt: new Date().toISOString() // Now
            }
          }
        ];
        
        setMeals(sampleMeals);
      } catch (error) {
        console.error('Failed to load user data:', error);
        // Redirect to login if auth fails
        router.push('/auth');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [router]);

  const handleAddMeal = (mealData: Omit<Meal, 'id'>, date?: Date) => {
    if (!currentUser) return;
    
    const newMeal: Meal = {
      ...mealData,
      id: Date.now().toString(),
      addedBy: {
        userId: currentUser.id,
        username: currentUser.username,
        addedAt: new Date().toISOString()
      }
    };
    setMeals(prev => [...prev, newMeal]);
  };

  const handleEditMeal = (id: string, mealData: Omit<Meal, 'id'>) => {
    setMeals(prev => prev.map(meal => 
      meal.id === id ? { ...mealData, id } : meal
    ));
  };

  const handleDeleteMeal = (id: string) => {
    setMeals(prev => prev.filter(meal => meal.id !== id));
  };

  const handleDateSelect = (date: Date) => {
    setCurrentDate(date);
    setView('daily');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading meal plans...</p>
        </div>
      </div>
    );
  }

  return (
    <MealPlanningLayout
      currentDate={currentDate}
      onDateChange={setCurrentDate}
      view={view}
      onViewChange={setView}
    >
      {view === 'daily' && (
        <DailyView
          currentDate={currentDate}
          meals={meals}
          onAddMeal={handleAddMeal}
          onEditMeal={handleEditMeal}
          onDeleteMeal={handleDeleteMeal}
        />
      )}
      
      {view === 'weekly' && (
        <WeeklyView
          currentDate={currentDate}
          meals={meals}
          onAddMeal={handleAddMeal}
          onEditMeal={handleEditMeal}
          onDeleteMeal={handleDeleteMeal}
        />
      )}
      
      {view === 'monthly' && (
        <MonthlyView
          currentDate={currentDate}
          meals={meals}
          onAddMeal={handleAddMeal}
          onEditMeal={handleEditMeal}
          onDeleteMeal={handleDeleteMeal}
          onDateSelect={handleDateSelect}
        />
      )}
    </MealPlanningLayout>
  );
}
