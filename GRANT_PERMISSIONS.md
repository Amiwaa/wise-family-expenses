# Grant Database Permissions - Quick Fix

## Problem
The error "permission denied for schema public" occurs because the read-write user (`expenses_readwrite`) doesn't have permissions to access the tables in the public schema.

## Solution: Grant Permissions

### Step 1: Open Neon SQL Editor
1. Go to your Neon Dashboard
2. Open your database project
3. Go to the **SQL Editor**

### Step 2: Run the Permission Grant SQL

**Important:** You must use the **DDL/owner connection** (not the read-write connection) to grant permissions.

Copy and paste this SQL into the Neon SQL Editor:

```sql
-- Grant permissions to read-write user
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
```

### Step 3: Run the SQL
Click "Run" or "Execute" to grant the permissions.

### Step 4: Verify Permissions (Optional)
Run this query to verify permissions were granted:

```sql
SELECT grantee, privilege_type, table_name
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' AND grantee = 'expenses_readwrite'
ORDER BY table_name, privilege_type;
```

You should see permissions for all tables.

### Step 5: Test the App
1. Go to your Vercel app
2. Sign in with Google
3. Try creating a family - it should work now!

## What These Permissions Do

- **USAGE ON SCHEMA**: Allows the user to access objects in the schema
- **SELECT, INSERT, UPDATE, DELETE**: Allows the user to read and modify data in tables
- **USAGE, SELECT ON SEQUENCES**: Allows the user to use SERIAL columns (auto-increment IDs)
- **ALTER DEFAULT PRIVILEGES**: Ensures future tables automatically get these permissions

## Important Notes

- You must run this SQL using the **owner/DDL connection** (the one with `neondb_owner` user)
- The read-write user cannot grant permissions to itself
- Once permissions are granted, the app should work immediately

## If You Get an Error

If you get an error saying the user doesn't exist:
1. Check the exact username in your connection string
2. The username is `expenses_readwrite` (from your connection string)
3. If it's different, replace `expenses_readwrite` in the SQL with your actual username

