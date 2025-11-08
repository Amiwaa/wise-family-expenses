# Wise Family Expenses - PWA

A beautiful Progressive Web App (PWA) for tracking family expenses, savings, and current account transactions. Built with Next.js and deployable to Vercel.

## Features

- 📊 **Dashboard**: Comprehensive overview of all financial activities
- 💸 **Expense Tracking**: Categorize and track expenses with custom categories
- 💵 **Savings Management**: Track savings goals and progress
- 💳 **Current Account**: Monitor credit and debit transactions
- 👨‍👩‍👧‍👦 **Family Collaboration**: Multiple family members can join and track expenses together
- ⚙️ **Custom Sections**: Create custom expense or savings sections
- 📱 **PWA**: Installable on mobile devices from the web browser
- 🎨 **Beautiful UI**: Modern, responsive design with Tailwind CSS

## Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Run development server:**
```bash
npm run dev
```

3. **Open [http://localhost:3000](http://localhost:3000)** in your browser

## Building for Production

```bash
npm run build
npm start
```

## Deploying to Vercel

1. **Push your code to GitHub**

2. **Import your repository to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will automatically detect Next.js and configure it

3. **Deploy:**
   - Click "Deploy"
   - Your app will be live in minutes!

## Installing as PWA

### On Mobile (Android/iOS):

1. Visit your deployed website
2. Look for the "Add to Home Screen" prompt, or
3. Open browser menu → "Add to Home Screen" / "Install App"
4. The app will install and work like a native app!

### On Desktop:

1. Visit your deployed website
2. Look for the install icon in the address bar
3. Click to install

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── page.tsx           # Home page (routing logic)
│   ├── dashboard/         # Dashboard page
│   ├── expenses/          # Expenses page
│   ├── savings/           # Savings page
│   ├── currents/          # Currents page
│   ├── add-transaction/   # Add/Edit transaction
│   ├── family-members/    # Family members management
│   └── custom-sections/  # Custom sections
├── components/            # React components
├── lib/                   # Utilities and storage
├── public/                # Static files and PWA assets
└── package.json
```

## Technologies Used

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first CSS framework
- **next-pwa**: PWA support
- **localStorage**: Client-side data storage
- **date-fns**: Date formatting

## Data Storage

All data is stored locally in the browser using `localStorage`. This means:
- ✅ No backend required
- ✅ Works offline (after first load)
- ✅ Fast and private
- ⚠️ Data is per-device (not synced across devices)

## PWA Features

- ✅ Installable on mobile and desktop
- ✅ Works offline (service worker)
- ✅ App-like experience
- ✅ Fast loading
- ✅ Responsive design

## Browser Support

- Chrome/Edge (recommended)
- Safari (iOS 11.3+)
- Firefox
- Samsung Internet

## Notes

- All data is stored locally in the browser
- No internet connection required after first load
- Data persists between sessions
- Each device has its own data (not synced)

## License

Private - Personal use only
