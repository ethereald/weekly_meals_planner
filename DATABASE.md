# Database Setup

This project uses **PostgreSQL** with Drizzle ORM for type-safe database operations.

## How It Works

The database configuration is managed through environment variables and Drizzle ORM automatically handles the connection and schema management.

## Prerequisites

- PostgreSQL database instance (local, Docker, or cloud service like Supabase, Neon, Railway)
- Node.js environment with environment variables configured

## Environment Setup

1. Copy the environment template:
   ```bash
   cp .env.example .env.local
   ```

2. Configure your PostgreSQL connection:
   ```bash
   # In .env.local
   NODE_ENV="production" # Forces PostgreSQL usage
   DATABASE_URL="postgresql://username:password@localhost:5432/weekly_meals_planner"
   ```

## Database Schema

The application uses a comprehensive PostgreSQL schema with the following features:

### Database Structure
- **2 Custom Enums**: `dietary_restriction`, `difficulty`
- **17 Tables**: Complete application schema with relationships
- **12 Indexes**: Performance optimization indexes
- **UUID Extension**: PostgreSQL pgcrypto extension for UUID generation

### Core Tables
- **users**: User authentication and profile information
- **user_settings**: User preferences and dietary restrictions
- **categories**: Meal categories (Breakfast, Lunch, Dinner, Snack, Dessert)
- **tags**: Meal tags for organization (Quick, Healthy, Vegetarian, etc.)

### Meal Management
- **meals**: Recipe storage with full nutritional information
- **ingredients**: Ingredient database with nutritional data per unit
- **meal_ingredients**: Recipe composition (many-to-many relationship)
- **meal_tags**: Meal tagging system (many-to-many relationship)

### Planning & Shopping
- **weekly_meal_plans**: Weekly meal planning with cost estimation
- **planned_meals**: Individual meal assignments to specific days and time slots
- **daily_planned_meals**: Simplified daily meal planning
- **daily_remarks**: Daily notes and remarks with sharing capabilities
- **shopping_lists**: Generated shopping lists from meal plans
- **shopping_list_items**: Individual items with quantity, cost tracking
- **nutritional_goals**: User nutritional targets and goals

### System Tables
- **global_settings**: Application-wide configuration settings
- **weekly_day_settings**: Weekly day-specific configurations with category-level control

### Initial Data
The schema includes default data for immediate use:
- **Admin User**: username `admin`, password `admin` (change in production!)
- **Default Categories**: Breakfast, Lunch, Dinner, Snack, Dessert
- **Default Tags**: Quick, Healthy, Vegetarian, Low Carb, High Protein, Comfort Food

## Database Commands

### Push Schema to Database
```bash
pnpm db:push
```

### Generate Migration Files
```bash
pnpm db:generate
```

### Apply Migrations
```bash
pnpm db:migrate
```

### Seed Database with Initial Data
```bash
pnpm db:seed
```

### Open Database Studio
```bash
pnpm db:studio
```

### Export Database Schema
```bash
pnpm db:export-schema
```
This generates a complete `database-schema-setup.sql` file with schema, indexes, and initial data.

### Create Database Backup
```bash
pnpm db:backup
```

## Quick Setup Guide

### Method 1: Using Generated SQL Script (Recommended)

This is the fastest way to set up a complete database with all schema, indexes, and initial data:

1. **Create a PostgreSQL database**:
   ```bash
   createdb weekly_meals_planner
   ```
   
   Or use a cloud service like Neon, Supabase, or Railway.

2. **Generate the complete SQL setup script**:
   ```bash
   pnpm db:export-schema
   ```
   
   This creates `database-schema-setup.sql` with everything needed.

3. **Initialize database with the SQL script**:
   ```bash
   psql -d weekly_meals_planner -f database-schema-setup.sql
   ```
   
   Or for remote databases:
   ```bash
   psql -h your-host -p 5432 -U your-username -d your-database -f database-schema-setup.sql
   ```

4. **Configure environment variables**:
   ```bash
   # In .env.local
   NODE_ENV="production"
   DATABASE_URL="postgresql://username:password@localhost:5432/weekly_meals_planner"
   ```

5. **Start development**:
   ```bash
   pnpm dev
   ```

6. **Login with admin credentials**:
   - Username: `admin`
   - Password: `admin`
   - **⚠️ Change the admin password after first login!**

