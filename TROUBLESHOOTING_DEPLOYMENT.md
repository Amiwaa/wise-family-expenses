# Troubleshooting Vercel Deployment Issues

## Issue: "Failed to create family" or "Database error" on Vercel

### Symptoms:
- ✅ App works fine on `localhost:3000`
- ❌ App doesn't work on Vercel (production)
- ❌ Can't detect if email is already registered
- ❌ Error when trying to create a family

### Root Cause:
The database tables are not initialized in your **production database** (Neon).

**Important:** Your local database and production database are separate! Even if tables exist locally, you need to create them in the production database.

### Solution: Initialize Database Tables

1. **Go to Neon Dashboard**
   - Open your Neon project
   - Go to the SQL Editor

2. **Run the Migration SQL**
   - Copy the entire contents of `scripts/migrations/001_initial_schema.sql`
   - Paste it into the Neon SQL Editor
   - Click "Run" to execute

3. **Verify Tables Were Created**
   Run this query to check:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public'
   ORDER BY table_name;
   ```
   
   You should see:
   - `categories`
   - `currents`
   - `custom_sections`
   - `custom_section_transactions`
   - `debts`
   - `expenses`
   - `families`
   - `family_members`
   - `savings`

4. **Test Again**
   - Go to your Vercel app
   - Sign in with Google
   - Try creating a family

### Alternative: Use the Init Script Locally

If you have `DATABASE_URL` set to your production database locally:

```bash
# Make sure DATABASE_URL points to production database
npm run db:init
```

**Warning:** This requires `DATABASE_URL_DDL` to be set, which should point to your production database's DDL connection.

## Issue: Authentication Not Working on Vercel

### Symptoms:
- Can sign in locally
- Can't sign in on Vercel
- "Authentication required" errors

### Solution:

1. **Verify Environment Variables in Vercel**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Verify these are set:
     - `GOOGLE_CLIENT_ID`
     - `GOOGLE_CLIENT_SECRET`
     - `NEXTAUTH_SECRET`
     - `NEXTAUTH_URL` = `https://your-app.vercel.app`

2. **Update Google OAuth Settings**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - APIs & Services → Credentials
   - Edit your OAuth 2.0 Client ID
   - Add to **Authorized JavaScript origins**: `https://your-app.vercel.app`
   - Add to **Authorized redirect URIs**: `https://your-app.vercel.app/api/auth/callback/google`

## Issue: Can't Detect Existing Family

### Symptoms:
- User created a family locally
- On Vercel, it doesn't detect the family
- Shows "Create Family" form even though family exists

### Root Cause:
Your local database and production database are **separate databases**. Data created locally won't appear in production.

### Solution:

**Option 1: Create the family again in production**
- Sign in on Vercel
- Create the family again (with the same email)

**Option 2: Migrate data (advanced)**
- Export data from local database
- Import into production database
- Not recommended for production apps - better to start fresh in production

## Checking Vercel Logs

1. Go to Vercel Dashboard
2. Select your project
3. Go to "Logs" tab
4. Look for errors like:
   - "Database initialization error"
   - "relation does not exist"
   - "Authentication failed"
   - "Database connection error"

## Common Error Messages

### "relation 'families' does not exist"
**Solution:** Database tables not initialized. Run the migration SQL in Neon.

### "Database initialization failed"
**Solution:** Check `DATABASE_URL` in Vercel environment variables.

### "Authentication required"
**Solution:** 
- Check `NEXTAUTH_SECRET` is set in Vercel
- Check Google OAuth redirect URIs are correct
- Try signing out and signing in again

### "Connection timeout"
**Solution:**
- Check `DATABASE_URL` is correct
- Verify Neon database is running
- Check network connectivity

## Quick Checklist

Before deploying to Vercel:
- [ ] Database tables initialized in production (Neon)
- [ ] `DATABASE_URL` set in Vercel
- [ ] `GOOGLE_CLIENT_ID` set in Vercel
- [ ] `GOOGLE_CLIENT_SECRET` set in Vercel
- [ ] `NEXTAUTH_SECRET` set in Vercel
- [ ] `NEXTAUTH_URL` set to your Vercel domain
- [ ] Google OAuth redirect URIs updated with production URL
- [ ] Test sign-in flow
- [ ] Test family creation

## Still Having Issues?

1. **Check Vercel Logs** - Most errors will be logged there
2. **Check Browser Console** - Client-side errors appear here
3. **Verify Environment Variables** - Make sure all are set correctly
4. **Test Database Connection** - Try connecting to your Neon database directly

