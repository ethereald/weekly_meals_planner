-- Migration: Add category-level enable/disable support to weekly_day_settings
-- This replaces the day-level enabled_days JSONB with category-level enabled_categories

-- First, create a backup of existing data (optional, for safety)
-- CREATE TABLE weekly_day_settings_backup AS SELECT * FROM weekly_day_settings;

-- Add the new enabled_categories column
ALTER TABLE weekly_day_settings 
ADD COLUMN enabled_categories JSONB DEFAULT '{
  "sunday":{"breakfast":true,"lunch":true,"dinner":true,"snack":true},
  "monday":{"breakfast":true,"lunch":true,"dinner":true,"snack":true},
  "tuesday":{"breakfast":true,"lunch":true,"dinner":true,"snack":true},
  "wednesday":{"breakfast":true,"lunch":true,"dinner":true,"snack":true},
  "thursday":{"breakfast":true,"lunch":true,"dinner":true,"snack":true},
  "friday":{"breakfast":true,"lunch":true,"dinner":true,"snack":true},
  "saturday":{"breakfast":true,"lunch":true,"dinner":true,"snack":true}
}';

-- Migrate existing data from enabled_days to enabled_categories
-- This converts day-level enable/disable to category-level (all categories enabled for enabled days, all disabled for disabled days)
UPDATE weekly_day_settings SET enabled_categories = (
  SELECT jsonb_build_object(
    'sunday', CASE WHEN (enabled_days->>'sunday')::boolean THEN '{"breakfast":true,"lunch":true,"dinner":true,"snack":true}' ELSE '{"breakfast":false,"lunch":false,"dinner":false,"snack":false}' END::jsonb,
    'monday', CASE WHEN (enabled_days->>'monday')::boolean THEN '{"breakfast":true,"lunch":true,"dinner":true,"snack":true}' ELSE '{"breakfast":false,"lunch":false,"dinner":false,"snack":false}' END::jsonb,
    'tuesday', CASE WHEN (enabled_days->>'tuesday')::boolean THEN '{"breakfast":true,"lunch":true,"dinner":true,"snack":true}' ELSE '{"breakfast":false,"lunch":false,"dinner":false,"snack":false}' END::jsonb,
    'wednesday', CASE WHEN (enabled_days->>'wednesday')::boolean THEN '{"breakfast":true,"lunch":true,"dinner":true,"snack":true}' ELSE '{"breakfast":false,"lunch":false,"dinner":false,"snack":false}' END::jsonb,
    'thursday', CASE WHEN (enabled_days->>'thursday')::boolean THEN '{"breakfast":true,"lunch":true,"dinner":true,"snack":true}' ELSE '{"breakfast":false,"lunch":false,"dinner":false,"snack":false}' END::jsonb,
    'friday', CASE WHEN (enabled_days->>'friday')::boolean THEN '{"breakfast":true,"lunch":true,"dinner":true,"snack":true}' ELSE '{"breakfast":false,"lunch":false,"dinner":false,"snack":false}' END::jsonb,
    'saturday', CASE WHEN (enabled_days->>'saturday')::boolean THEN '{"breakfast":true,"lunch":true,"dinner":true,"snack":true}' ELSE '{"breakfast":false,"lunch":false,"dinner":false,"snack":false}' END::jsonb
  )
) WHERE enabled_days IS NOT NULL;

-- Make the new column NOT NULL
ALTER TABLE weekly_day_settings ALTER COLUMN enabled_categories SET NOT NULL;

-- Drop the old enabled_days column
ALTER TABLE weekly_day_settings DROP COLUMN enabled_days;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_weekly_day_settings_enabled_categories ON weekly_day_settings USING gin(enabled_categories);