7. **Verify setup**:
   - Visit http://localhost:3000/api/health
   - Check database tables: `pnpm db:studio`

### Method 2: Using Drizzle Commands (Alternative)

If you prefer to use Drizzle ORM commands for schema management:

1. **Create a PostgreSQL database**:
   ```bash
   createdb weekly_meals_planner
   ```

2. **Configure environment variables**:
   ```bash
   # In .env.local
   NODE_ENV="production"
   DATABASE_URL="postgresql://username:password@localhost:5432/weekly_meals_planner"
   ```

3. **Initialize database schema**:
   ```bash
   pnpm db:push
   ```

4. **Seed with initial data**:
   ```bash
   pnpm db:seed
   ```

5. **Start development**:
   ```bash
   pnpm dev
   ```

6. **Verify setup**:
   - Visit http://localhost:3000/api/health
   - Check database tables: `pnpm db:studio`

### Using Docker for local PostgreSQL:

```bash
# Start PostgreSQL container
docker run --name postgres-weekly-meals \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=weekly_meals_planner \
  -p 5432:5432 -d postgres

# Then use this DATABASE_URL:
DATABASE_URL="postgresql://postgres:password@localhost:5432/weekly_meals_planner"
```

## Manual Database Setup (Alternative)

If you prefer to set up the database manually or need to restore from a backup:

1. **Create database and user**:
   ```sql
   CREATE DATABASE weekly_meals_planner;
   CREATE USER your_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE weekly_meals_planner TO your_user;
   ```

2. **Generate and install the complete schema**:
   ```bash
   # First, generate the SQL setup script
   pnpm db:export-schema
   
   # Then install it to your database
   psql -d weekly_meals_planner -f database-schema-setup.sql
   ```

3. **Verify the installation**:
   ```bash
   psql -d weekly_meals_planner -c "\dt"  # List tables (should show 17 tables)
   psql -d weekly_meals_planner -c "SELECT username, role FROM users;"  # Check admin user
   psql -d weekly_meals_planner -c "SELECT COUNT(*) FROM categories;"  # Check default data (should be 5)
   ```

### What the SQL Script Includes

The generated `database-schema-setup.sql` file contains:

- **Complete Schema**: All 17 tables with proper relationships
- **Enums**: 2 custom PostgreSQL enums (`dietary_restriction`, `difficulty`)
- **Indexes**: 12 performance optimization indexes
- **Extensions**: PostgreSQL `pgcrypto` extension for UUID generation
- **Admin User**: Pre-created admin account (username: `admin`, password: `admin`)
- **Default Data**: Categories, tags, and global settings
- **User Settings**: Default preferences for the admin user

### PostgreSQL Connection Examples

**Local PostgreSQL:**
```bash
psql -U postgres -d weekly_meals_planner -f database-schema-setup.sql
```

**Cloud Database (Neon, Supabase, etc.):**
```bash
psql "postgresql://username:password@host:port/database?sslmode=require" -f database-schema-setup.sql
```

**Docker PostgreSQL:**
```bash
docker exec -i postgres-container psql -U postgres -d weekly_meals_planner < database-schema-setup.sql
```

## Schema Features

- **Type Safety**: Full TypeScript support with Drizzle ORM
- **UUID Primary Keys**: All tables use UUID primary keys with automatic generation
- **Proper Foreign Keys**: Full referential integrity with cascade deletes where appropriate
- **Comprehensive Indexing**: Performance-optimized with strategic indexes
- **Flexible Design**: Supports both weekly planning and simple daily meal planning
- **Enums**: Type-safe enums for dietary restrictions, difficulty levels, etc.
- **Nutritional Data**: Comprehensive nutritional information storage with decimal precision
- **User Preferences**: Customizable dietary restrictions, meal categories, and preferences
- **Category Control**: Day-level and category-level meal planning control

## Database Structure Overview

```
Users → User Settings
  ↓
Meals ← Categories ← Tags (many-to-many)
  ↓
Meal Ingredients ← Ingredients
  ↓
Weekly Meal Plans → Planned Meals
Daily Planned Meals (simplified planning)
  ↓
Shopping Lists → Shopping List Items
Daily Remarks (with sharing)
Global Settings & Weekly Day Settings
Nutritional Goals
```

## Security Notes

- The admin user password is hashed using bcrypt
- The default admin password is `admin` - **change this in production!**
- All sensitive data should be handled according to your security requirements
- Database connections use SSL in production environments

