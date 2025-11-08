# Deploying to Vercel

## Quick Deployment Guide

### Prerequisites

1. ✅ Database schema is initialized (run `npm run db:init` locally first)
2. ✅ Code is pushed to GitHub
3. ✅ Neon database is created and running

### Step 1: Initialize Database Schema

**Important:** Before deploying, make sure your database tables are created:

```bash
# Run this locally first
npm run db:init
```

Or manually run the SQL from `scripts/migrations/001_initial_schema.sql` in your Neon SQL editor.

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure the project:
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: ./ (default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

### Step 3: Add Environment Variables

**In Vercel Dashboard → Project Settings → Environment Variables:**

Add **ONLY** the read-write connection:

```
DATABASE_URL=postgresql://expenses_readwrite:password@ep-xxxxx.ap-southeast-1.aws.neon.tech/expenses_database?sslmode=require&channel_binding=require
```

**Do NOT add `DATABASE_URL_DDL`** - It's only needed for:
- Local development (when setting up the database)
- Running database migrations
- Initial schema creation

### Step 4: Deploy

1. Click "Deploy"
2. Wait for the build to complete
3. Your app will be live at `https://your-app.vercel.app`

## Why Only DATABASE_URL in Production?

- **DDL Connection**: Only needed for creating/altering database schema (CREATE, ALTER, DROP)
- **Read-Write Connection**: Needed for all regular operations (SELECT, INSERT, UPDATE, DELETE)
- **Production**: Database schema should already exist, so only read-write is needed
- **Development**: Both connections are useful for development and migrations

## Verification

After deployment:

1. Visit your Vercel URL
2. Try creating a family (this will verify database connection)
3. Check Vercel logs for any errors

## Troubleshooting

**"Table does not exist" error?**
- Run `npm run db:init` locally first
- Or run the SQL from `scripts/migrations/001_initial_schema.sql` in Neon SQL editor

**Connection errors?**
- Verify `DATABASE_URL` is set correctly in Vercel
- Check that your Neon database is running
- Verify the connection string format is correct

**Need to update database schema?**
- Make changes locally with `DATABASE_URL_DDL` set
- Test locally
- Deploy to Vercel (only needs `DATABASE_URL`)

## Environment Variables Summary

| Variable | Development | Production (Vercel) |
|----------|------------|---------------------|
| `DATABASE_URL` | ✅ Required | ✅ Required |
| `DATABASE_URL_DDL` | ✅ Optional (for migrations) | ❌ Not needed |

## Next Steps

After deployment:
1. Test the app functionality
2. Install as PWA on your phone (see `INSTALL_APP.md`)
3. Share with family members!

