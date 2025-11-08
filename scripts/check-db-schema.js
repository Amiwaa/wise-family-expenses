const { Pool } = require('pg')
require('dotenv').config({ path: '.env.local' })

const ddlPool = new Pool({
  connectionString: process.env.DATABASE_URL_DDL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

async function getTables() {
  const result = await ddlPool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `)
  return result.rows.map(row => row.table_name)
}

async function getColumns(tableName) {
  const result = await ddlPool.query(`
    SELECT 
      column_name,
      data_type,
      character_maximum_length,
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
    maxLength: row.character_maximum_length,
    isNullable: row.is_nullable,
    columnDefault: row.column_default,
  }))
}

async function getIndexes(tableName) {
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

async function getConstraints(tableName) {
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

async function getTableInfo(tableName) {
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

// Expected schema definition
const expectedSchema = {
  families: {
    columns: [
      { name: 'id', type: 'integer', nullable: false, primaryKey: true, serial: true },
      { name: 'family_name', type: 'character varying(255)', nullable: false },
      { name: 'created_at', type: 'timestamp', nullable: true, default: 'CURRENT_TIMESTAMP' },
    ],
    indexes: [],
  },
  family_members: {
    columns: [
      { name: 'id', type: 'integer', nullable: false, primaryKey: true, serial: true },
      { name: 'family_id', type: 'integer', nullable: false },
      { name: 'email', type: 'character varying(255)', nullable: false },
      { name: 'name', type: 'character varying(255)', nullable: false },
      { name: 'is_admin', type: 'boolean', nullable: true, default: 'false' },
      { name: 'joined_at', type: 'timestamp', nullable: true, default: 'CURRENT_TIMESTAMP' },
    ],
    indexes: ['idx_family_members_family_id'],
    uniqueConstraints: ['(family_id, email)'],
    foreignKeys: [{ column: 'family_id', references: 'families(id)', onDelete: 'CASCADE' }],
  },
  expenses: {
    columns: [
      { name: 'id', type: 'integer', nullable: false, primaryKey: true, serial: true },
      { name: 'family_id', type: 'integer', nullable: false },
      { name: 'amount', type: 'numeric(10,2)', nullable: false },
      { name: 'description', type: 'text', nullable: true },
      { name: 'category', type: 'character varying(255)', nullable: true },
      { name: 'added_by', type: 'character varying(255)', nullable: true },
      { name: 'created_at', type: 'timestamp', nullable: true, default: 'CURRENT_TIMESTAMP' },
    ],
    indexes: ['idx_expenses_family_id'],
    foreignKeys: [{ column: 'family_id', references: 'families(id)', onDelete: 'CASCADE' }],
  },
  savings: {
    columns: [
      { name: 'id', type: 'integer', nullable: false, primaryKey: true, serial: true },
      { name: 'family_id', type: 'integer', nullable: false },
      { name: 'amount', type: 'numeric(10,2)', nullable: false },
      { name: 'description', type: 'text', nullable: true },
      { name: 'goal', type: 'numeric(10,2)', nullable: true },
      { name: 'added_by', type: 'character varying(255)', nullable: true },
      { name: 'created_at', type: 'timestamp', nullable: true, default: 'CURRENT_TIMESTAMP' },
    ],
    indexes: ['idx_savings_family_id'],
    foreignKeys: [{ column: 'family_id', references: 'families(id)', onDelete: 'CASCADE' }],
  },
  currents: {
    columns: [
      { name: 'id', type: 'integer', nullable: false, primaryKey: true, serial: true },
      { name: 'family_id', type: 'integer', nullable: false },
      { name: 'amount', type: 'numeric(10,2)', nullable: false },
      { name: 'description', type: 'text', nullable: true },
      { name: 'type', type: 'character varying(10)', nullable: false },
      { name: 'added_by', type: 'character varying(255)', nullable: true },
      { name: 'created_at', type: 'timestamp', nullable: true, default: 'CURRENT_TIMESTAMP' },
    ],
    indexes: ['idx_currents_family_id'],
    foreignKeys: [{ column: 'family_id', references: 'families(id)', onDelete: 'CASCADE' }],
    checkConstraints: ["type IN ('credit', 'debit')"],
  },
  custom_sections: {
    columns: [
      { name: 'id', type: 'integer', nullable: false, primaryKey: true, serial: true },
      { name: 'family_id', type: 'integer', nullable: false },
      { name: 'name', type: 'character varying(255)', nullable: false },
      { name: 'type', type: 'character varying(10)', nullable: false },
      { name: 'created_at', type: 'timestamp', nullable: true, default: 'CURRENT_TIMESTAMP' },
    ],
    indexes: ['idx_custom_sections_family_id'],
    foreignKeys: [{ column: 'family_id', references: 'families(id)', onDelete: 'CASCADE' }],
    checkConstraints: ["type IN ('expense', 'saving')"],
  },
  custom_section_transactions: {
    columns: [
      { name: 'id', type: 'integer', nullable: false, primaryKey: true, serial: true },
      { name: 'section_id', type: 'integer', nullable: false },
      { name: 'amount', type: 'numeric(10,2)', nullable: false },
      { name: 'description', type: 'text', nullable: true },
      { name: 'added_by', type: 'character varying(255)', nullable: true },
      { name: 'created_at', type: 'timestamp', nullable: true, default: 'CURRENT_TIMESTAMP' },
    ],
    indexes: [],
    foreignKeys: [{ column: 'section_id', references: 'custom_sections(id)', onDelete: 'CASCADE' }],
  },
  categories: {
    columns: [
      { name: 'id', type: 'integer', nullable: false, primaryKey: true, serial: true },
      { name: 'family_id', type: 'integer', nullable: false },
      { name: 'name', type: 'character varying(255)', nullable: false },
    ],
    indexes: [],
    uniqueConstraints: ['(family_id, name)'],
    foreignKeys: [{ column: 'family_id', references: 'families(id)', onDelete: 'CASCADE' }],
  },
}

async function checkSchema() {
  try {
    console.log('🔍 Checking database schema...\n')
    console.log('='.repeat(80))
    
    const tables = await getTables()
    
    if (tables.length === 0) {
      console.log('❌ No tables found in the database!')
      console.log('💡 The database needs to be initialized.')
      console.log('\n📝 Run: npm run db:init')
      return { needsInit: true, tables: [], missing: Object.keys(expectedSchema) }
    }
    
    console.log(`\n✅ Found ${tables.length} table(s):\n`)
    
    const results = {}
    
    for (const tableName of tables) {
      const info = await getTableInfo(tableName)
      results[tableName] = info
      
      console.log(`\n📊 Table: ${info.tableName}`)
      console.log('-'.repeat(80))
      console.log('Columns:')
      info.columns.forEach(col => {
        const nullable = col.isNullable === 'YES' ? 'NULL' : 'NOT NULL'
        const defaultVal = col.columnDefault ? ` DEFAULT ${col.columnDefault}` : ''
        const maxLen = col.maxLength ? `(${col.maxLength})` : ''
        console.log(`  - ${col.columnName}: ${col.dataType}${maxLen} ${nullable}${defaultVal}`)
      })
      
      if (info.indexes.length > 0) {
        console.log('\nIndexes:')
        info.indexes.forEach(idx => {
          if (!idx.indexName.includes('_pkey')) {
            console.log(`  - ${idx.indexName}`)
          }
        })
      }
      
      if (info.constraints.length > 0) {
        console.log('\nConstraints:')
        info.constraints.forEach(con => {
          console.log(`  - ${con.constraintName} (${con.constraintType})`)
        })
      }
    }
    
    // Compare with expected schema
    console.log('\n\n' + '='.repeat(80))
    console.log('📋 Schema Comparison')
    console.log('='.repeat(80))
    
    const expectedTables = Object.keys(expectedSchema)
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
    
    // Check each table structure
    console.log('\n\n' + '='.repeat(80))
    console.log('🔍 Detailed Table Structure Analysis')
    console.log('='.repeat(80))
    
    const issues = []
    
    for (const tableName of expectedTables) {
      if (!tables.includes(tableName)) {
        issues.push({
          table: tableName,
          issue: 'TABLE_MISSING',
          message: `Table ${tableName} does not exist`,
        })
        continue
      }
      
      const actual = results[tableName]
      const expected = expectedSchema[tableName]
      
      // Check columns
      const expectedColumnNames = expected.columns.map(c => c.name)
      const actualColumnNames = actual.columns.map(c => c.columnName)
      
      const missingColumns = expectedColumnNames.filter(name => !actualColumnNames.includes(name))
      const extraColumns = actualColumnNames.filter(name => !expectedColumnNames.includes(name))
      
      if (missingColumns.length > 0) {
        issues.push({
          table: tableName,
          issue: 'COLUMNS_MISSING',
          message: `Missing columns: ${missingColumns.join(', ')}`,
          details: missingColumns,
        })
      }
      
      if (extraColumns.length > 0) {
        console.log(`\n⚠️  Table ${tableName} has extra columns: ${extraColumns.join(', ')}`)
      }
      
      // Check indexes
      const expectedIndexes = expected.indexes || []
      const actualIndexNames = actual.indexes
        .filter(idx => !idx.indexName.includes('_pkey'))
        .map(idx => idx.indexName.replace('idx_', '').replace(tableName + '_', ''))
      
      const missingIndexes = expectedIndexes.filter(idx => {
        const idxName = idx.replace('idx_', '').replace(tableName + '_', '')
        return !actualIndexNames.some(actual => actual.includes(idxName))
      })
      
      if (missingIndexes.length > 0) {
        issues.push({
          table: tableName,
          issue: 'INDEXES_MISSING',
          message: `Missing indexes: ${missingIndexes.join(', ')}`,
          details: missingIndexes,
        })
      }
    }
    
    if (issues.length > 0) {
      console.log('\n\n❌ Issues Found:')
      console.log('='.repeat(80))
      issues.forEach(issue => {
        console.log(`\n📌 ${issue.table}: ${issue.message}`)
        if (issue.details) {
          issue.details.forEach(detail => console.log(`   - ${detail}`))
        }
      })
    } else {
      console.log('\n✅ No issues found! Database schema matches expected structure.')
    }
    
    return {
      needsInit: false,
      tables,
      missing: missingTables,
      extra: extraTables,
      issues,
    }
    
  } catch (error) {
    console.error('❌ Error checking schema:', error.message)
    console.error(error)
    throw error
  } finally {
    await ddlPool.end()
  }
}

// Run if called directly
if (require.main === module) {
  checkSchema()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error)
      process.exit(1)
    })
}

module.exports = { checkSchema }

