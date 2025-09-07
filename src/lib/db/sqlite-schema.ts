import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// Users Table
export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  username: text('username', { length: 255 }).notNull().unique(),
  password: text('password', { length: 255 }).notNull(),
  role: text('role', { length: 50 }).notNull().default('user'),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString()),
});

// User Settings Table
export const userSettings = sqliteTable('user_settings', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  dietaryRestrictions: text('dietary_restrictions'), // JSON string for dietary restrictions
  preferredMealTimes: text('preferred_meal_times'), // JSON string for meal time preferences
  enabledMealCategories: text('enabled_meal_categories').default('["breakfast","lunch","dinner","snack"]'), // JSON array of enabled meal categories
  weeklyMealGoal: integer('weekly_meal_goal').default(21), // 3 meals × 7 days
  servingSize: integer('serving_size').default(2), // Default serving size
  budgetRange: real('budget_range'), // Weekly budget
  shoppingDay: text('shopping_day', { length: 20 }).default('sunday'), // Preferred shopping day
  notificationsEnabled: integer('notifications_enabled', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString()),
});

// Categories Table
export const categories = sqliteTable('categories', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  colorCode: text('color_code', { length: 7 }), // Hex color code
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
});

// Tags Table
export const tags = sqliteTable('tags', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name', { length: 50 }).notNull().unique(),
  color: text('color', { length: 7 }).default('#6B7280'), // Hex color code
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
});

// Meal Tags Junction Table
export const mealTags = sqliteTable('meal_tags', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  mealId: text('meal_id').notNull().references(() => meals.id, { onDelete: 'cascade' }),
  tagId: text('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
});

// Meals Table
export const meals = sqliteTable('meals', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name', { length: 255 }).notNull(),
  description: text('description'),
  instructions: text('instructions'),
  cookTime: integer('cook_time'), // in minutes
  servings: integer('servings').default(2),
  difficulty: text('difficulty', { length: 20 }).default('easy'), // easy, medium, hard
  categoryId: text('category_id').references(() => categories.id),
  imageUrl: text('image_url'),
  sourceUrl: text('source_url'),
  calories: integer('calories'),
  protein: real('protein'), // grams
  carbs: real('carbs'), // grams
  fat: real('fat'), // grams
  fiber: real('fiber'), // grams
  sugar: real('sugar'), // grams
  sodium: real('sodium'), // milligrams
  isPublic: integer('is_public', { mode: 'boolean' }).default(false),
  isFavorite: integer('is_favorite', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString()),
});

// Ingredients Table
export const ingredients = sqliteTable('ingredients', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name', { length: 255 }).notNull().unique(),
  category: text('category', { length: 100 }), // vegetables, meat, dairy, etc.
  defaultUnit: text('default_unit', { length: 50 }), // cups, tablespoons, pounds, etc.
  caloriesPerUnit: real('calories_per_unit'),
  proteinPerUnit: real('protein_per_unit'),
  carbsPerUnit: real('carbs_per_unit'),
  fatPerUnit: real('fat_per_unit'),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
});

// Meal Ingredients Junction Table
export const mealIngredients = sqliteTable('meal_ingredients', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  mealId: text('meal_id').notNull().references(() => meals.id, { onDelete: 'cascade' }),
  ingredientId: text('ingredient_id').notNull().references(() => ingredients.id),
  quantity: real('quantity').notNull(),
  unit: text('unit', { length: 50 }).notNull(),
  notes: text('notes'), // e.g., "finely chopped", "optional"
});

// Weekly Meal Plans Table
export const weeklyMealPlans = sqliteTable('weekly_meal_plans', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  weekStartDate: text('week_start_date').notNull(), // ISO date string for Monday of the week
  name: text('name', { length: 255 }).default('Weekly Meal Plan'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString()),
});

// Planned Meals Table (Junction between meal plans and meals)
export const plannedMeals = sqliteTable('planned_meals', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  mealPlanId: text('meal_plan_id').notNull().references(() => weeklyMealPlans.id, { onDelete: 'cascade' }),
  mealId: text('meal_id').notNull().references(() => meals.id),
  dayOfWeek: integer('day_of_week').notNull(), // 0 = Sunday, 1 = Monday, etc.
  mealSlot: text('meal_slot', { length: 50 }), // e.g., "breakfast", "lunch", "dinner", "snack", or custom
  servings: integer('servings').default(2),
  notes: text('notes'),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
});

// Daily Planned Meals Table (Simpler approach for daily meal planning)
export const dailyPlannedMeals = sqliteTable('daily_planned_meals', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  mealId: text('meal_id').notNull().references(() => meals.id),
  plannedDate: text('planned_date').notNull(), // ISO date string (YYYY-MM-DD)
  mealSlot: text('meal_slot', { length: 50 }), // e.g., "breakfast", "lunch", "dinner", "snack", or custom
  servings: integer('servings').default(2),
  notes: text('notes'),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
});

