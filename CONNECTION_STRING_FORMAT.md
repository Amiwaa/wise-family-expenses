# Database Connection String Format

## ⚠️ IMPORTANT: Use `postgres://` NOT `postgresql://`

Neon requires the connection string to use `postgres://` (without the "ql").

## Correct Format

```
postgres://username:password@host:port/database?sslmode=require&channel_binding=require
```

## Your Connection Strings

### Read-Write Connection (for Vercel)
```
postgres://expenses_readwrite:khbasd%21%40%23%21%40iasdiqr21124@ep-muddy-wave-a1urcqah-pooler.ap-southeast-1.aws.neon.tech/expenses_database?sslmode=require&channel_binding=require
```

### DDL Connection (for local development)
```
postgres://neondb_owner:npg_Zeqd7nMk5oEi@ep-muddy-wave-a1urcqah-pooler.ap-southeast-1.aws.neon.tech/expenses_database?sslmode=require&channel_binding=require
```

## Common Mistakes

❌ **Wrong:** `postgresql://...` (with "ql")
✅ **Correct:** `postgres://...` (without "ql")

## Where to Update

1. **Vercel Environment Variables:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Update `DATABASE_URL` to use `postgres://` format
   - Save and redeploy

2. **Local `.env.local`:**
   - Update both `DATABASE_URL` and `DATABASE_URL_DDL` to use `postgres://` format
   - Restart your dev server

## Verification

After updating, test the connection:
- Local: `npm run dev` and try creating a family
- Vercel: Visit your app and try creating a family

If you see connection errors, double-check:
- Connection string starts with `postgres://`
- No typos in the connection string
- All environment variables are set correctly

