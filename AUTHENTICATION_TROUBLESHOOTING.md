# Authentication Troubleshooting Guide

## "Authentication error. Please try signing in again."

This error occurs when NextAuth cannot verify the user's session. Here's how to fix it:

## Step 1: Verify Vercel Environment Variables

**Check that ALL of these are set in Vercel:**

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify these variables are set for **Production** environment:

```
✅ DATABASE_URL=postgres://...
✅ GOOGLE_CLIENT_ID=your-client-id
✅ GOOGLE_CLIENT_SECRET=your-client-secret
✅ NEXTAUTH_SECRET=your-secret-here
✅ NEXTAUTH_URL=https://your-app.vercel.app
```

**Important Notes:**
- `NEXTAUTH_URL` must match your exact Vercel domain (e.g., `https://wise-family-expenses.vercel.app`)
- `NEXTAUTH_SECRET` must be the same value you used locally (from `.env.local`)
- Make sure there are no extra spaces or quotes in the values

## Step 2: Verify Google OAuth Settings

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" → "Credentials"
3. Click on your OAuth 2.0 Client ID
4. **Check Authorized JavaScript origins:**
   - Should include: `https://your-app.vercel.app` (no trailing slash)
5. **Check Authorized redirect URIs:**
   - Should include: `https://your-app.vercel.app/api/auth/callback/google` (no trailing slash)

## Step 3: Check Vercel Logs

1. Go to Vercel Dashboard → Your Project → Logs
2. Look for errors related to:
   - `NEXTAUTH_SECRET is not set`
   - `Error getting authenticated user`
   - Cookie-related errors

## Step 4: Common Issues and Solutions

### Issue 1: NEXTAUTH_SECRET Missing or Incorrect

**Symptoms:**
- Authentication error immediately after sign-in
- Logs show "NEXTAUTH_SECRET is not set"

**Solution:**
1. Generate a new secret: `openssl rand -base64 32`
2. Set it in Vercel Environment Variables
3. Redeploy the app

### Issue 2: NEXTAUTH_URL Incorrect

**Symptoms:**
- Works locally but fails in production
- Session not persisting after redirect

**Solution:**
1. Set `NEXTAUTH_URL` to your exact Vercel domain: `https://your-app.vercel.app`
2. Make sure there's no trailing slash
3. Redeploy

### Issue 3: Google OAuth Redirect URI Mismatch

**Symptoms:**
- Redirects to error page after Google sign-in
- "redirect_uri_mismatch" error

**Solution:**
1. Add `https://your-app.vercel.app/api/auth/callback/google` to Google OAuth redirect URIs
2. Make sure the URL matches exactly (including `https://`)

### Issue 4: Cookies Not Being Set

**Symptoms:**
- Session appears to work but immediately fails
- No session cookie in browser

**Solution:**
1. Check that your Vercel domain uses HTTPS (it should by default)
2. Verify `NEXTAUTH_URL` starts with `https://`
3. Check browser console for cookie-related errors

## Step 5: Test the Authentication Flow

1. **Clear browser cookies** for your Vercel domain
2. Go to your Vercel app
3. Click "Sign in with Google"
4. Complete Google OAuth flow
5. Check browser console (F12) for any errors
6. Check Vercel logs for server-side errors

## Step 6: Verify Session Creation

After signing in, check:

1. **Browser Console:** Should see session data
2. **Vercel Logs:** Should see "User authenticated successfully: [email]"
3. **Network Tab:** Should see `/api/auth/session` returning user data

## Still Not Working?

### Debug Steps:

1. **Check Vercel Logs:**
   ```bash
   # Look for these log messages:
   - "Checking authentication..."
   - "No token found. Cookies present: ..."
   - "User authenticated successfully: ..."
   ```

2. **Verify Environment Variables:**
   - Go to Vercel → Settings → Environment Variables
   - Make sure all variables are set for "Production"
   - Verify values match your `.env.local` (except `NEXTAUTH_URL`)

3. **Test API Route Directly:**
   - Try accessing `/api/auth/session` directly
   - Should return session data if authenticated

4. **Check Cookie Settings:**
   - Open browser DevTools → Application → Cookies
   - Look for `__Secure-next-auth.session-token` (production)
   - Or `next-auth.session-token` (development)

## Quick Fix Checklist

- [ ] `NEXTAUTH_SECRET` is set in Vercel
- [ ] `NEXTAUTH_URL` is set to `https://your-app.vercel.app` (no trailing slash)
- [ ] `GOOGLE_CLIENT_ID` is set in Vercel
- [ ] `GOOGLE_CLIENT_SECRET` is set in Vercel
- [ ] Google OAuth redirect URI includes `https://your-app.vercel.app/api/auth/callback/google`
- [ ] Google OAuth JavaScript origin includes `https://your-app.vercel.app`
- [ ] All environment variables are set for "Production" environment
- [ ] App has been redeployed after setting environment variables
- [ ] Browser cookies cleared for the domain

## Need More Help?

If you've checked all of the above and it's still not working:

1. Check Vercel logs for specific error messages
2. Check browser console (F12) for client-side errors
3. Verify the exact error message you're seeing
4. Check if the issue occurs immediately after sign-in or after a page refresh

