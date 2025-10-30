-- =============================================
-- WEEKLY MEALS PLANNER - DATABASE SCHEMA
-- =============================================
-- Generated on: 2025-10-30T05:55:28.392Z
-- Source: ep-summer-sky-adj4ee2g-pooler.c-2.us-east-1.aws.neon.tech
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- ENUMS
-- =============================================

CREATE TYPE dietary_restriction AS ENUM ('vegetarian', 'vegan', 'gluten_free', 'dairy_free', 'nut_free', 'low_carb', 'keto', 'paleo', 'low_sodium', 'diabetic');

CREATE TYPE difficulty AS ENUM ('easy', 'medium', 'hard');

-- =============================================
-- TABLES
-- =============================================

CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  username VARCHAR NOT NULL,
  password VARCHAR NOT NULL,
  role VARCHAR(255) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  display_name VARCHAR,
  PRIMARY KEY (id),
  UNIQUE (username),
  CHECK id IS NOT NULL,
  CHECK username IS NOT NULL,
  CHECK password IS NOT NULL,
  CHECK role IS NOT NULL
);

CREATE TABLE user_settings (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  user_id UUID NOT NULL,
  dietary_restrictions TEXT[],
  preferred_meal_times TEXT,
  enabled_meal_categories TEXT DEFAULT '["breakfast","lunch","dinner","snack"]',
  weekly_meal_goal INTEGER DEFAULT 21,
  serving_size INTEGER DEFAULT 2,
  budget_range DECIMAL,
  shopping_day VARCHAR(255) DEFAULT 'sunday',
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  theme VARCHAR(255) DEFAULT 'light',
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CHECK id IS NOT NULL,
  CHECK user_id IS NOT NULL
);

CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  name VARCHAR NOT NULL,
  description TEXT,
  color VARCHAR(255) DEFAULT '#3B82F6',
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id),
  UNIQUE (name),
  CHECK id IS NOT NULL,
  CHECK name IS NOT NULL
);

CREATE TABLE tags (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  name VARCHAR NOT NULL,
  color VARCHAR(255) DEFAULT '#6B7280',
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id),
  UNIQUE (name),
  CHECK id IS NOT NULL,
  CHECK name IS NOT NULL
);

CREATE TABLE meals (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  user_id UUID NOT NULL,
  category_id UUID,
  name VARCHAR NOT NULL,
  description TEXT,
  difficulty USER-DEFINED DEFAULT 'easy',
  cook_time INTEGER,
  servings INTEGER DEFAULT 2,
  calories INTEGER,
  protein DECIMAL,
  carbs DECIMAL,
  fat DECIMAL,
  fiber DECIMAL,
  sugar DECIMAL,
  sodium DECIMAL,
  instructions TEXT NOT NULL,
  notes TEXT,
  image_url VARCHAR,
  is_public BOOLEAN DEFAULT false,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id),
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CHECK instructions IS NOT NULL,
  CHECK id IS NOT NULL,
  CHECK user_id IS NOT NULL,
  CHECK name IS NOT NULL
);

CREATE TABLE meal_tags (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  meal_id UUID NOT NULL,
  tag_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id),
  FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
  CHECK id IS NOT NULL,
  CHECK meal_id IS NOT NULL,
  CHECK tag_id IS NOT NULL
);

CREATE TABLE ingredients (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  name VARCHAR NOT NULL,
  category VARCHAR,
  default_unit VARCHAR(255) DEFAULT 'piece',
  calories_per_unit DECIMAL,
  protein_per_unit DECIMAL,
  carbs_per_unit DECIMAL,
  fat_per_unit DECIMAL,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id),
  UNIQUE (name),
  CHECK id IS NOT NULL,
  CHECK name IS NOT NULL
);

CREATE TABLE meal_ingredients (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  meal_id UUID NOT NULL,
  ingredient_id UUID NOT NULL,
  quantity DECIMAL NOT NULL,
  unit VARCHAR NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id),
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE,
  FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE,
  CHECK id IS NOT NULL,
  CHECK meal_id IS NOT NULL,
  CHECK ingredient_id IS NOT NULL,
  CHECK quantity IS NOT NULL,
  CHECK unit IS NOT NULL
);

