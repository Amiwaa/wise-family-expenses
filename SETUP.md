# Setup Instructions

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```

3. **Run on Android**
   - Install Expo Go app on your Android device from Google Play Store
   - Scan the QR code shown in the terminal/browser
   - Or run: `npm run android` (requires Android Studio/emulator)

## Creating App Icons and Splash Screens

The app requires the following assets (you can create placeholders or use your own):

### Required Assets:
- `assets/icon.png` - App icon (1024x1024px)
- `assets/splash.png` - Splash screen (1242x2436px recommended)
- `assets/adaptive-icon.png` - Android adaptive icon (1024x1024px)
- `assets/favicon.png` - Web favicon (48x48px)

### Quick Placeholder Creation:

You can use online tools or create simple colored squares as placeholders:
- Use a solid color (#6366f1 - the app's primary color) for quick testing
- Or use tools like:
  - [App Icon Generator](https://www.appicon.co/)
  - [Icon Kitchen](https://icon.kitchen/)

### Using Expo's Asset Generation:

Expo can generate these automatically if you have a base icon:
```bash
npx expo install expo-asset
```

## Building for Production

### Option 1: Using EAS Build (Recommended)

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Login:
   ```bash
   eas login
   ```

3. Configure:
   ```bash
   eas build:configure
   ```

4. Build Android APK:
   ```bash
   eas build --platform android
   ```

### Option 2: Using Expo Build Service

```bash
expo build:android
```

### Option 3: Local Build (Advanced)

1. Install Android Studio
2. Set up Android SDK
3. Run:
   ```bash
   npx expo run:android
   ```

## Troubleshooting

### Common Issues:

1. **Module not found errors**: Run `npm install` again
2. **Metro bundler issues**: Clear cache with `npx expo start -c`
3. **Android build fails**: Ensure Android Studio and SDK are properly installed
4. **AsyncStorage errors**: Make sure `@react-native-async-storage/async-storage` is installed

### Clearing Cache:

```bash
# Clear Expo cache
npx expo start -c

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules
npm install
```

## Testing

- Use Expo Go app for quick testing during development
- For production testing, build and install the APK on a physical device
- Test on different Android versions if possible

## Notes

- All data is stored locally using AsyncStorage
- No backend/server required
- Works offline
- Data persists between app restarts



