-- Initial Database Schema Migration
-- This migration creates all required tables, indexes, and constraints

-- Create families table
CREATE TABLE IF NOT EXISTS families (
  id SERIAL PRIMARY KEY,
  family_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create family_members table
CREATE TABLE IF NOT EXISTS family_members (
  id SERIAL PRIMARY KEY,
  family_id INTEGER NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(family_id, email)
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  family_id INTEGER NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  category VARCHAR(255),
  added_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create savings table
CREATE TABLE IF NOT EXISTS savings (
  id SERIAL PRIMARY KEY,
  family_id INTEGER NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  goal DECIMAL(10, 2),
  added_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create currents table
CREATE TABLE IF NOT EXISTS currents (
  id SERIAL PRIMARY KEY,
  family_id INTEGER NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  type VARCHAR(10) NOT NULL CHECK (type IN ('credit', 'debit')),
  added_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create custom_sections table
CREATE TABLE IF NOT EXISTS custom_sections (
  id SERIAL PRIMARY KEY,
  family_id INTEGER NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('expense', 'saving')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create custom_section_transactions table
CREATE TABLE IF NOT EXISTS custom_section_transactions (
  id SERIAL PRIMARY KEY,
  section_id INTEGER NOT NULL REFERENCES custom_sections(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  added_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create debts table
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
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  family_id INTEGER NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  UNIQUE(family_id, name)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_family_members_family_id ON family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_expenses_family_id ON expenses(family_id);
CREATE INDEX IF NOT EXISTS idx_savings_family_id ON savings(family_id);
CREATE INDEX IF NOT EXISTS idx_currents_family_id ON currents(family_id);
CREATE INDEX IF NOT EXISTS idx_debts_family_id ON debts(family_id);
CREATE INDEX IF NOT EXISTS idx_custom_sections_family_id ON custom_sections(family_id);

-- Grant permissions to read-write user
-- Replace 'expenses_readwrite' with your actual read-write username if different
GRANT USAGE ON SCHEMA public TO expenses_readwrite;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO expenses_readwrite;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO expenses_readwrite;

-- Grant permissions on future tables (so new tables automatically get permissions)
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO expenses_readwrite;
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT USAGE, SELECT ON SEQUENCES TO expenses_readwrite;

