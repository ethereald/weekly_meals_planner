import { pgTable, uuid, varchar, text, timestamp, boolean, integer, decimal, pgEnum } from 'drizzle-orm/pg-core';
import { sqliteTable, text as sqliteText, integer as sqliteInteger, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// Check if we're using PostgreSQL or SQLite
const isProduction = process.env.NODE_ENV === 'production';
const hasDbUrl = Boolean(process.env.DATABASE_URL);
const usePostgres = isProduction && hasDbUrl;

// PostgreSQL Enums (only used in production)
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

export const mealTypeEnum = pgEnum('meal_type', [
  'breakfast',
  'lunch',
  'dinner',
  'snack',
  'dessert'
]);

export const difficultyEnum = pgEnum('difficulty', [
  'easy',
  'medium',
  'hard'
]);

// Users Table - PostgreSQL version
const pgUsers = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Users Table - SQLite version  
const sqliteUsers = sqliteTable('users', {
  id: sqliteText('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  username: sqliteText('username', { length: 255 }).notNull().unique(),
  password: sqliteText('password', { length: 255 }).notNull(),
  createdAt: sqliteText('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: sqliteText('updated_at').$defaultFn(() => new Date().toISOString()),
});

// Export the appropriate table based on environment
export const users = usePostgres ? pgUsers : sqliteUsers;

// User Settings Table
export const userSettings = pgTable('user_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  dietaryRestrictions: text('dietary_restrictions').array(), // Array of dietary restrictions
  preferredMealTimes: text('preferred_meal_times'), // JSON string for meal time preferences
  weeklyMealGoal: integer('weekly_meal_goal').default(21), // 3 meals × 7 days
  servingSize: integer('serving_size').default(2), // Default serving size
  budgetRange: decimal('budget_range', { precision: 10, scale: 2 }), // Weekly budget
  shoppingDay: varchar('shopping_day', { length: 20 }).default('sunday'), // Preferred shopping day
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
  mealType: mealTypeEnum('meal_type').notNull(),
  difficulty: difficultyEnum('difficulty').default('easy'),
  prepTime: integer('prep_time'), // in minutes
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
  mealType: mealTypeEnum('meal_type').notNull(),
  servings: integer('servings').default(2),
  isCompleted: boolean('is_completed').default(false),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
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
