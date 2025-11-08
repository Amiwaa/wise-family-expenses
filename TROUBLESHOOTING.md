# Troubleshooting Internal Server Error

## Quick Fixes

### 1. Clear Cache and Reinstall
```bash
# Delete node_modules and lock files
rm -rf node_modules
rm -rf .next
rm package-lock.json

# Reinstall
npm install

# Try again
npm run dev
```

### 2. Check for TypeScript Errors
```bash
npm run build
```

### 3. Check Console for Specific Error
Look at the terminal where `npm run dev` is running for the exact error message.

## Common Issues

### Issue: "Cannot find module 'next-pwa'"
**Solution:** The PWA is disabled in development. This is normal. If you see this error, it means the conditional require isn't working. Try the simplified config below.

### Issue: Module resolution errors
**Solution:** Make sure all imports use `@/` prefix correctly.

### Issue: TypeScript errors
**Solution:** Run `npm run build` to see all TypeScript errors.

## Alternative: Simplified Config (If Still Having Issues)

If you're still getting errors, temporarily disable PWA completely:

Replace `next.config.js` with:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
};

module.exports = nextConfig;
```

You can add PWA back later for production.

## Still Not Working?

1. Check the terminal output for the exact error
2. Check browser console (F12) for client-side errors
3. Make sure you're using Node.js 18+ (check with `node --version`)
4. Try deleting `.next` folder and rebuilding



