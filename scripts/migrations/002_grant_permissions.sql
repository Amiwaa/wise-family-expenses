-- Grant permissions to read-write user
-- Run this SQL in Neon SQL Editor using the DDL/owner connection
-- Replace 'expenses_readwrite' with your actual read-write username if different

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO expenses_readwrite;

-- Grant permissions on all existing tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO expenses_readwrite;

-- Grant permissions on all sequences (for SERIAL columns)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO expenses_readwrite;

-- Grant permissions on future tables (so new tables automatically get permissions)
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO expenses_readwrite;

-- Grant permissions on future sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT USAGE, SELECT ON SEQUENCES TO expenses_readwrite;

-- Verify permissions (optional - run this to check)
-- SELECT grantee, privilege_type 
-- FROM information_schema.role_table_grants 
-- WHERE table_schema = 'public' AND grantee = 'expenses_readwrite';

