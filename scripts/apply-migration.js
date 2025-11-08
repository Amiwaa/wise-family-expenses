const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const ddlPool = new Pool({
  connectionString: process.env.DATABASE_URL_DDL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

async function applyMigration(migrationFile) {
  try {
    console.log(`📄 Reading migration file: ${migrationFile}`)
    const sql = fs.readFileSync(migrationFile, 'utf8')
    
    console.log(`🚀 Applying migration...`)
    await ddlPool.query(sql)
    
    console.log(`✅ Migration applied successfully!`)
    return true
  } catch (error) {
    console.error(`❌ Error applying migration:`, error.message)
    throw error
  }
}

async function runMigrations() {
  const migrationsDir = path.join(__dirname, 'migrations')
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort()
  
  if (migrationFiles.length === 0) {
    console.log('❌ No migration files found!')
    return
  }
  
  console.log(`📦 Found ${migrationFiles.length} migration(s) to apply\n`)
  
  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file)
    console.log(`\n${'='.repeat(80)}`)
    console.log(`Applying: ${file}`)
    console.log('='.repeat(80))
    await applyMigration(filePath)
  }
  
  console.log(`\n${'='.repeat(80)}`)
  console.log('✅ All migrations applied successfully!')
  console.log('='.repeat(80))
}

// Run if called directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      ddlPool.end()
      process.exit(0)
    })
    .catch(error => {
      console.error(error)
      ddlPool.end()
      process.exit(1)
    })
}

module.exports = { applyMigration, runMigrations }