CREATE TABLE weekly_meal_plans (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  user_id UUID NOT NULL,
  name VARCHAR NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  total_estimated_cost DECIMAL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CHECK id IS NOT NULL,
  CHECK user_id IS NOT NULL,
  CHECK name IS NOT NULL,
  CHECK start_date IS NOT NULL,
  CHECK end_date IS NOT NULL
);

CREATE TABLE planned_meals (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  weekly_meal_plan_id UUID NOT NULL,
  meal_id UUID NOT NULL,
  planned_date TIMESTAMP NOT NULL,
  meal_slot VARCHAR,
  servings INTEGER DEFAULT 2,
  is_completed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id),
  FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE,
  FOREIGN KEY (weekly_meal_plan_id) REFERENCES weekly_meal_plans(id) ON DELETE CASCADE,
  CHECK id IS NOT NULL,
  CHECK weekly_meal_plan_id IS NOT NULL,
  CHECK meal_id IS NOT NULL,
  CHECK planned_date IS NOT NULL
);

CREATE TABLE daily_planned_meals (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  user_id UUID NOT NULL,
  meal_id UUID NOT NULL,
  planned_date VARCHAR NOT NULL,
  meal_slot VARCHAR,
  servings INTEGER DEFAULT 2,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id),
  FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CHECK id IS NOT NULL,
  CHECK user_id IS NOT NULL,
  CHECK meal_id IS NOT NULL,
  CHECK planned_date IS NOT NULL
);

CREATE TABLE daily_remarks (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  user_id UUID NOT NULL,
  date VARCHAR NOT NULL,
  remark TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_modified_by UUID,
  PRIMARY KEY (id),
  UNIQUE (date),
  UNIQUE (user_id),
  UNIQUE (date),
  UNIQUE (user_id),
  UNIQUE (date),
  FOREIGN KEY (last_modified_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CHECK id IS NOT NULL,
  CHECK user_id IS NOT NULL,
  CHECK date IS NOT NULL,
  CHECK remark IS NOT NULL
);

CREATE TABLE shopping_lists (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  user_id UUID NOT NULL,
  weekly_meal_plan_id UUID,
  name VARCHAR NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  total_estimated_cost DECIMAL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (weekly_meal_plan_id) REFERENCES weekly_meal_plans(id) ON DELETE CASCADE,
  CHECK id IS NOT NULL,
  CHECK user_id IS NOT NULL,
  CHECK name IS NOT NULL
);

CREATE TABLE shopping_list_items (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  shopping_list_id UUID NOT NULL,
  ingredient_id UUID,
  name VARCHAR NOT NULL,
  quantity DECIMAL NOT NULL,
  unit VARCHAR NOT NULL,
  estimated_cost DECIMAL,
  actual_cost DECIMAL,
  is_purchased BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id),
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE,
  FOREIGN KEY (shopping_list_id) REFERENCES shopping_lists(id) ON DELETE CASCADE,
  CHECK id IS NOT NULL,
  CHECK shopping_list_id IS NOT NULL,
  CHECK name IS NOT NULL,
  CHECK quantity IS NOT NULL,
  CHECK unit IS NOT NULL
);

CREATE TABLE nutritional_goals (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  user_id UUID NOT NULL,
  daily_calories INTEGER,
  daily_protein DECIMAL,
  daily_carbs DECIMAL,
  daily_fat DECIMAL,
  daily_fiber DECIMAL,
  daily_sodium DECIMAL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CHECK id IS NOT NULL,
  CHECK user_id IS NOT NULL
);

CREATE TABLE global_settings (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  setting_key VARCHAR NOT NULL,
  setting_value TEXT NOT NULL,
  last_updated_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id),
  UNIQUE (setting_key),
  FOREIGN KEY (last_updated_by) REFERENCES users(id) ON DELETE CASCADE,
  CHECK id IS NOT NULL,
  CHECK setting_key IS NOT NULL,
  CHECK setting_value IS NOT NULL
);

