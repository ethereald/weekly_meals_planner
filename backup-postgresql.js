// PostgreSQL Backup Script - Full Schema and Data Backup
// This script creates a comprehensive backup of the PostgreSQL database before migration

const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const execAsync = promisify(exec);
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

// Parse the DATABASE_URL to extract connection details
function parsePostgreSQLUrl(url) {
  const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):?(\d+)?\/(.+)(\?.+)?/);
  if (!match) {
    throw new Error('Invalid PostgreSQL URL format');
  }

  const [, username, password, host, port, database, params] = match;
  
  return {
    username,
    password,
    host,
    port: port || '5432',
    database,
    params: params || ''
  };
}

// Initialize PostgreSQL connection for queries
const client = postgres(DATABASE_URL, {
  prepare: false,
  max: 10,
});

const db = drizzle(client);

async function createBackupDirectory() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backups', `backup-${timestamp}`);
  
  // Create backup directory
  if (!fs.existsSync(path.join(process.cwd(), 'backups'))) {
    fs.mkdirSync(path.join(process.cwd(), 'backups'));
  }
  
  fs.mkdirSync(backupDir, { recursive: true });
  
  return { backupDir, timestamp };
}

async function backupSchemaAndData() {
  console.log('🗃️ Creating full PostgreSQL backup (schema + data)...');
  
  try {
    const { backupDir, timestamp } = await createBackupDirectory();
    const connectionInfo = parsePostgreSQLUrl(DATABASE_URL);
    
    console.log(`📁 Backup directory: ${backupDir}`);
    
    // Set PGPASSWORD environment variable for pg_dump
    const env = { 
      ...process.env, 
      PGPASSWORD: connectionInfo.password 
    };
    
    // Full backup with schema and data
    const fullBackupFile = path.join(backupDir, 'full_backup.sql');
    const pgDumpCommand = `pg_dump -h ${connectionInfo.host} -p ${connectionInfo.port} -U ${connectionInfo.username} -d ${connectionInfo.database} --no-password --verbose --clean --create --if-exists > "${fullBackupFile}"`;
    
    console.log('🔄 Running pg_dump for full backup...');
    console.log('Command:', pgDumpCommand.replace(connectionInfo.password, '***'));
    
    await execAsync(pgDumpCommand, { env });
    
    // Schema-only backup
    const schemaBackupFile = path.join(backupDir, 'schema_only.sql');
    const schemaDumpCommand = `pg_dump -h ${connectionInfo.host} -p ${connectionInfo.port} -U ${connectionInfo.username} -d ${connectionInfo.database} --no-password --schema-only --verbose --clean --create --if-exists > "${schemaBackupFile}"`;
    
    console.log('🔄 Running pg_dump for schema-only backup...');
    await execAsync(schemaDumpCommand, { env });
    
    // Data-only backup
    const dataBackupFile = path.join(backupDir, 'data_only.sql');
    const dataDumpCommand = `pg_dump -h ${connectionInfo.host} -p ${connectionInfo.port} -U ${connectionInfo.username} -d ${connectionInfo.database} --no-password --data-only --verbose --disable-triggers > "${dataBackupFile}"`;
    
    console.log('🔄 Running pg_dump for data-only backup...');
    await execAsync(dataDumpCommand, { env });
    
    return { backupDir, timestamp, fullBackupFile, schemaBackupFile, dataBackupFile };
    
  } catch (error) {
    console.error('❌ pg_dump backup failed:', error);
    console.log('💡 Falling back to manual backup method...');
    return await manualBackup();
  }
}

