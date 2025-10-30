import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config({ path: '.env.local' });

interface TableInfo {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string;
  ordinal_position: number;
}

interface ConstraintInfo {
  constraint_name: string;
  table_name: string;
  column_name: string;
  constraint_type: string;
  foreign_table_name?: string;
  foreign_column_name?: string;
  check_clause?: string;
}

interface IndexInfo {
  indexname: string;
  tablename: string;
  indexdef: string;
}

interface EnumInfo {
  typname: string;
  enumlabel: string;
}

async function connectToDatabase(): Promise<Client> {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set in environment variables');
  }

  console.log('Connecting to database...');
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  console.log('Successfully connected to database');
  
  return client;
}

async function getEnums(client: Client): Promise<Map<string, string[]>> {
  const query = `
    SELECT t.typname, e.enumlabel
    FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid  
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
    ORDER BY t.typname, e.enumsortorder;
  `;
  
  const result = await client.query<EnumInfo>(query);
  const enums = new Map<string, string[]>();
  
  result.rows.forEach(row => {
    if (!enums.has(row.typname)) {
      enums.set(row.typname, []);
    }
    enums.get(row.typname)!.push(row.enumlabel);
  });
  
  return enums;
}

async function getTableStructure(client: Client): Promise<Map<string, TableInfo[]>> {
  const query = `
    SELECT 
      table_name,
      column_name,
      data_type,
      is_nullable,
      column_default,
      ordinal_position
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    ORDER BY table_name, ordinal_position;
  `;
  
  const result = await client.query<TableInfo>(query);
  const tables = new Map<string, TableInfo[]>();
  
  result.rows.forEach(row => {
    if (!tables.has(row.table_name)) {
      tables.set(row.table_name, []);
    }
    tables.get(row.table_name)!.push(row);
  });
  
  return tables;
}

async function getConstraints(client: Client): Promise<Map<string, ConstraintInfo[]>> {
  const query = `
    SELECT 
      tc.constraint_name,
      tc.table_name,
      kcu.column_name,
      tc.constraint_type,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      cc.check_clause
    FROM information_schema.table_constraints AS tc 
    LEFT JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    LEFT JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    LEFT JOIN information_schema.check_constraints AS cc
      ON cc.constraint_name = tc.constraint_name
      AND cc.constraint_schema = tc.table_schema
    WHERE tc.table_schema = 'public'
    ORDER BY tc.table_name, tc.constraint_name;
  `;
  
  const result = await client.query<ConstraintInfo>(query);
  const constraints = new Map<string, ConstraintInfo[]>();
  
  result.rows.forEach(row => {
    if (!constraints.has(row.table_name)) {
      constraints.set(row.table_name, []);
    }
    constraints.get(row.table_name)!.push(row);
  });
  
  return constraints;
}

async function getIndexes(client: Client): Promise<IndexInfo[]> {
  const query = `
    SELECT indexname, tablename, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND indexname NOT LIKE '%_pkey'
    ORDER BY tablename, indexname;
  `;
  
  const result = await client.query<IndexInfo>(query);
  return result.rows;
}

function generateEnumSQL(enums: Map<string, string[]>): string {
  let sql = '-- =============================================\n';
  sql += '-- ENUMS\n';
  sql += '-- =============================================\n\n';
  
  for (const [enumName, values] of enums) {
    const enumValues = values.map(v => `'${v}'`).join(', ');
    sql += `CREATE TYPE ${enumName} AS ENUM (${enumValues});\n\n`;
  }
  
  return sql;
}

function mapDataType(dataType: string, columnDefault: string | null): string {
  // Handle UUID types with defaults
  if (dataType === 'uuid' && columnDefault?.includes('gen_random_uuid()')) {
    return 'UUID DEFAULT gen_random_uuid()';
  }
  
  // Handle arrays
  if (dataType === 'ARRAY') {
    return 'TEXT[]';
  }
  
  // Handle JSONB
  if (dataType === 'jsonb') {
    return 'JSONB';
  }
  
  // Handle timestamps with defaults
  if (dataType === 'timestamp without time zone') {
    if (columnDefault?.includes('now()')) {
      return 'TIMESTAMP DEFAULT NOW()';
    }
    return 'TIMESTAMP';
  }
  
  // Handle other common types
  const typeMap: { [key: string]: string } = {
    'character varying': 'VARCHAR',
    'text': 'TEXT',
    'integer': 'INTEGER',
    'boolean': 'BOOLEAN',
    'numeric': 'DECIMAL',
    'date': 'DATE',
    'uuid': 'UUID'
  };
  
  return typeMap[dataType] || dataType.toUpperCase();
}

