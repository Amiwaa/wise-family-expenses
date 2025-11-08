# Neon Postgres Setup Guide

## Step 1: Create Neon Database

1. Go to [Neon Console](https://console.neon.tech)
2. Sign up or log in
3. Click "Create Project"
4. Choose a project name (e.g., "wise-family-expenses")
5. Select a region closest to you
6. Click "Create Project"

## Step 2: Get Connection Strings

This project uses two connection strings for better security and separation of concerns:

1. **Read-Write Connection** - For regular operations (SELECT, INSERT, UPDATE, DELETE)
2. **DDL Connection** - For schema changes (CREATE, ALTER, DROP, etc.)

### Connection Strings

You should have two connection strings from Neon:
- Read-write connection (for regular users)
- DDL connection (for database owner/admin)

Example connection strings:
```
postgresql://username:password@ep-xxxxx.us-east-2.aws.neon.tech/dbname?sslmode=require&channel_binding=require
```

## Step 3: Set Environment Variables

1. Create a file named `.env.local` in the root of your project
2. Add both connection strings:
   ```env
   # Read-Write Connection (for regular user operations)
   DATABASE_URL=postgresql://expenses_readwrite:password@ep-xxxxx.ap-southeast-1.aws.neon.tech/expenses_database?sslmode=require&channel_binding=require

   # DDL Connection (for schema changes)
   DATABASE_URL_DDL=postgresql://neondb_owner:password@ep-xxxxx.ap-southeast-1.aws.neon.tech/expenses_database?sslmode=require&channel_binding=require
   ```
3. Replace with your actual connection strings from Neon

**Note:** If `DATABASE_URL_DDL` is not set, the system will fall back to using `DATABASE_URL` for DDL operations.

## Step 4: Install Dependencies

```bash
npm install
```

This will install the `pg` package needed for Postgres.

## Step 5: Initialize Database

The database tables will be created automatically on the first API request. You can also manually initialize by:

1. Start your dev server: `npm run dev`
2. Make any API call (like creating a family)
3. Tables will be created automatically

Or run this in your Neon SQL editor:
```sql
-- Copy the SQL from lib/db.ts initDatabase() function
```

## Step 6: Deploy to Vercel

1. **Initialize Database First** (Important!)
   - Make sure you've run `npm run db:init` locally or manually created the tables
   - The database schema must exist before deploying to production

2. Push your code to GitHub
3. Go to Vercel dashboard
4. Import your project
5. **Add Environment Variables:**
   - Go to Project Settings → Environment Variables
   - Add `DATABASE_URL` with your Neon **read-write** connection string
   - **Do NOT add `DATABASE_URL_DDL`** - It's only needed for development/setup
   - Make sure to add it for Production, Preview, and Development
6. Deploy!

**Note:** DDL connection is only needed during development or initial database setup. In production, the database schema should already exist, so only the read-write connection is needed.

## Testing

1. Start dev server: `npm run dev`
2. Create a family through the app
3. Check Neon dashboard to see the data in your database

## Database Schema

The app creates these tables:
- `families` - Family information
- `family_members` - Family members with emails
- `expenses` - Expense transactions
- `savings` - Savings entries
- `currents` - Current account transactions
- `custom_sections` - Custom expense/savings sections
- `custom_section_transactions` - Transactions in custom sections
- `categories` - Expense categories

## Security Notes

- Never commit `.env.local` to git (it's in .gitignore)
- Use environment variables in Vercel for production
- The connection string includes your password - keep it secret!

## Troubleshooting

**Connection refused?**
- Check your DATABASE_URL and DATABASE_URL_DDL are correct
- Make sure SSL mode is set (Neon requires SSL)
- Check Neon dashboard to ensure database is running

**Tables not created?**
- Check browser console for errors
- Check server logs for database errors
- Verify DATABASE_URL_DDL is set correctly (or DATABASE_URL as fallback)
- DDL operations require the owner/admin connection string

**Can't connect in production?**
- Make sure DATABASE_URL is set in Vercel environment variables (DDL is not needed)
- Verify the database schema exists (run `npm run db:init` locally first)
- Redeploy after adding environment variables

## Connection String Architecture

The application uses two separate connection pools:

- **Read-Write Pool** (`DATABASE_URL`): Used for all regular database operations (SELECT, INSERT, UPDATE, DELETE). This uses a user with read-write permissions.

- **DDL Pool** (`DATABASE_URL_DDL`): Used for schema changes (CREATE TABLE, ALTER TABLE, DROP TABLE, CREATE INDEX, etc.). This uses the database owner/admin account.

This separation provides:
- Better security (limited permissions for regular operations)
- Clear separation of concerns
- Ability to use connection pooling optimized for each use case


