# Android Build Troubleshooting

## Error Fixed: Capacitor Android Dependency Not Found

### Problem

```
Could not resolve project :capacitor-android.
No matching variant of project :capacitor-android was found.
```

### Root Cause

The Gradle build cache had stale references to the Capacitor Android module. This happens during initial project setup or after major dependency changes.

### Solution Applied

Cleaned the Gradle build cache:

```bash
cd android
./gradlew clean
```

**Status:** ✅ RESOLVED

---

## Current Error: Android SDK Not Found

### Problem

```
SDK location not found. Define a valid SDK location with an ANDROID_HOME
environment variable or by setting the sdk.dir path in your project's
local properties file at 'android/local.properties'.
```

### Why This Happens

Android Studio hasn't been installed yet, so the Android SDK location is unknown to Gradle.

### Solution: Install Android Studio

1. **Download Android Studio**

   - Visit: https://developer.android.com/studio
   - Download the latest stable version for Windows

2. **Install with Default Settings**

   - Run the installer
   - Accept all default SDK locations (usually `C:\Users\YourName\AppData\Local\Android\Sdk`)
   - Let it install:
     - Android SDK Platform
     - Android SDK Build-Tools
     - Android Emulator
     - Android SDK Platform-Tools

3. **Verify Installation**
   Once Android Studio opens:

   - Go to **File → Settings → Appearance & Behavior → System Settings → Android SDK**
   - Confirm SDK path is displayed (e.g., `C:\Users\Gamer\AppData\Local\Android\Sdk`)
   - Check that **Android 13.0 (API 33)** or higher is installed

4. **Build the App**
   After Android Studio is installed, you can build via:

   **Option A: Using Android Studio (Recommended)**

   ```bash
   cd "c:\Users\Gamer\Desktop\VortexPCs.com\Website Files"
   npx cap open android
   ```

   Then click the green **Build** button in Android Studio.

   **Option B: Using Command Line**

   ```bash
   cd "c:\Users\Gamer\Desktop\VortexPCs.com\Website Files\android"
   ./gradlew assembleDebug
   ```

   APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## Quick Reference

### Build Status Checklist

- ✅ Web app built (`dist/` folder exists)
- ✅ Android project generated (`android/` folder exists)
- ✅ Web assets synced to Android
- ✅ Capacitor Android dependency resolved
- ⏳ Android SDK needs to be installed
- ⏳ APK build pending Android Studio installation

### Next Steps

1. Install Android Studio
2. Open project with `npx cap open android`
3. Build → Generate Signed Bundle/APK → APK
4. Create a keystore (first time only)
5. Build release APK
6. Test on device/emulator

### Useful Commands

**Sync web changes to Android:**

```bash
npm run build
npx cap sync android
```

**Clean build cache:**

```bash
cd android
./gradlew clean
```

**Build debug APK (after SDK installed):**

```bash
cd android
./gradlew assembleDebug
```

**Build release APK (after SDK installed):**

```bash
cd android
./gradlew assembleRelease
```

### Environment Variables (Set After Android Studio Installation)

```
ANDROID_HOME=C:\Users\Gamer\AppData\Local\Android\Sdk
ANDROID_SDK_ROOT=C:\Users\Gamer\AppData\Local\Android\Sdk
```

Add to System PATH:

```
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\tools
%ANDROID_HOME%\tools\bin
```

---

## Summary

**Current Status:** The Android project is fully configured and ready to build. The only missing piece is Android Studio installation, which provides the Android SDK that Gradle needs to compile the app.

**Action Required:** Install Android Studio from https://developer.android.com/studio, then proceed with building the APK.

**Estimated Time:**

- Android Studio download: 5-10 minutes (1-2 GB)
- Installation: 5-10 minutes
- First build: 3-5 minutes
- **Total: ~20 minutes** from start to APK

---

## Current Error: `invalid source release: 21`

### Problem

```
Execution failed for task ':capacitor-android:compileDebugJavaWithJavac'.
> Java compilation initialization error
    error: invalid source release: 21
```

### Why This Happens

Capacitor 6 targets Java 21 (see `node_modules/@capacitor/android/capacitor/build.gradle` sets `sourceCompatibility`/`targetCompatibility` to Java 21). The machine currently has JDK 17 installed, so the Java compiler cannot build Java 21 sources.

### Solution: Install JDK 21 and point Gradle to it

1. **Install Temurin JDK 21 (LTS) via winget** (Windows):

   ```powershell
   winget install --id EclipseAdoptium.Temurin.21.JDK -e --silent
   ```

   If winget prompts for approval, accept. If winget is unavailable, download manually from: https://adoptium.net/temurin/releases/?version=21

2. **Set JAVA_HOME and Gradle JDK** (update paths if installer differs):

   ```powershell
   setx JAVA_HOME "C:\Program Files\Eclipse Adoptium\jdk-21*" /M
   setx ANDROID_HOME "C:\Users\Gamer\AppData\Local\Android\Sdk" /M
   setx ANDROID_SDK_ROOT "C:\Users\Gamer\AppData\Local\Android\Sdk" /M
   ```

   If you need an exact path, open `C:\Program Files\Eclipse Adoptium` and copy the installed JDK 21 folder name, e.g. `jdk-21.0.5.11-hotspot`.

3. **(Optional) Pin Gradle to JDK 21 without changing system JAVA_HOME** by adding to `android/gradle.properties`:

   ```
   org.gradle.java.home=C:/Program Files/Eclipse Adoptium/jdk-21*/
   ```

   Replace `*` with your exact folder if wildcards are not accepted.

4. **Restart terminals/Android Studio** so the new environment variables are picked up.

5. **Rebuild**:

   ```powershell
   cd "c:\Users\Gamer\Desktop\VortexPCs.com\Website Files\android"
   .\gradlew assembleDebug
   ```

### Status

- Local `sdk.dir` is now configured (`android/local.properties`).
- JDK 21 is still needed to complete the build.