async function manualBackup() {
  console.log('🔄 Creating manual backup using SQL queries...');
  
  const { backupDir, timestamp } = await createBackupDirectory();
  
  // Get all table names
  const tables = await client`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `;
  
  console.log(`📋 Found ${tables.length} tables to backup:`, tables.map(t => t.table_name));
  
  let fullBackupContent = `-- PostgreSQL Manual Backup
-- Generated on: ${new Date().toISOString()}
-- Database: ${parsePostgreSQLUrl(DATABASE_URL).database}
-- Total tables: ${tables.length}

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

`;

  // Backup each table's structure and data
  for (const table of tables) {
    const tableName = table.table_name;
    console.log(`📊 Backing up table: ${tableName}`);
    
    try {
      // Get table structure
      const createTableQuery = await client`
        SELECT 'CREATE TABLE ' || schemaname || '.' || tablename || ' (' ||
               array_to_string(
                 array_agg(
                   column_name || ' ' || data_type ||
                   CASE 
                     WHEN character_maximum_length IS NOT NULL 
                     THEN '(' || character_maximum_length || ')' 
                     ELSE '' 
                   END ||
                   CASE 
                     WHEN is_nullable = 'NO' 
                     THEN ' NOT NULL' 
                     ELSE '' 
                   END
                 ), ', '
               ) || ');' as create_statement
        FROM information_schema.columns c
        JOIN pg_tables t ON c.table_name = t.tablename
        WHERE c.table_name = ${tableName}
        AND c.table_schema = 'public'
        GROUP BY schemaname, tablename
      `;
      
      // Get row count
      const countResult = await client`SELECT COUNT(*) as count FROM ${client(tableName)}`;
      const rowCount = countResult[0].count;
      
      fullBackupContent += `\n-- Table: ${tableName} (${rowCount} rows)\n`;
      
      if (createTableQuery.length > 0) {
        fullBackupContent += createTableQuery[0].create_statement + '\n';
      }
      
      // Get data if table has rows
      if (parseInt(rowCount) > 0) {
        console.log(`  📄 Exporting ${rowCount} rows from ${tableName}`);
        
        // Get all data from table
        const tableData = await client`SELECT * FROM ${client(tableName)}`;
        
        if (tableData.length > 0) {
          // Get column names
          const columns = Object.keys(tableData[0]);
          
          fullBackupContent += `\n-- Data for table: ${tableName}\n`;
          
          for (const row of tableData) {
            const values = columns.map(col => {
              const value = row[col];
              if (value === null) return 'NULL';
              if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
              if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
              if (value instanceof Date) return `'${value.toISOString()}'`;
              return value;
            });
            
            fullBackupContent += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
          }
        }
      } else {
        console.log(`  ⚠️ Table ${tableName} is empty`);
      }
      
    } catch (error) {
      console.error(`❌ Failed to backup table ${tableName}:`, error.message);
      fullBackupContent += `-- ERROR: Failed to backup table ${tableName}: ${error.message}\n`;
    }
  }
  
  // Save manual backup
  const manualBackupFile = path.join(backupDir, 'manual_backup.sql');
  fs.writeFileSync(manualBackupFile, fullBackupContent);
  
  return { 
    backupDir, 
    timestamp, 
    manualBackupFile,
    tableCount: tables.length 
  };
}

async function backupMetadata() {
  console.log('📋 Creating metadata backup...');
  
  try {
    const { backupDir } = await createBackupDirectory();
    
    // Get database metadata
    const metadata = {
      timestamp: new Date().toISOString(),
      databaseUrl: DATABASE_URL.replace(/:([^:@]+)@/, ':***@'), // Hide password
      nodeEnv: process.env.NODE_ENV,
      backupType: 'pre-migration',
      migrationPurpose: 'day-level category control for weekly settings'
    };
    
    // Get table statistics
    const tableStats = await client`
      SELECT 
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_live_tup as live_rows,
        n_dead_tup as dead_rows,
        last_vacuum,
        last_autovacuum,
        last_analyze,
        last_autoanalyze
      FROM pg_stat_user_tables
      ORDER BY tablename
    `;
    
    // Get database size
    const dbSize = await client`
      SELECT pg_size_pretty(pg_database_size(current_database())) as database_size
    `;
    
    // Get current schema version info
    const schemaInfo = await client`
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `;
    
    const fullMetadata = {
      ...metadata,
      databaseSize: dbSize[0]?.database_size,
      tableStats: tableStats,
      schemaInfo: schemaInfo,
      totalTables: schemaInfo.length > 0 ? [...new Set(schemaInfo.map(s => s.table_name))].length : 0
    };
    
    // Save metadata
    const metadataFile = path.join(backupDir, 'backup_metadata.json');
    fs.writeFileSync(metadataFile, JSON.stringify(fullMetadata, null, 2));
    
    return { metadataFile, metadata: fullMetadata };
    
  } catch (error) {
    console.error('❌ Failed to create metadata backup:', error);
    return null;
  }
}

