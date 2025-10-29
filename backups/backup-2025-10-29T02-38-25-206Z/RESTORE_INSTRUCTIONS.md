# PostgreSQL Backup Restore Instructions

## Backup Information
- Created: 2025-10-29T02:38:31.207Z
- Purpose: Pre-migration backup for day-level category control
- Location: C:\Users\Kelvin\Desktop\AI\Projects\weekly_meals_planner\backups\backup-2025-10-29T02-38-25-206Z

## Files in this backup:
- manual_backup.sql

## How to restore:

### Option 1: Full restore using pg_dump backup (if available)
```bash
# Stop the application first
# Then restore the database:
psql -h HOST -p PORT -U USERNAME -d postgres -c "DROP DATABASE IF EXISTS DBNAME;"
psql -h HOST -p PORT -U USERNAME -d postgres -c "CREATE DATABASE DBNAME;"
psql -h HOST -p PORT -U USERNAME -d DBNAME < full_backup.sql
```

### Option 2: Manual restore using SQL backup
```bash
# Connect to your database and run:
psql -h HOST -p PORT -U USERNAME -d DBNAME < manual_backup.sql
```

### Option 3: Schema only + Data only restore
```bash
# Restore schema first:
psql -h HOST -p PORT -U USERNAME -d DBNAME < schema_only.sql
# Then restore data:
psql -h HOST -p PORT -U USERNAME -d DBNAME < data_only.sql
```

## Connection Information:
Use your DATABASE_URL environment variable or extract connection details from .env.local

## Verification:
After restore, verify the data by checking:
1. Table counts match the metadata
2. Key application functionality works
3. No data corruption or missing records

## Emergency Contact:
Keep this backup safe until the migration is confirmed successful!
