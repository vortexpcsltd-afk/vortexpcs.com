# Capacitor Setup Guide - Android & iOS Apps

## Overview

Your Vortex PCs React web app has been converted to native Android and iOS apps using **Capacitor**. This guide explains how to build, test, and deploy them.

---

## What Was Created

✅ **Capacitor Configuration** (`capacitor.config.ts`)

- App name: "Vortex PCs"
- Bundle ID: `com.vortexpcs.app`
- Web directory: `dist/`

✅ **Android Project** (`android/`)

- Native Android app wrapper
- Located in: `Website Files/android/`
- Copy location: `Android App/android/`

✅ **iOS Project** (`ios/`)

- Native iOS app wrapper
- Located in: `Website Files/ios/`
- Copy location: `iOS App/ios/`

---

## Prerequisites

### For Android Development

- **Android Studio** (download from https://developer.android.com/studio)
- **Java SDK 11+**
- **Android SDK API Level 34+**
- Gradle (included with Android Studio)

### For iOS Development

- **Mac with Xcode** (from App Store)
- **iOS 13+** as deployment target
- **CocoaPods** (package manager for iOS)

---

## Development Workflow

### 1. Build Web App to `dist/`

Before building native apps, you must build your React app:

```bash
cd "Website Files"
npm run build
```

This generates the web assets in `dist/` that Capacitor wraps.

### 2. Sync Web Assets to Native Projects

After building, copy web assets to native projects:

```bash
npx cap sync
```

Or sync specific platform:

```bash
npx cap sync android
npx cap sync ios
```

### 3. Open in Native IDEs

#### Android in Android Studio

```bash
npx cap open android
```

Or manually:

1. Open Android Studio
2. File → Open → `Website Files/android/`
3. Click "Trust Project"
4. Wait for Gradle sync to complete

#### iOS in Xcode

```bash
npx cap open ios
```

Or manually:

1. Open Finder
2. Navigate to `Website Files/ios/App/`
3. Double-click `App.xcworkspace` (NOT `App.xcodeproj`)
4. Select "Vortex PCs" target
5. Select your iPhone simulator or connected device

---

## Building for Production

### Android APK/AAB

In Android Studio:

1. Build menu → Build App Bundle or Build APK
2. Select Release variant
3. Sign with your keystore (create one in Build → Generate Signed Bundle/APK)
4. Save the signed file

Output: `.apk` (installer) or `.aab` (for Google Play)

### iOS IPA

In Xcode:

1. Select "Vortex PCs" target
2. Select "Any iOS Device" scheme
3. Product → Archive
4. Organizer opens → Select your archive
5. Distribute App → Select "App Store Connect" or "Ad Hoc"
6. Follow signing workflow
7. Save `.ipa` file

---

## Installing on Devices

### Android

```bash
# Connect USB device with Android installed
adb install -r app.apk
```

Or drag `.apk` onto Android emulator.

### iOS

1. Connect iPhone via USB
2. In Xcode, select your device
3. Product → Run (or ⌘R)
4. App installs and launches

---

## Native Plugins (Optional)

Capacitor has plugins for native features:

```bash
npm install @capacitor/camera
npm install @capacitor/geolocation
npm install @capacitor/push-notifications
npm install @capacitor/filesystem
```

Then use in React:

```typescript
import { Camera } from "@capacitor/camera";

const takePhoto = async () => {
  const image = await Camera.getPhoto({
    quality: 90,
    allowEditing: true,
    resultType: CameraResultType.Uri,
  });
};
```

---

## Debugging

### Android

1. Android Studio → View → Tool Windows → Logcat
2. Connect USB device or use emulator
3. App logs appear in real-time

### iOS

1. Xcode → View → Debug Area → Console
2. Connect iPhone or use simulator
3. App logs appear in real-time

---

## Versioning & Updates

Update app version in `capacitor.config.ts`:

```typescript
export const config: CapacitorConfig = {
  appId: "com.vortexpcs.app",
  appName: "Vortex PCs",
  version: "1.0.1", // ← Update this
  webDir: "dist",
};
```

Then rebuild both platforms.

---

## Deployment

### Google Play Store

1. Create Google Play Developer account ($25 one-time)
2. Build signed AAB file in Android Studio
3. Go to Google Play Console
4. Create new app
5. Upload AAB file
6. Fill in store listing (description, screenshots, etc.)
7. Submit for review

### Apple App Store

1. Create Apple Developer account ($99/year)
2. Create App ID in Apple Developer portal
3. Build signed IPA in Xcode
4. Go to App Store Connect
5. Create new app
6. Upload IPA via Transporter or Xcode
7. Fill in app info (description, screenshots, privacy policy)
8. Submit for review

---

## Troubleshooting

### "Could not find dist directory"

- Run `npm run build` first
- Check `capacitor.config.ts` webDir is correct

### Android build fails

- Run `./gradlew clean` in `android/`
- Rebuild: `npx cap sync android`
- Open in Android Studio and build again

### iOS build fails

- Run `pod install` in `ios/App/`
- Clean Xcode: ⌘K
- Rebuild: ⌘B

### App shows blank white screen

- Check browser console for errors
- Ensure PWA manifest is being loaded
- Verify assets are in `dist/` directory

### Capacitor plugins not working

- Run `npx cap sync` after installing plugins
- Rebuild native projects
- Check plugin documentation for required permissions

---

## Project Structure

```
Website Files/
├── src/                    # React source code
├── dist/                   # Built web app (generated by npm run build)
├── android/                # Capacitor Android project
│   ├── app/
│   ├── build.gradle
│   └── ...
├── ios/                    # Capacitor iOS project
│   ├── App/
│   ├── Podfile
│   └── ...
├── capacitor.config.ts     # Capacitor configuration
├── package.json            # Node dependencies
└── ...

Android App/
└── android/                # Copy of Website Files/android/

iOS App/
└── ios/                    # Copy of Website Files/ios/
```

---

## Key Commands

```bash
# Build web app
npm run build

# Sync web assets to native projects
npx cap sync

# Open in Android Studio
npx cap open android

# Open in Xcode
npx cap open ios

# Update native projects after version change
npx cap update

# Run tests
npm run test

# Lint code
npm run lint
```

---

## Resources

- **Capacitor Docs**: https://capacitorjs.com/docs
- **Android Development**: https://developer.android.com/docs
- **iOS Development**: https://developer.apple.com/documentation/
- **App Store Connect**: https://appstoreconnect.apple.com
- **Google Play Console**: https://play.google.com/console

---

## Support

For issues or questions:

1. Check official Capacitor documentation
2. Review plugin-specific guides
3. Check browser console (F12) for JavaScript errors
4. Run `npx cap doctor` to diagnose environment issues

---

**Good luck with your native apps! 🚀**
