const { Pool } = require('pg')
require('dotenv').config({ path: '.env.local' })

const ddlPool = new Pool({
  connectionString: process.env.DATABASE_URL_DDL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

async function queryDDL(text, params) {
  try {
    const res = await ddlPool.query(text, params)
    console.log('✓ Executed:', text.substring(0, 50) + '...')
    return res
  } catch (error) {
    console.error('✗ Error:', error.message)
    throw error
  }
}

async function initDatabase() {
  try {
    console.log('🚀 Initializing database...\n')
    
    // Create families table
    await queryDDL(`
      CREATE TABLE IF NOT EXISTS families (
        id SERIAL PRIMARY KEY,
        family_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create family_members table
    await queryDDL(`
      CREATE TABLE IF NOT EXISTS family_members (
        id SERIAL PRIMARY KEY,
        family_id INTEGER NOT NULL REFERENCES families(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(family_id, email)
      )
    `)

    // Create expenses table
    await queryDDL(`
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        family_id INTEGER NOT NULL REFERENCES families(id) ON DELETE CASCADE,
        amount DECIMAL(10, 2) NOT NULL,
        description TEXT,
        category VARCHAR(255),
        added_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create savings table
    await queryDDL(`
      CREATE TABLE IF NOT EXISTS savings (
        id SERIAL PRIMARY KEY,
        family_id INTEGER NOT NULL REFERENCES families(id) ON DELETE CASCADE,
        amount DECIMAL(10, 2) NOT NULL,
        description TEXT,
        goal DECIMAL(10, 2),
        added_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create currents table
    await queryDDL(`
      CREATE TABLE IF NOT EXISTS currents (
        id SERIAL PRIMARY KEY,
        family_id INTEGER NOT NULL REFERENCES families(id) ON DELETE CASCADE,
        amount DECIMAL(10, 2) NOT NULL,
        description TEXT,
        type VARCHAR(10) NOT NULL CHECK (type IN ('credit', 'debit')),
        added_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create custom_sections table
    await queryDDL(`
      CREATE TABLE IF NOT EXISTS custom_sections (
        id SERIAL PRIMARY KEY,
        family_id INTEGER NOT NULL REFERENCES families(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(10) NOT NULL CHECK (type IN ('expense', 'saving')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create custom_section_transactions table
    await queryDDL(`
      CREATE TABLE IF NOT EXISTS custom_section_transactions (
        id SERIAL PRIMARY KEY,
        section_id INTEGER NOT NULL REFERENCES custom_sections(id) ON DELETE CASCADE,
        amount DECIMAL(10, 2) NOT NULL,
        description TEXT,
        added_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create categories table
    await queryDDL(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        family_id INTEGER NOT NULL REFERENCES families(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        UNIQUE(family_id, name)
      )
    `)

    // Create indexes for better performance
    await queryDDL(`CREATE INDEX IF NOT EXISTS idx_family_members_family_id ON family_members(family_id)`)
    await queryDDL(`CREATE INDEX IF NOT EXISTS idx_expenses_family_id ON expenses(family_id)`)
    await queryDDL(`CREATE INDEX IF NOT EXISTS idx_savings_family_id ON savings(family_id)`)
    await queryDDL(`CREATE INDEX IF NOT EXISTS idx_currents_family_id ON currents(family_id)`)
    await queryDDL(`CREATE INDEX IF NOT EXISTS idx_custom_sections_family_id ON custom_sections(family_id)`)

    console.log('\n✅ Database initialized successfully!')
    console.log('📊 Run "npm run db:check" to verify the schema.')
  } catch (error) {
    console.error('\n❌ Error initializing database:', error.message)
    throw error
  } finally {
    await ddlPool.end()
  }
}

// Run if called directly
if (require.main === module) {
  initDatabase()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error)
      process.exit(1)
    })
}

module.exports = { initDatabase }