function generateTableSQL(
  tableName: string, 
  columns: TableInfo[], 
  constraints: ConstraintInfo[]
): string {
  let sql = `CREATE TABLE ${tableName} (\n`;
  
  // Add columns
  const columnDefs: string[] = [];
  
  columns.forEach(col => {
    let columnSql = `  ${col.column_name} `;
    
    // Handle special data types and constraints
    let dataType = mapDataType(col.data_type, col.column_default);
    
    // Handle VARCHAR with length
    if (col.data_type === 'character varying' && col.column_default) {
      const match = col.column_default.match(/character varying\((\d+)\)/);
      if (match) {
        dataType = `VARCHAR(${match[1]})`;
      } else {
        // Extract length from column definition if available
        dataType = 'VARCHAR(255)'; // Default length
      }
    }
    
    // Handle DECIMAL with precision
    if (col.data_type === 'numeric' && col.column_default) {
      const match = col.column_default.match(/numeric\((\d+),(\d+)\)/);
      if (match) {
        dataType = `DECIMAL(${match[1]},${match[2]})`;
      }
    }
    
    columnSql += dataType;
    
    // Handle NOT NULL
    if (col.is_nullable === 'NO') {
      columnSql += ' NOT NULL';
    }
    
    // Handle defaults (excluding auto-generated ones)
    if (col.column_default && 
        !col.column_default.includes('gen_random_uuid()') && 
        !col.column_default.includes('now()')) {
      let defaultValue = col.column_default;
      
      // Clean up default values
      if (defaultValue.startsWith("'") && defaultValue.endsWith("'::character varying")) {
        defaultValue = defaultValue.replace("::character varying", "");
      }
      if (defaultValue.includes('::')) {
        defaultValue = defaultValue.split('::')[0];
      }
      
      columnSql += ` DEFAULT ${defaultValue}`;
    }
    
    columnDefs.push(columnSql);
  });
  
  sql += columnDefs.join(',\n');
  
  // Add constraints
  const primaryKeys = constraints.filter(c => c.constraint_type === 'PRIMARY KEY');
  const foreignKeys = constraints.filter(c => c.constraint_type === 'FOREIGN KEY');
  const uniqueKeys = constraints.filter(c => c.constraint_type === 'UNIQUE');
  const checkConstraints = constraints.filter(c => c.constraint_type === 'CHECK');
  
  if (primaryKeys.length > 0) {
    const pkColumns = primaryKeys.map(pk => pk.column_name).join(', ');
    sql += `,\n  PRIMARY KEY (${pkColumns})`;
  }
  
  uniqueKeys.forEach(uk => {
    sql += `,\n  UNIQUE (${uk.column_name})`;
  });
  
  foreignKeys.forEach(fk => {
    if (fk.foreign_table_name && fk.foreign_column_name) {
      sql += `,\n  FOREIGN KEY (${fk.column_name}) REFERENCES ${fk.foreign_table_name}(${fk.foreign_column_name}) ON DELETE CASCADE`;
    }
  });
  
  checkConstraints.forEach(cc => {
    if (cc.check_clause) {
      sql += `,\n  CHECK ${cc.check_clause}`;
    }
  });
  
  sql += '\n);\n\n';
  
  return sql;
}

function generateIndexSQL(indexes: IndexInfo[]): string {
  if (indexes.length === 0) return '';
  
  let sql = '-- =============================================\n';
  sql += '-- INDEXES\n';
  sql += '-- =============================================\n\n';
  
  indexes.forEach(index => {
    sql += `${index.indexdef};\n`;
  });
  
  sql += '\n';
  return sql;
}

async function generateAdminUserSQL(): Promise<string> {
  const hashedPassword = await bcrypt.hash('admin', 10);
  
  let sql = '-- =============================================\n';
  sql += '-- INITIAL ADMIN USER\n';
  sql += '-- =============================================\n\n';
  
  sql += `-- Create admin user (username: admin, password: admin)\n`;
  sql += `INSERT INTO users (id, username, display_name, password, role, created_at, updated_at) VALUES (\n`;
  sql += `  gen_random_uuid(),\n`;
  sql += `  'admin',\n`;
  sql += `  'Administrator',\n`;
  sql += `  '${hashedPassword}',\n`;
  sql += `  'admin',\n`;
  sql += `  NOW(),\n`;
  sql += `  NOW()\n`;
  sql += `);\n\n`;
  
  sql += `-- Create default user settings for admin\n`;
  sql += `INSERT INTO user_settings (id, user_id, dietary_restrictions, preferred_meal_times, enabled_meal_categories, weekly_meal_goal, serving_size, budget_range, shopping_day, theme, notifications_enabled, created_at, updated_at)\n`;
  sql += `SELECT \n`;
  sql += `  gen_random_uuid(),\n`;
  sql += `  u.id,\n`;
  sql += `  NULL,\n`;
  sql += `  NULL,\n`;
  sql += `  '["breakfast","lunch","dinner","snack"]',\n`;
  sql += `  21,\n`;
  sql += `  2,\n`;
  sql += `  NULL,\n`;
  sql += `  'sunday',\n`;
  sql += `  'light',\n`;
  sql += `  true,\n`;
  sql += `  NOW(),\n`;
  sql += `  NOW()\n`;
  sql += `FROM users u WHERE u.username = 'admin';\n\n`;
  
  sql += `-- Create default meal categories\n`;
  sql += `INSERT INTO categories (id, name, description, color, created_at) VALUES\n`;
  sql += `  (gen_random_uuid(), 'Breakfast', 'Morning meals', '#FF6B6B', NOW()),\n`;
  sql += `  (gen_random_uuid(), 'Lunch', 'Midday meals', '#4ECDC4', NOW()),\n`;
  sql += `  (gen_random_uuid(), 'Dinner', 'Evening meals', '#45B7D1', NOW()),\n`;
  sql += `  (gen_random_uuid(), 'Snack', 'Light snacks and treats', '#96CEB4', NOW()),\n`;
  sql += `  (gen_random_uuid(), 'Dessert', 'Sweet treats and desserts', '#FECA57', NOW());\n\n`;
  
  sql += `-- Create some default tags\n`;
  sql += `INSERT INTO tags (id, name, color, created_at) VALUES\n`;
  sql += `  (gen_random_uuid(), 'Quick', '#FF6B6B', NOW()),\n`;
  sql += `  (gen_random_uuid(), 'Healthy', '#4ECDC4', NOW()),\n`;
  sql += `  (gen_random_uuid(), 'Vegetarian', '#45B7D1', NOW()),\n`;
  sql += `  (gen_random_uuid(), 'Low Carb', '#96CEB4', NOW()),\n`;
  sql += `  (gen_random_uuid(), 'High Protein', '#FECA57', NOW()),\n`;
  sql += `  (gen_random_uuid(), 'Comfort Food', '#F38BA8', NOW());\n\n`;
  
  return sql;
}

