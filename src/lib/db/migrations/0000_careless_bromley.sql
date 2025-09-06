CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text(100) NOT NULL,
	`description` text,
	`color_code` text(7),
	`created_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_name_unique` ON `categories` (`name`);--> statement-breakpoint
CREATE TABLE `daily_planned_meals` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`meal_id` text NOT NULL,
	`planned_date` text NOT NULL,
	`planned_time` text(20),
	`servings` integer DEFAULT 2,
	`notes` text,
	`created_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`meal_id`) REFERENCES `meals`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `ingredients` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text(255) NOT NULL,
	`category` text(100),
	`default_unit` text(50),
	`calories_per_unit` real,
	`protein_per_unit` real,
	`carbs_per_unit` real,
	`fat_per_unit` real,
	`created_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ingredients_name_unique` ON `ingredients` (`name`);--> statement-breakpoint
CREATE TABLE `meal_ingredients` (
	`id` text PRIMARY KEY NOT NULL,
	`meal_id` text NOT NULL,
	`ingredient_id` text NOT NULL,
	`quantity` real NOT NULL,
	`unit` text(50) NOT NULL,
	`notes` text,
	FOREIGN KEY (`meal_id`) REFERENCES `meals`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `meals` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text(255) NOT NULL,
	`description` text,
	`instructions` text,
	`prep_time` integer,
	`cook_time` integer,
	`total_time` integer,
	`servings` integer DEFAULT 2,
	`difficulty` text(20) DEFAULT 'easy',
	`meal_type` text(20) NOT NULL,
	`category_id` text,
	`image_url` text,
	`source_url` text,
	`calories` integer,
	`protein` real,
	`carbs` real,
	`fat` real,
	`fiber` real,
	`sugar` real,
	`sodium` real,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `nutritional_goals` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`daily_calories` integer,
	`daily_protein` real,
	`daily_carbs` real,
	`daily_fat` real,
	`daily_fiber` real,
	`daily_sodium` real,
	`is_active` integer DEFAULT true,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `planned_meals` (
	`id` text PRIMARY KEY NOT NULL,
	`meal_plan_id` text NOT NULL,
	`meal_id` text NOT NULL,
	`day_of_week` integer NOT NULL,
	`meal_time` text(20) NOT NULL,
	`servings` integer DEFAULT 2,
	`notes` text,
	`created_at` text,
	FOREIGN KEY (`meal_plan_id`) REFERENCES `weekly_meal_plans`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`meal_id`) REFERENCES `meals`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `shopping_list_items` (
	`id` text PRIMARY KEY NOT NULL,
	`shopping_list_id` text NOT NULL,
	`ingredient_id` text,
	`name` text(255) NOT NULL,
	`quantity` real NOT NULL,
	`unit` text(50) NOT NULL,
	`category` text(100),
	`is_purchased` integer DEFAULT false,
	`price` real,
	`notes` text,
	`created_at` text,
	FOREIGN KEY (`shopping_list_id`) REFERENCES `shopping_lists`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `shopping_lists` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`meal_plan_id` text,
	`name` text(255) NOT NULL,
	`is_completed` integer DEFAULT false,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`meal_plan_id`) REFERENCES `weekly_meal_plans`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`dietary_restrictions` text,
	`preferred_meal_times` text,
	`weekly_meal_goal` integer DEFAULT 21,
	`serving_size` integer DEFAULT 2,
	`budget_range` real,
	`shopping_day` text(20) DEFAULT 'sunday',
	`notifications_enabled` integer DEFAULT true,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text(255) NOT NULL,
	`password` text(255) NOT NULL,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE TABLE `weekly_meal_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`week_start_date` text NOT NULL,
	`name` text(255) DEFAULT 'Weekly Meal Plan',
	`is_active` integer DEFAULT true,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
