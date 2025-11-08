# Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

### 3. Open in Browser
Visit [http://localhost:3000](http://localhost:3000)

That's it! The app is running locally.

## 📱 Testing PWA Features

### On Desktop:
1. Open Chrome/Edge
2. Visit `http://localhost:3000`
3. Look for install icon in address bar
4. Click to install

### On Mobile (via Network):
1. Find your computer's IP address:
   - Windows: `ipconfig` (look for IPv4)
   - Mac/Linux: `ifconfig` or `ip addr`
2. On your phone, visit: `http://YOUR_IP:3000`
3. Look for "Add to Home Screen" option
4. Install the app!

## 🎨 Create App Icons (Before Deploying)

Before deploying to production, replace placeholder icons:

1. **Create icons:**
   - `public/icon-192.png` (192x192px)
   - `public/icon-512.png` (512x512px)
   - `public/favicon.ico` (48x48px)

2. **Quick way:**
   - Use [favicon.io](https://favicon.io/) to generate from text/emoji
   - Or use any image editor to create colored squares

## 🚢 Deploy to Vercel

1. **Push to GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

2. **Deploy:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repo
   - Click "Deploy"
   - Done! Your app is live!

3. **Install on Phone:**
   - Visit your Vercel URL on mobile
   - Tap "Add to Home Screen"
   - App installed! 🎉

## 💡 Tips

- **Development:** PWA features disabled in dev mode (faster)
- **Production:** PWA works automatically after deployment
- **Data:** Stored in browser localStorage (per device)
- **Offline:** Works offline after first load

## 🐛 Troubleshooting

**App not installing?**
- Make sure you're on HTTPS (Vercel provides this)
- Check that icons exist in `public/` folder
- Try different browser (Chrome works best)

**Build errors?**
- Run `npm run build` locally first
- Check for TypeScript errors
- Make sure all files are saved

**Can't access on mobile?**
- Make sure phone and computer are on same WiFi
- Check firewall isn't blocking port 3000
- Try using ngrok for public URL: `npx ngrok http 3000`

## 📚 Next Steps

- Read `README.md` for full documentation
- Check `DEPLOY.md` for deployment details
- Customize colors in `tailwind.config.js`
- Add your own features!

Happy coding! 🎉



