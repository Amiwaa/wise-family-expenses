# Google OAuth Setup Guide

This application uses Google OAuth for secure authentication. Users must sign in with their Google account to access their family data.

## Security Features

- **Email-based authentication**: Users authenticate with their Google account email
- **Family access control**: Users can only access data for families they are members of
- **Admin-only actions**: Only family admins can add new members
- **Secure API routes**: All API routes verify authentication and family membership

## Setup Instructions

### 1. Create Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Navigate to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application" as the application type
   - **Authorized JavaScript origins** (required):
     - For local development: `http://localhost:3000`
     - For production: `https://your-domain.com` (e.g., `https://your-app.vercel.app`)
     - Note: Do NOT include a trailing slash
   - **Authorized redirect URIs** (required):
     - For local development: `http://localhost:3000/api/auth/callback/google`
     - For production: `https://your-domain.com/api/auth/callback/google`
     - Note: The redirect URI must match exactly, including the protocol (http/https)
   - Click "Create"
   - Save the **Client ID** and **Client Secret**

### 2. Set Environment Variables

Add the following to your `.env.local` file:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# NextAuth Secret (generate a random string)
NEXTAUTH_SECRET=your-random-secret-here
NEXTAUTH_URL=http://localhost:3000  # For production, use your domain URL
```

**To generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 3. Production Setup (Vercel)

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add the following variables:
   - `GOOGLE_CLIENT_ID`: Your Google Client ID
   - `GOOGLE_CLIENT_SECRET`: Your Google Client Secret
   - `NEXTAUTH_SECRET`: Your generated secret
   - `NEXTAUTH_URL`: Your production domain (e.g., `https://your-app.vercel.app`)

### 4. ⚠️ IMPORTANT: Update Google OAuth After Deployment

**After deploying to Vercel, you MUST update Google OAuth settings with your production URL:**

1. **Get your Vercel deployment URL**
   - After deployment, you'll get a URL like `https://your-app.vercel.app`
   - Copy this URL exactly

2. **Go to Google Cloud Console**
   - Navigate to [Google Cloud Console](https://console.cloud.google.com/)
   - Go to "APIs & Services" > "Credentials"
   - Click on your OAuth 2.0 Client ID

3. **Add Authorized JavaScript origins**
   - Click "Add URI" under "Authorized JavaScript origins"
   - Add: `https://your-app.vercel.app` (replace with your actual Vercel URL)
   - **Important:** No trailing slash!
   - Click "Save"

4. **Add Authorized redirect URIs**
   - Click "Add URI" under "Authorized redirect URIs"
   - Add: `https://your-app.vercel.app/api/auth/callback/google` (replace with your actual Vercel URL)
   - **Important:** No trailing slash!
   - Click "Save"

5. **Verify your settings**
   - You should now have BOTH localhost and production URLs:
     - JavaScript origins: `http://localhost:3000` AND `https://your-app.vercel.app`
     - Redirect URIs: `http://localhost:3000/api/auth/callback/google` AND `https://your-app.vercel.app/api/auth/callback/google`

**⚠️ Without this step, Google OAuth will NOT work in production!**

### 5. How It Works

1. **User signs in**: Users click "Sign in with Google" and authenticate via Google
2. **Session creation**: NextAuth creates a secure session using HTTP-only cookies
3. **Family creation**: After signing in, new users can create a family
4. **Family membership**: Users can only access families they are members of
5. **API security**: All API requests verify:
   - User is authenticated (has valid session)
   - User is a member of the requested family
   - Admin actions require admin privileges

### 6. Adding Family Members

1. Family admins can add members by entering their email address
2. The new member must sign in with the same Google email address
3. Once signed in, they automatically have access to the family data

## Troubleshooting

### "Authentication required" error
- Make sure you're signed in with Google
- Check that `NEXTAUTH_SECRET` is set correctly
- Verify that cookies are enabled in your browser

### "Unauthorized" error when accessing family data
- Ensure you're a member of the family
- Verify your Google email matches the email used when added to the family
- Contact a family admin to add you if needed

### OAuth redirect URI mismatch
- Ensure the redirect URI in Google Console matches your application URL exactly
- For local development: `http://localhost:3000/api/auth/callback/google`
- For production: `https://your-domain.com/api/auth/callback/google`
- Check that both the **Authorized JavaScript origins** and **Authorized redirect URIs** are set correctly

### "Error 400: redirect_uri_mismatch"
- This error occurs when the redirect URI doesn't match what's configured in Google Console
- Verify:
  1. **Authorized JavaScript origins** includes your app's base URL (e.g., `http://localhost:3000`)
  2. **Authorized redirect URIs** includes the full callback URL (e.g., `http://localhost:3000/api/auth/callback/google`)
  3. No trailing slashes in the URLs
  4. Protocol matches (http for local, https for production)
  5. Port number is correct (3000 for local development)

## Important Notes

### Authorized JavaScript Origins
- These are the base URLs where your application is hosted
- **Required for OAuth to work properly**
- Must match exactly (no trailing slashes, correct protocol)
- For local development: `http://localhost:3000`
- For production: Your actual domain (e.g., `https://your-app.vercel.app`)

### Authorized Redirect URIs
- These are the full callback URLs where Google redirects after authentication
- Must include the full path: `/api/auth/callback/google`
- Must match exactly (no trailing slashes, correct protocol)
- For local development: `http://localhost:3000/api/auth/callback/google`
- For production: `https://your-domain.com/api/auth/callback/google`

## Security Notes

- Never commit `.env.local` to version control
- Use strong, random values for `NEXTAUTH_SECRET`
- Keep your Google OAuth credentials secure
- Regularly review and update OAuth redirect URIs and JavaScript origins
- Users can only access data for families they are explicitly members of
- Only add trusted domains to Authorized JavaScript origins

