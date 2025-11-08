# Deployment Guide

## Quick Deploy to Vercel

### Step 1: Prepare Icons

Before deploying, you need to create PWA icons:

1. **Create app icons:**
   - `public/icon-192.png` (192x192 pixels)
   - `public/icon-512.png` (512x512 pixels)
   - `public/favicon.ico` (48x48 pixels)

   You can use online tools like:
   - [Favicon Generator](https://favicon.io/)
   - [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
   - Or create simple colored squares as placeholders

2. **Quick placeholder icons:**
   - Use any image editor to create solid color squares
   - Use the app's primary color (#6366f1 - indigo)
   - Add the 💰 emoji or "W" letter in the center

### Step 2: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### Step 3: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Import your repository
5. Vercel will auto-detect Next.js settings
6. Click "Deploy"
7. Wait 2-3 minutes for deployment

### Step 4: Configure PWA (Optional)

After deployment, your app should work as a PWA automatically. To test:

1. Visit your deployed URL on mobile
2. Look for "Add to Home Screen" prompt
3. Or use browser menu → "Add to Home Screen"

## Environment Variables

No environment variables needed! The app uses localStorage for data storage.

## Custom Domain

1. Go to your project in Vercel dashboard
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

## Updating the App

Just push to GitHub - Vercel will auto-deploy:

```bash
git add .
git commit -m "Update app"
git push
```

## Troubleshooting

### PWA not installing?
- Make sure icons are in `public/` folder
- Check browser console for errors
- Ensure HTTPS is enabled (Vercel provides this automatically)

### Build errors?
- Run `npm run build` locally first
- Check for TypeScript errors
- Ensure all dependencies are in `package.json`

### Icons not showing?
- Verify icon files exist in `public/`
- Check `manifest.json` paths are correct
- Clear browser cache

## Testing Locally

```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

Then visit `http://localhost:3000` and test PWA installation.