async function exportDatabaseSchema(): Promise<void> {
  let client: Client | null = null;
  
  try {
    client = await connectToDatabase();
    
    console.log('Extracting database schema...');
    
    // Get all schema components
    const enums = await getEnums(client);
    const tables = await getTableStructure(client);
    const constraints = await getConstraints(client);
    const indexes = await getIndexes(client);
    
    console.log(`Found ${enums.size} enums, ${tables.size} tables, and ${indexes.length} indexes`);
    
    // Generate SQL
    let sql = '';
    
    // Header
    sql += '-- =============================================\n';
    sql += '-- WEEKLY MEALS PLANNER - DATABASE SCHEMA\n';
    sql += '-- =============================================\n';
    sql += `-- Generated on: ${new Date().toISOString()}\n`;
    sql += `-- Source: ${process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'PostgreSQL Database'}\n`;
    sql += '-- =============================================\n\n';
    
    // Enable UUID extension
    sql += '-- Enable UUID extension\n';
    sql += 'CREATE EXTENSION IF NOT EXISTS "pgcrypto";\n\n';
    
    // Add enums
    sql += generateEnumSQL(enums);
    
    // Add tables
    sql += '-- =============================================\n';
    sql += '-- TABLES\n';
    sql += '-- =============================================\n\n';
    
    // Define table order to handle dependencies
    const tableOrder = [
      'users',
      'user_settings', 
      'categories',
      'tags',
      'meals',
      'meal_tags',
      'ingredients',
      'meal_ingredients',
      'weekly_meal_plans',
      'planned_meals',
      'daily_planned_meals',
      'daily_remarks',
      'shopping_lists',
      'shopping_list_items',
      'nutritional_goals',
      'global_settings',
      'weekly_day_settings'
    ];
    
    // Generate tables in order
    for (const tableName of tableOrder) {
      if (tables.has(tableName)) {
        const tableColumns = tables.get(tableName)!;
        const tableConstraints = constraints.get(tableName) || [];
        sql += generateTableSQL(tableName, tableColumns, tableConstraints);
      }
    }
    
    // Add any remaining tables not in the order
    for (const [tableName, tableColumns] of tables) {
      if (!tableOrder.includes(tableName)) {
        const tableConstraints = constraints.get(tableName) || [];
        sql += generateTableSQL(tableName, tableColumns, tableConstraints);
      }
    }
    
    // Add indexes
    sql += generateIndexSQL(indexes);
    
    // Add admin user and initial data
    sql += await generateAdminUserSQL();
    
    // Write to file
    const outputPath = path.join(process.cwd(), 'database-schema-setup.sql');
    fs.writeFileSync(outputPath, sql, 'utf8');
    
    console.log(`\n✅ Database schema exported successfully!`);
    console.log(`📁 Output file: ${outputPath}`);
    console.log(`📊 Schema includes:`);
    console.log(`   - ${enums.size} custom enums`);
    console.log(`   - ${tables.size} tables with full structure`);
    console.log(`   - ${indexes.length} indexes`);
    console.log(`   - Initial admin user (username: admin, password: admin)`);
    console.log(`   - Default categories and tags`);
    console.log(`\n🔧 To use this schema:`);
    console.log(`   1. Create a new PostgreSQL database`);
    console.log(`   2. Run: psql -d your_database -f database-schema-setup.sql`);
    console.log(`   3. The admin user will be created automatically`);
    
  } catch (error) {
    console.error('❌ Error exporting database schema:', error);
    throw error;
  } finally {
    if (client) {
      await client.end();
      console.log('Database connection closed');
    }
  }
}

// Run the export
if (require.main === module) {
  exportDatabaseSchema()
    .then(() => {
      console.log('Export completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Export failed:', error);
      process.exit(1);
    });
}

export { exportDatabaseSchema };