// Shopping Lists Table
export const shoppingLists = sqliteTable('shopping_lists', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  mealPlanId: text('meal_plan_id').references(() => weeklyMealPlans.id),
  name: text('name', { length: 255 }).notNull(),
  isCompleted: integer('is_completed', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString()),
});

// Shopping List Items Table
export const shoppingListItems = sqliteTable('shopping_list_items', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  shoppingListId: text('shopping_list_id').notNull().references(() => shoppingLists.id, { onDelete: 'cascade' }),
  ingredientId: text('ingredient_id').references(() => ingredients.id),
  name: text('name', { length: 255 }).notNull(), // ingredient name or custom item
  quantity: real('quantity').notNull(),
  unit: text('unit', { length: 50 }).notNull(),
  category: text('category', { length: 100 }), // for organization in the list
  isPurchased: integer('is_purchased', { mode: 'boolean' }).default(false),
  price: real('price'), // optional price tracking
  notes: text('notes'),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
});

// Nutritional Goals Table
export const nutritionalGoals = sqliteTable('nutritional_goals', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  dailyCalories: integer('daily_calories'),
  dailyProtein: real('daily_protein'), // grams
  dailyCarbs: real('daily_carbs'), // grams
  dailyFat: real('daily_fat'), // grams
  dailyFiber: real('daily_fiber'), // grams
  dailySodium: real('daily_sodium'), // milligrams
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString()),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  settings: one(userSettings, {
    fields: [users.id],
    references: [userSettings.userId],
  }),
  meals: many(meals),
  mealPlans: many(weeklyMealPlans),
  shoppingLists: many(shoppingLists),
  nutritionalGoals: many(nutritionalGoals),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}));

export const mealsRelations = relations(meals, ({ one, many }) => ({
  user: one(users, {
    fields: [meals.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [meals.categoryId],
    references: [categories.id],
  }),
  ingredients: many(mealIngredients),
  plannedMeals: many(plannedMeals),
  dailyPlannedMeals: many(dailyPlannedMeals),
  mealTags: many(mealTags),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  mealTags: many(mealTags),
}));

export const mealTagsRelations = relations(mealTags, ({ one }) => ({
  meal: one(meals, {
    fields: [mealTags.mealId],
    references: [meals.id],
  }),
  tag: one(tags, {
    fields: [mealTags.tagId],
    references: [tags.id],
  }),
}));

export const mealIngredientsRelations = relations(mealIngredients, ({ one }) => ({
  meal: one(meals, {
    fields: [mealIngredients.mealId],
    references: [meals.id],
  }),
  ingredient: one(ingredients, {
    fields: [mealIngredients.ingredientId],
    references: [ingredients.id],
  }),
}));

export const weeklyMealPlansRelations = relations(weeklyMealPlans, ({ one, many }) => ({
  user: one(users, {
    fields: [weeklyMealPlans.userId],
    references: [users.id],
  }),
  plannedMeals: many(plannedMeals),
  shoppingLists: many(shoppingLists),
}));

export const plannedMealsRelations = relations(plannedMeals, ({ one }) => ({
  mealPlan: one(weeklyMealPlans, {
    fields: [plannedMeals.mealPlanId],
    references: [weeklyMealPlans.id],
  }),
  meal: one(meals, {
    fields: [plannedMeals.mealId],
    references: [meals.id],
  }),
}));

export const dailyPlannedMealsRelations = relations(dailyPlannedMeals, ({ one }) => ({
  user: one(users, {
    fields: [dailyPlannedMeals.userId],
    references: [users.id],
  }),
  meal: one(meals, {
    fields: [dailyPlannedMeals.mealId],
    references: [meals.id],
  }),
}));

export const shoppingListsRelations = relations(shoppingLists, ({ one, many }) => ({
  user: one(users, {
    fields: [shoppingLists.userId],
    references: [users.id],
  }),
  mealPlan: one(weeklyMealPlans, {
    fields: [shoppingLists.mealPlanId],
    references: [weeklyMealPlans.id],
  }),
  items: many(shoppingListItems),
}));

export const shoppingListItemsRelations = relations(shoppingListItems, ({ one }) => ({
  shoppingList: one(shoppingLists, {
    fields: [shoppingListItems.shoppingListId],
    references: [shoppingLists.id],
  }),
  ingredient: one(ingredients, {
    fields: [shoppingListItems.ingredientId],
    references: [ingredients.id],
  }),
}));

export const nutritionalGoalsRelations = relations(nutritionalGoals, ({ one }) => ({
  user: one(users, {
    fields: [nutritionalGoals.userId],
    references: [users.id],
  }),
}));