CREATE TABLE weekly_day_settings (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  week_start_date DATE NOT NULL,
  enabled_days JSONB NOT NULL DEFAULT '{"friday": true, "monday": true, "sunday": true, "tuesday": true, "saturday": true, "thursday": true, "wednesday": true}',
  last_updated_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  enabled_categories JSONB DEFAULT '{"friday": {"lunch": true, "snack": true, "dinner": true, "breakfast": true}, "monday": {"lunch": true, "snack": true, "dinner": true, "breakfast": true}, "sunday": {"lunch": true, "snack": true, "dinner": true, "breakfast": true}, "tuesday": {"lunch": true, "snack": true, "dinner": true, "breakfast": true}, "saturday": {"lunch": true, "snack": true, "dinner": true, "breakfast": true}, "thursday": {"lunch": true, "snack": true, "dinner": true, "breakfast": true}, "wednesday": {"lunch": true, "snack": true, "dinner": true, "breakfast": true}}',
  PRIMARY KEY (id),
  UNIQUE (week_start_date),
  FOREIGN KEY (last_updated_by) REFERENCES users(id) ON DELETE CASCADE,
  CHECK id IS NOT NULL,
  CHECK week_start_date IS NOT NULL,
  CHECK enabled_days IS NOT NULL
);

-- =============================================
-- INDEXES
-- =============================================

CREATE UNIQUE INDEX categories_name_unique ON public.categories USING btree (name);
CREATE UNIQUE INDEX daily_remarks_date_unique ON public.daily_remarks USING btree (date);
CREATE UNIQUE INDEX daily_remarks_user_id_date_key ON public.daily_remarks USING btree (user_id, date);
CREATE INDEX idx_daily_remarks_date ON public.daily_remarks USING btree (date);
CREATE INDEX idx_daily_remarks_user_id ON public.daily_remarks USING btree (user_id);
CREATE UNIQUE INDEX global_settings_setting_key_unique ON public.global_settings USING btree (setting_key);
CREATE UNIQUE INDEX ingredients_name_unique ON public.ingredients USING btree (name);
CREATE UNIQUE INDEX tags_name_unique ON public.tags USING btree (name);
CREATE UNIQUE INDEX users_username_unique ON public.users USING btree (username);
CREATE INDEX idx_weekly_day_settings_enabled_categories_gin ON public.weekly_day_settings USING gin (enabled_categories);
CREATE INDEX idx_weekly_day_settings_week_start ON public.weekly_day_settings USING btree (week_start_date);
CREATE UNIQUE INDEX weekly_day_settings_week_start_date_unique ON public.weekly_day_settings USING btree (week_start_date);

-- =============================================
-- INITIAL ADMIN USER
-- =============================================

-- Create admin user (username: admin, password: admin)
INSERT INTO users (id, username, display_name, password, role, created_at, updated_at) VALUES (
  gen_random_uuid(),
  'admin',
  'Administrator',
  '$2b$10$g8BVuikEbrkc9wnyW6qWXuxdycD3pMkp8A3BFc0IZivC.gJTgGrn2',
  'admin',
  NOW(),
  NOW()
);

-- Create default user settings for admin
INSERT INTO user_settings (id, user_id, dietary_restrictions, preferred_meal_times, enabled_meal_categories, weekly_meal_goal, serving_size, budget_range, shopping_day, theme, notifications_enabled, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  u.id,
  NULL,
  NULL,
  '["breakfast","lunch","dinner","snack"]',
  21,
  2,
  NULL,
  'sunday',
  'light',
  true,
  NOW(),
  NOW()
FROM users u WHERE u.username = 'admin';

-- Create default meal categories
INSERT INTO categories (id, name, description, color, created_at) VALUES
  (gen_random_uuid(), 'Breakfast', 'Morning meals', '#FF6B6B', NOW()),
  (gen_random_uuid(), 'Lunch', 'Midday meals', '#4ECDC4', NOW()),
  (gen_random_uuid(), 'Dinner', 'Evening meals', '#45B7D1', NOW()),
  (gen_random_uuid(), 'Snack', 'Light snacks and treats', '#96CEB4', NOW()),
  (gen_random_uuid(), 'Dessert', 'Sweet treats and desserts', '#FECA57', NOW());

-- Create some default tags
INSERT INTO tags (id, name, color, created_at) VALUES
  (gen_random_uuid(), 'Quick', '#FF6B6B', NOW()),
  (gen_random_uuid(), 'Healthy', '#4ECDC4', NOW()),
  (gen_random_uuid(), 'Vegetarian', '#45B7D1', NOW()),
  (gen_random_uuid(), 'Low Carb', '#96CEB4', NOW()),
  (gen_random_uuid(), 'High Protein', '#FECA57', NOW()),
  (gen_random_uuid(), 'Comfort Food', '#F38BA8', NOW());

