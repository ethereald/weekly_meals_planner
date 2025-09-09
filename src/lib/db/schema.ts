import { pgTable, uuid, varchar, text, timestamp, boolean, integer, decimal, pgEnum, date, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// PostgreSQL Enums
export const dietaryRestrictionEnum = pgEnum('dietary_restriction', [
  'vegetarian',
  'vegan',
  'gluten_free',
  'dairy_free',
  'nut_free',
  'low_carb',
  'keto',
  'paleo',
  'low_sodium',
  'diabetic'
]);

export const difficultyEnum = pgEnum('difficulty', [
  'easy',
  'medium',
  'hard'
]);

// Tags Table
export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  color: varchar('color', { length: 7 }).default('#6B7280'), // Hex color code
  createdAt: timestamp('created_at').defaultNow(),
});

// Meal Tags Junction Table
export const mealTags = pgTable('meal_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  mealId: uuid('meal_id').notNull().references(() => meals.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
});

// Users Table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  displayName: varchar('display_name', { length: 255 }),
  password: varchar('password', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull().default('user'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// User Settings Table
export const userSettings = pgTable('user_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  dietaryRestrictions: text('dietary_restrictions').array(), // Array of dietary restrictions
  preferredMealTimes: text('preferred_meal_times'), // JSON string for meal time preferences
  enabledMealCategories: text('enabled_meal_categories').default('["breakfast","lunch","dinner","snack"]'), // JSON array of enabled meal categories
  weeklyMealGoal: integer('weekly_meal_goal').default(21), // 3 meals × 7 days
  servingSize: integer('serving_size').default(2), // Default serving size
  budgetRange: decimal('budget_range', { precision: 10, scale: 2 }), // Weekly budget
  shoppingDay: varchar('shopping_day', { length: 20 }).default('sunday'), // Preferred shopping day
  theme: varchar('theme', { length: 20 }).default('light'), // UI theme preference
  notificationsEnabled: boolean('notifications_enabled').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Categories Table
export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  color: varchar('color', { length: 7 }).default('#3B82F6'), // Hex color code
  createdAt: timestamp('created_at').defaultNow(),
});

// Meals Table
export const meals = pgTable('meals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  difficulty: difficultyEnum('difficulty').default('easy'),
  cookTime: integer('cook_time'), // in minutes
  servings: integer('servings').default(2),
  calories: integer('calories'),
  protein: decimal('protein', { precision: 8, scale: 2 }), // in grams
  carbs: decimal('carbs', { precision: 8, scale: 2 }), // in grams
  fat: decimal('fat', { precision: 8, scale: 2 }), // in grams
  fiber: decimal('fiber', { precision: 8, scale: 2 }), // in grams
  sugar: decimal('sugar', { precision: 8, scale: 2 }), // in grams
  sodium: decimal('sodium', { precision: 8, scale: 2 }), // in mg
  instructions: text('instructions').notNull(),
  notes: text('notes'),
  imageUrl: varchar('image_url', { length: 500 }),
  isPublic: boolean('is_public').default(false),
  isFavorite: boolean('is_favorite').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Ingredients Table
export const ingredients = pgTable('ingredients', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  category: varchar('category', { length: 100 }), // e.g., 'vegetables', 'proteins', 'grains'
  defaultUnit: varchar('default_unit', { length: 50 }).default('piece'), // e.g., 'cup', 'tbsp', 'piece'
  caloriesPerUnit: decimal('calories_per_unit', { precision: 8, scale: 2 }),
  proteinPerUnit: decimal('protein_per_unit', { precision: 8, scale: 4 }),
  carbsPerUnit: decimal('carbs_per_unit', { precision: 8, scale: 4 }),
  fatPerUnit: decimal('fat_per_unit', { precision: 8, scale: 4 }),
  createdAt: timestamp('created_at').defaultNow(),
});

// Meal Ingredients Junction Table
export const mealIngredients = pgTable('meal_ingredients', {
  id: uuid('id').primaryKey().defaultRandom(),
  mealId: uuid('meal_id').notNull().references(() => meals.id, { onDelete: 'cascade' }),
  ingredientId: uuid('ingredient_id').notNull().references(() => ingredients.id, { onDelete: 'cascade' }),
  quantity: decimal('quantity', { precision: 10, scale: 3 }).notNull(),
  unit: varchar('unit', { length: 50 }).notNull(),
  notes: text('notes'), // e.g., "chopped", "diced", "optional"
  createdAt: timestamp('created_at').defaultNow(),
});

// Weekly Meal Plans Table
export const weeklyMealPlans = pgTable('weekly_meal_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  startDate: timestamp('start_date').notNull(), // Monday of the week
  endDate: timestamp('end_date').notNull(), // Sunday of the week
  totalEstimatedCost: decimal('total_estimated_cost', { precision: 10, scale: 2 }),
  isActive: boolean('is_active').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Planned Meals Table (Junction between meal plans and meals)
export const plannedMeals = pgTable('planned_meals', {
  id: uuid('id').primaryKey().defaultRandom(),
  weeklyMealPlanId: uuid('weekly_meal_plan_id').notNull().references(() => weeklyMealPlans.id, { onDelete: 'cascade' }),
  mealId: uuid('meal_id').notNull().references(() => meals.id, { onDelete: 'cascade' }),
  plannedDate: timestamp('planned_date').notNull(),
  mealSlot: varchar('meal_slot', { length: 50 }), // e.g., "breakfast", "lunch", "dinner", "snack", or custom
  servings: integer('servings').default(2),
  isCompleted: boolean('is_completed').default(false),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Daily Planned Meals Table (Simplified for daily planning without weekly plans)
export const dailyPlannedMeals = pgTable('daily_planned_meals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  mealId: uuid('meal_id').notNull().references(() => meals.id, { onDelete: 'cascade' }),
  plannedDate: varchar('planned_date', { length: 10 }).notNull(), // ISO date string (YYYY-MM-DD)
  mealSlot: varchar('meal_slot', { length: 50 }), // e.g., "breakfast", "lunch", "dinner", "snack", or custom
  servings: integer('servings').default(2),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Daily Remarks Table
export const dailyRemarks = pgTable('daily_remarks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: varchar('date', { length: 10 }).notNull(), // ISO date string (YYYY-MM-DD)
  remark: text('remark').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Shopping Lists Table
export const shoppingLists = pgTable('shopping_lists', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  weeklyMealPlanId: uuid('weekly_meal_plan_id').references(() => weeklyMealPlans.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(),
  isCompleted: boolean('is_completed').default(false),
  totalEstimatedCost: decimal('total_estimated_cost', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Shopping List Items Table
export const shoppingListItems = pgTable('shopping_list_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  shoppingListId: uuid('shopping_list_id').notNull().references(() => shoppingLists.id, { onDelete: 'cascade' }),
  ingredientId: uuid('ingredient_id').references(() => ingredients.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(), // Fallback if no ingredientId
  quantity: decimal('quantity', { precision: 10, scale: 3 }).notNull(),
  unit: varchar('unit', { length: 50 }).notNull(),
  estimatedCost: decimal('estimated_cost', { precision: 8, scale: 2 }),
  actualCost: decimal('actual_cost', { precision: 8, scale: 2 }),
  isPurchased: boolean('is_purchased').default(false),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Nutritional Goals Table
export const nutritionalGoals = pgTable('nutritional_goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  dailyCalories: integer('daily_calories'),
  dailyProtein: decimal('daily_protein', { precision: 8, scale: 2 }), // in grams
  dailyCarbs: decimal('daily_carbs', { precision: 8, scale: 2 }), // in grams
  dailyFat: decimal('daily_fat', { precision: 8, scale: 2 }), // in grams
  dailyFiber: decimal('daily_fiber', { precision: 8, scale: 2 }), // in grams
  dailySodium: decimal('daily_sodium', { precision: 8, scale: 2 }), // in mg
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Global Settings Table
export const globalSettings = pgTable('global_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  settingKey: varchar('setting_key', { length: 100 }).notNull().unique(),
  settingValue: text('setting_value').notNull(),
  lastUpdatedBy: uuid('last_updated_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Weekly Day Settings Table - stores enable/disable status for each week
export const weeklyDaySettings = pgTable('weekly_day_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  weekStartDate: date('week_start_date').notNull().unique(), // Monday of the week
  enabledDays: jsonb('enabled_days').notNull().default('{"sunday":true,"monday":true,"tuesday":true,"wednesday":true,"thursday":true,"friday":true,"saturday":true}'),
  lastUpdatedBy: uuid('last_updated_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  settings: one(userSettings, {
    fields: [users.id],
    references: [userSettings.userId],
  }),
  meals: many(meals),
  weeklyMealPlans: many(weeklyMealPlans),
  shoppingLists: many(shoppingLists),
  nutritionalGoals: many(nutritionalGoals),
  dailyPlannedMeals: many(dailyPlannedMeals),
  dailyRemarks: many(dailyRemarks),
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
  mealIngredients: many(mealIngredients),
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

export const categoriesRelations = relations(categories, ({ many }) => ({
  meals: many(meals),
}));

export const ingredientsRelations = relations(ingredients, ({ many }) => ({
  mealIngredients: many(mealIngredients),
  shoppingListItems: many(shoppingListItems),
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
  weeklyMealPlan: one(weeklyMealPlans, {
    fields: [plannedMeals.weeklyMealPlanId],
    references: [weeklyMealPlans.id],
  }),
  meal: one(meals, {
    fields: [plannedMeals.mealId],
    references: [meals.id],
  }),
}));

export const shoppingListsRelations = relations(shoppingLists, ({ one, many }) => ({
  user: one(users, {
    fields: [shoppingLists.userId],
    references: [users.id],
  }),
  weeklyMealPlan: one(weeklyMealPlans, {
    fields: [shoppingLists.weeklyMealPlanId],
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

export const dailyRemarksRelations = relations(dailyRemarks, ({ one }) => ({
  user: one(users, {
    fields: [dailyRemarks.userId],
    references: [users.id],
  }),
}));
