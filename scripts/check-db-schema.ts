import { Pool } from 'pg'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const ddlPool = new Pool({
  connectionString: process.env.DATABASE_URL_DDL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

interface TableInfo {
  tableName: string
  columns: ColumnInfo[]
  indexes: IndexInfo[]
  constraints: ConstraintInfo[]
}

interface ColumnInfo {
  columnName: string
  dataType: string
  isNullable: string
  columnDefault: string | null
}

interface IndexInfo {
  indexName: string
  indexDef: string
}

interface ConstraintInfo {
  constraintName: string
  constraintType: string
  constraintDef: string
}

async function getTables(): Promise<string[]> {
  const result = await ddlPool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `)
  return result.rows.map(row => row.table_name)
}

async function getColumns(tableName: string): Promise<ColumnInfo[]> {
  const result = await ddlPool.query(`
    SELECT 
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = $1
    ORDER BY ordinal_position
  `, [tableName])
  
  return result.rows.map(row => ({
    columnName: row.column_name,
    dataType: row.data_type,
    isNullable: row.is_nullable,
    columnDefault: row.column_default,
  }))
}

async function getIndexes(tableName: string): Promise<IndexInfo[]> {
  const result = await ddlPool.query(`
    SELECT 
      indexname as index_name,
      indexdef
    FROM pg_indexes
    WHERE schemaname = 'public' 
    AND tablename = $1
    ORDER BY indexname
  `, [tableName])
  
  return result.rows.map(row => ({
    indexName: row.index_name,
    indexDef: row.indexdef,
  }))
}

async function getConstraints(tableName: string): Promise<ConstraintInfo[]> {
  const result = await ddlPool.query(`
    SELECT
      tc.constraint_name,
      tc.constraint_type,
      pg_get_constraintdef(c.oid) as constraint_def
    FROM information_schema.table_constraints tc
    JOIN pg_constraint c ON tc.constraint_name = c.conname
    WHERE tc.table_schema = 'public'
    AND tc.table_name = $1
    ORDER BY tc.constraint_type, tc.constraint_name
  `, [tableName])
  
  return result.rows.map(row => ({
    constraintName: row.constraint_name,
    constraintType: row.constraint_type,
    constraintDef: row.constraint_def,
  }))
}

async function getTableInfo(tableName: string): Promise<TableInfo> {
  const columns = await getColumns(tableName)
  const indexes = await getIndexes(tableName)
  const constraints = await getConstraints(tableName)
  
  return {
    tableName,
    columns,
    indexes,
    constraints,
  }
}

async function checkSchema() {
  try {
    console.log('🔍 Checking database schema...\n')
    console.log('='.repeat(80))
    
    const tables = await getTables()
    
    if (tables.length === 0) {
      console.log('❌ No tables found in the database!')
      console.log('💡 The database needs to be initialized.')
      return
    }
    
    console.log(`\n✅ Found ${tables.length} table(s):\n`)
    
    for (const tableName of tables) {
      const info = await getTableInfo(tableName)
      
      console.log(`\n📊 Table: ${info.tableName}`)
      console.log('-'.repeat(80))
      console.log('Columns:')
      info.columns.forEach(col => {
        const nullable = col.isNullable === 'YES' ? 'NULL' : 'NOT NULL'
        const defaultVal = col.columnDefault ? ` DEFAULT ${col.columnDefault}` : ''
        console.log(`  - ${col.columnName}: ${col.dataType} ${nullable}${defaultVal}`)
      })
      
      if (info.indexes.length > 0) {
        console.log('\nIndexes:')
        info.indexes.forEach(idx => {
          // Skip primary key indexes (they're shown in constraints)
          if (!idx.indexName.includes('_pkey')) {
            console.log(`  - ${idx.indexName}: ${idx.indexDef}`)
          }
        })
      }
      
      if (info.constraints.length > 0) {
        console.log('\nConstraints:')
        info.constraints.forEach(con => {
          console.log(`  - ${con.constraintName} (${con.constraintType}): ${con.constraintDef}`)
        })
      }
    }
    
    // Expected tables
    const expectedTables = [
      'families',
      'family_members',
      'expenses',
      'savings',
      'currents',
      'custom_sections',
      'custom_section_transactions',
      'categories',
    ]
    
    console.log('\n\n' + '='.repeat(80))
    console.log('📋 Schema Comparison')
    console.log('='.repeat(80))
    
    const missingTables = expectedTables.filter(t => !tables.includes(t))
    const extraTables = tables.filter(t => !expectedTables.includes(t))
    
    if (missingTables.length > 0) {
      console.log(`\n❌ Missing tables (${missingTables.length}):`)
      missingTables.forEach(t => console.log(`  - ${t}`))
    }
    
    if (extraTables.length > 0) {
      console.log(`\n⚠️  Extra tables found (${extraTables.length}):`)
      extraTables.forEach(t => console.log(`  - ${t}`))
    }
    
    if (missingTables.length === 0 && extraTables.length === 0) {
      console.log('\n✅ All expected tables are present!')
    }
    
  } catch (error: any) {
    console.error('❌ Error checking schema:', error.message)
    console.error(error)
  } finally {
    await ddlPool.end()
  }
}

checkSchema()