async function createRestoreInstructions(backupInfo) {
  const { backupDir } = backupInfo;
  
  const instructions = `# PostgreSQL Backup Restore Instructions

## Backup Information
- Created: ${new Date().toISOString()}
- Purpose: Pre-migration backup for day-level category control
- Location: ${backupDir}

## Files in this backup:
${fs.readdirSync(backupDir).map(file => `- ${file}`).join('\n')}

## How to restore:

### Option 1: Full restore using pg_dump backup (if available)
\`\`\`bash
# Stop the application first
# Then restore the database:
psql -h HOST -p PORT -U USERNAME -d postgres -c "DROP DATABASE IF EXISTS DBNAME;"
psql -h HOST -p PORT -U USERNAME -d postgres -c "CREATE DATABASE DBNAME;"
psql -h HOST -p PORT -U USERNAME -d DBNAME < full_backup.sql
\`\`\`

### Option 2: Manual restore using SQL backup
\`\`\`bash
# Connect to your database and run:
psql -h HOST -p PORT -U USERNAME -d DBNAME < manual_backup.sql
\`\`\`

### Option 3: Schema only + Data only restore
\`\`\`bash
# Restore schema first:
psql -h HOST -p PORT -U USERNAME -d DBNAME < schema_only.sql
# Then restore data:
psql -h HOST -p PORT -U USERNAME -d DBNAME < data_only.sql
\`\`\`

## Connection Information:
Use your DATABASE_URL environment variable or extract connection details from .env.local

## Verification:
After restore, verify the data by checking:
1. Table counts match the metadata
2. Key application functionality works
3. No data corruption or missing records

## Emergency Contact:
Keep this backup safe until the migration is confirmed successful!
`;

  const instructionsFile = path.join(backupDir, 'RESTORE_INSTRUCTIONS.md');
  fs.writeFileSync(instructionsFile, instructions);
  
  return instructionsFile;
}

async function runFullBackup() {
  console.log('🚀 Starting comprehensive PostgreSQL backup...');
  console.log('🎯 Purpose: Pre-migration backup for day-level category control\n');
  
  try {
    // Step 1: Create metadata backup
    console.log('Step 1: Creating metadata backup...');
    const metadataInfo = await backupMetadata();
    
    if (metadataInfo) {
      console.log('✅ Metadata backup created');
      console.log(`   📊 Database size: ${metadataInfo.metadata.databaseSize}`);
      console.log(`   📋 Total tables: ${metadataInfo.metadata.totalTables}`);
    }
    
    // Step 2: Create schema and data backup
    console.log('\nStep 2: Creating schema and data backup...');
    const backupInfo = await backupSchemaAndData();
    
    // Step 3: Create restore instructions
    console.log('\nStep 3: Creating restore instructions...');
    const instructionsFile = await createRestoreInstructions(backupInfo);
    
    // Step 4: Verify backup files
    console.log('\nStep 4: Verifying backup files...');
    const backupFiles = fs.readdirSync(backupInfo.backupDir);
    console.log('✅ Backup files created:');
    
    for (const file of backupFiles) {
      const filePath = path.join(backupInfo.backupDir, file);
      const stats = fs.statSync(filePath);
      const sizeKB = Math.round(stats.size / 1024);
      console.log(`   📄 ${file} (${sizeKB} KB)`);
    }
    
    console.log(`\n✅ Full backup completed successfully!`);
    console.log(`📁 Backup location: ${backupInfo.backupDir}`);
    console.log(`📋 Restore instructions: ${path.basename(instructionsFile)}`);
    console.log(`\n🔒 Your data is now safely backed up before migration.`);
    console.log(`💡 Keep this backup until the migration is confirmed successful.`);
    
    return backupInfo;
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run backup if called directly
if (require.main === module) {
  runFullBackup()
    .then((backupInfo) => {
      console.log('\n🎉 Backup process completed successfully!');
      console.log(`📁 Files are ready at: ${backupInfo.backupDir}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Backup process failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runFullBackup,
  backupSchemaAndData,
  backupMetadata,
  createRestoreInstructions
};