## Environment Requirements

Make sure your `.env.local` file contains:
```bash
NODE_ENV="production"  # Forces PostgreSQL usage
DATABASE_URL="postgresql://username:password@host:port/database"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

## Project Files Overview

### Database-Related Configuration Files (Root Directory)
```
drizzle.config.ts         # Drizzle ORM configuration - handles PostgreSQL connection
package.json              # Contains database scripts (db:push, db:seed, etc.)
middleware.ts             # Authentication middleware for protected routes
.env.local                # Database connection and environment configuration
.env.example              # Template for environment variables
tsconfig.json             # TypeScript configuration for database types
```

### Database Scripts Directory
```
scripts/
├── backup-database.js    # Comprehensive database backup utility
├── seed-admin.ts         # Create admin user and initial data
├── migrate-add-role.ts   # User role migration
├── add-theme-column.ts   # Theme preference migration
├── export-database-schema.ts  # Export current schema
└── ...                   # Other maintenance scripts
```

### Database Source Files
```
src/lib/db/
├── db.ts                 # Database connection and configuration
├── schema.ts             # Complete PostgreSQL schema definition
├── seed.ts               # Database seeding utilities
└── migrations/           # Drizzle migration files
```

### Files Removed During Database Migration
The following legacy files were cleaned up after PostgreSQL migration:
- `sqlite.db` - Old SQLite database file
- `migrate-with-imports.mjs` - SQLite migration script
- `promote-admin.js` - SQLite admin utility
- `database-schema-setup.sql` - Static schema export
- `backup-postgresql.js` - One-time backup script
- `migrate-postgresql-day-level.js` - Day-level migration
- `verify-migration.js` - Migration verification
- `browser-migration.js` - Browser-based migration tool
- All backup directories from migration process

## Troubleshooting

### Common Issues

1. **Connection refused**: Check that PostgreSQL is running and accessible
2. **Schema errors**: Run `pnpm db:push` to sync schema with database
3. **Missing admin user**: Run `pnpm db:seed` to create initial data
4. **Permission errors**: Ensure database user has proper privileges

### Health Check

Visit `/api/health` in your application to verify database connectivity and schema status.

## Database Backup & Recovery

The project includes a comprehensive backup utility that creates full database backups including schema, data, and metadata.

### Creating Backups

**Quick Backup:**
```bash
pnpm db:backup
```

**Manual Backup:**
```bash
node scripts/backup-database.js
```

### Backup Features

The backup script (`scripts/backup-database.js`) provides:

- **Comprehensive Coverage**: Backs up all 17 tables with complete schema and data
- **Multiple Methods**: Attempts `pg_dump` first, falls back to manual SQL queries
- **Metadata Collection**: Includes database statistics and schema information
- **Restore Instructions**: Generates detailed restoration guide
- **Timestamped Storage**: Creates unique backup directories with timestamps
- **Progress Reporting**: Shows detailed progress during backup process

### Backup Contents

Each backup includes:
- **Schema**: Complete table structures, indexes, and constraints
- **Data**: All rows from all tables (363+ rows in current database)
- **Metadata**: Database statistics and version information
- **Instructions**: Detailed restore procedures

### Backup Location

Backups are stored in:
```
backups/backup-YYYY-MM-DDTHH-MM-SS-SSSZ/
├── manual_backup.sql      # Complete database backup (130+ KB)
└── RESTORE_INSTRUCTIONS.md # Restoration guide
```

### Restoring from Backup

1. **Locate your backup** in the `backups/` directory
2. **Follow the restore instructions** in `RESTORE_INSTRUCTIONS.md`
3. **Basic restore command**:
   ```bash
   psql -h HOST -p PORT -U USERNAME -d DATABASE < manual_backup.sql
   ```

### Backup Best Practices

- **Regular Backups**: Run `pnpm db:backup` before major changes
- **Before Migrations**: Always backup before schema migrations
- **Production**: Set up automated backups using your hosting provider
- **Testing**: Verify backups by restoring to a test database
- **Storage**: Keep multiple backup versions for different time periods

### Automated Backup Integration

For production environments, consider integrating with:
- **Neon**: Built-in automated backups
- **Vercel**: Scheduled functions for regular backups
- **GitHub Actions**: Automated backup workflows
- **Cron Jobs**: Server-based scheduled backups
