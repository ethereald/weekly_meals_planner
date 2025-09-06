# Database Setup

This project uses **SQLite for local development** and **PostgreSQL for production** with Drizzle ORM for type-safe database operations.

## How It Works

The database automatically switches based on your environment:

- **Local Development** (`NODE_ENV !== "production"`): Uses SQLite (`local.db` file)
- **Production** (`NODE_ENV === "production"` + `DATABASE_URL` set): Uses PostgreSQL
- **Build Time**: Uses mock database (no actual database needed)

## Prerequisites

### For Local Development (SQLite)
- No additional setup required! SQLite runs from a file (`local.db`)

### For Production (PostgreSQL)
- PostgreSQL database instance (local, Docker, or cloud service like Supabase, Neon, Railway)

## Environment Setup

1. Copy the environment template:
   ```bash
   cp .env.example .env.local
   ```

2. **For Local Development (SQLite)**:
   - Keep `NODE_ENV="development"` in `.env.local`
   - No `DATABASE_URL` needed - SQLite will use `local.db` file

3. **For Production (PostgreSQL)**:
   - Set `NODE_ENV="production"`
   - Set `DATABASE_URL="postgresql://username:password@localhost:5432/weekly_meals_planner"`

## How to Switch Between Databases

### Method 1: Environment Variables

**Use SQLite (Local Development)**:
```bash
# In .env.local
NODE_ENV="development"
# DATABASE_URL is not needed
```

**Use PostgreSQL (Production)**:
```bash
# In .env.local or production environment
NODE_ENV="production"
DATABASE_URL="postgresql://username:password@localhost:5432/weekly_meals_planner"
```

### Method 2: Different Environment Files

Create separate environment files:

**`.env.local` (SQLite)**:
```bash
NODE_ENV="development"
```

**`.env.production` (PostgreSQL)**:
```bash
NODE_ENV="production"
DATABASE_URL="postgresql://username:password@localhost:5432/weekly_meals_planner"
```

## Database Commands

### For SQLite (Local Development)
```bash
# Push schema to SQLite
NODE_ENV=development pnpm db:push

# Seed SQLite database
NODE_ENV=development pnpm db:seed

# Open database studio for SQLite
NODE_ENV=development pnpm db:studio
```

### For PostgreSQL (Production)
```bash
# Push schema to PostgreSQL
NODE_ENV=production DATABASE_URL="your-postgres-url" pnpm db:push

# Seed PostgreSQL database
NODE_ENV=production DATABASE_URL="your-postgres-url" pnpm db:seed

# Open database studio for PostgreSQL
NODE_ENV=production DATABASE_URL="your-postgres-url" pnpm db:studio
```

## Quick Setup Guide

### Local Development with SQLite

1. **Start development** (no setup needed):
   ```bash
   pnpm dev
   ```

2. **Initialize database**:
   ```bash
   pnpm db:push
   pnpm db:seed
   ```

3. **Check health**:
   Visit http://localhost:3000/api/health

### Production with PostgreSQL

1. **Set up PostgreSQL database** (choose one):
   - Local PostgreSQL
   - Docker: `docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres`
   - Cloud services: Supabase, Neon, Railway, etc.

2. **Configure environment**:
   ```bash
   # Set in your production environment
   NODE_ENV=production
   DATABASE_URL=postgresql://username:password@localhost:5432/weekly_meals_planner
   ```

3. **Deploy and initialize**:
   ```bash
   # On your production server
   pnpm db:push
   pnpm db:seed
   ```

## Database Schema

The database includes the following main tables:

### Core Tables
- **users**: User authentication and profile information
- **user_settings**: User preferences and settings
- **categories**: Meal categories (breakfast, lunch, dinner, etc.)

### Meal Management
- **meals**: Recipe storage with nutritional information
- **ingredients**: Ingredient database with nutritional data
- **meal_ingredients**: Junction table linking meals to ingredients

### Planning & Shopping
- **weekly_meal_plans**: Weekly meal planning
- **planned_meals**: Individual meal assignments to days
- **shopping_lists**: Generated shopping lists
- **shopping_list_items**: Individual items on shopping lists
- **nutritional_goals**: User nutritional targets

## Database Commands

### Generate Migration Files
```bash
pnpm db:generate
```

### Apply Migrations
```bash
pnpm db:migrate
```

### Push Schema (Development)
```bash
pnpm db:push
```

### Open Database Studio
```bash
pnpm db:studio
```

### Seed Database
```bash
pnpm db:seed
```

## Quick Setup for Development

1. Set up your database URL in `.env.local`
2. Push the schema to your database:
   ```bash
   pnpm db:push
   ```
3. Seed the database with initial data:
   ```bash
   pnpm db:seed
   ```
4. (Optional) Open database studio to view your data:
   ```bash
   pnpm db:studio
   ```

## Schema Features

- **Type Safety**: Full TypeScript support with Drizzle ORM
- **Relationships**: Proper foreign key relationships between tables
- **Enums**: Type-safe enums for dietary restrictions, meal types, etc.
- **Nutritional Data**: Comprehensive nutritional information storage
- **Flexible Planning**: Support for weekly meal planning and shopping lists
- **User Preferences**: Customizable dietary restrictions and preferences

## Database Structure Overview

```
Users → User Settings
  ↓
Meals ← Categories
  ↓
Meal Ingredients ← Ingredients
  ↓
Weekly Meal Plans → Planned Meals
  ↓
Shopping Lists → Shopping List Items
```

## Notes

- All data is stored in PostgreSQL tables (no JSON storage as requested)
- UUIDs are used for all primary keys
- Timestamps are automatically managed for created/updated fields
- Proper cascade deletes are configured for data integrity
