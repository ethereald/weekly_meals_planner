-- Add display_name column to users table
ALTER TABLE users ADD COLUMN display_name VARCHAR(255);

-- Set default display_name to username for existing users
UPDATE users SET display_name = username WHERE display_name IS NULL;
