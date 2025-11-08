import { Pool } from 'pg'

// Create connection pools
// Read-write pool for regular operations (SELECT, INSERT, UPDATE, DELETE)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

// DDL pool for schema changes (CREATE, ALTER, DROP, etc.)
const ddlPool = new Pool({
  connectionString: process.env.DATABASE_URL_DDL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

// Helper function to execute queries (uses read-write pool)
export async function query(text: string, params?: any[]) {
  const start = Date.now()
  try {
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Executed query', { text: text.substring(0, 50), duration, rows: res.rowCount })
    }
    return res
  } catch (error) {
    console.error('Database query error', { text: text.substring(0, 100), error })
    throw error
  }
}

// Helper function to execute DDL queries (uses DDL pool)
export async function queryDDL(text: string, params?: any[]) {
  const start = Date.now()
  try {
    const res = await ddlPool.query(text, params)
    const duration = Date.now() - start
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Executed DDL query', { text: text.substring(0, 50), duration, rows: res.rowCount })
    }
    return res
  } catch (error) {
    console.error('Database DDL query error', { text: text.substring(0, 100), error })
    throw error
  }
}

// Check if a table exists
async function tableExists(tableName: string): Promise<boolean> {
  try {
    const result = await query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )`,
      [tableName]
    )
    return result.rows[0].exists
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error)
    return false
  }
}

// Initialize database tables
// Note: In production, tables should already exist (created during setup)
// This function uses CREATE TABLE IF NOT EXISTS, so it's safe to run
// If DATABASE_URL_DDL is not set, it will fallback to DATABASE_URL
export async function initDatabase() {
  try {
    // In production, check if tables exist first
    // If they don't exist, we can't create them with read-write user
    if (process.env.NODE_ENV === 'production') {
      const familiesTableExists = await tableExists('families')
      if (!familiesTableExists) {
        throw new Error(
          'Database tables do not exist. Please run the database migration SQL in your Neon SQL Editor using the DDL/owner connection. ' +
          'See scripts/migrations/001_initial_schema.sql for the SQL to run.'
        )
      }
      // Tables exist, no need to create them
      console.log('Database tables already exist, skipping initialization')
      return
    }
    
    // In development, try to create tables if they don't exist
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

    // Create debts table
    await queryDDL(`
      CREATE TABLE IF NOT EXISTS debts (
        id SERIAL PRIMARY KEY,
        family_id INTEGER NOT NULL REFERENCES families(id) ON DELETE CASCADE,
        amount DECIMAL(10, 2) NOT NULL,
        description TEXT,
        creditor VARCHAR(255),
        due_date DATE,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
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

    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Error initializing database:', error)
    throw error
  }
}

export default pool
export { ddlPool }


