# XHere ‑ Android Setup Guide

Welcome to the **XHere Mobile** onboarding!  
This document walks you from zero to a running Android build based on the existing **XHere-Web** React / Node code-base wrapped with Capacitor.

---

## 1. Prerequisites & Requirements

| Tool | Minimum Version | Notes |
|------|-----------------|-------|
| **Node.js** | 18 LTS (tested with 18.x) | Installed system-wide |
| **npm** | 9.x or 10.x | Ships with Node |
| **Java JDK** | 17 | Required by Android Gradle |
| **Android Studio** | Flamingo / Hedgehog | Includes Android SDK & emulator |
| **Android SDK Platforms** | 33 (Android 13) or newer | Install via SDK Manager |
| **Capacitor CLI** | 7.x | Installed locally in `/frontend` |
| **Backend running** | `http://localhost:3000` in dev | Mobile talks to same API |
| **Google Maps key** | Mobile–enabled key with *Maps SDK for Android* | Set in `.env` |

> Tip: Add **environment variables** for signing, map key, etc. in a new file `frontend/.env.mobile` so they don’t leak to web.

---

## 2. Step-by-Step Build Instructions

From repository root:

```bash
# 1. Go to the React project
cd frontend

# 2. Install dependencies (includes Capacitor & plugins)
npm install

# 3. One-time Capacitor init (already done, repeat only if missing)
npx cap init "XHere" "com.xhere.app"

# 4. Add/refresh Android platform
npx cap add android           # only once
npm run android:sync          # every time dependencies or plugins change

# 5. Build React for production **and** copy assets to Android
npm run android:build
```

The command above runs:

1. `react-scripts build` – output to `build/`
2. `npx cap copy android` – moves `build/` into `android/app/src/main/assets/public`

---

## 3. Run on Device / Emulator

```bash
# Make sure an emulator is running or a device is plugged-in
npm run android:open   # opens the project in Android Studio

# OR quick one-liner
npm run android:run    # builds & installs APK directly
```

In Android Studio:

1. **Select a device** (emulator or USB).
2. Click ▶ **Run**.  
   Gradle will compile, then the app appears as *XHere*.

---

## 4. Configuration Options (Mobile vs Web)

| Setting | Web (`.env`) | Mobile (`.env.mobile` or `capacitor.config.ts`) | Purpose |
|---------|--------------|-------------------------------------------------|---------|
| `REACT_APP_API_URL` | `http://localhost:3000` | `http://10.0.2.2:3000` (Android emu) or prod URL | Backend base |
| `REACT_APP_GOOGLE_MAPS_API_KEY` | Browser key | Same key **+** *Maps SDK for Android* enabled | Maps |
| `REACT_APP_USE_ADVANCED_MARKER` | `true` / `false` | Same | Enable Google AdvancedMarkers |
| Capacitor `server.url` | *unused* | `http://10.0.2.2:3000` | Live-reload proxy when using `--livereload` |
| Android permissions | n/a | Set in `capacitor.config.ts → android.permissions` | Location, Camera etc. |

**Switching target**

```bash
# Web dev
npm start

# Android dev (hot reload)
npx cap run android -l --external
```

---

## 5. Troubleshooting Common Issues

| Symptom | Fix |
|---------|-----|
| `java.lang.UnsupportedClassVersionError` | Install **JDK 17** and point Android Studio to it. |
| API calls fail on emulator | Use `http://10.0.2.2` instead of `localhost` in `REACT_APP_API_URL`. |
| White screen after splash | Make sure `npm run android:build` executed **and** `npx cap copy` succeeded. |
| Maps not loading | Verify mobile key & SHA-1 in Google Cloud console, check `android/app/src/main/AndroidManifest.xml`. |
| Camera/Location denied | Manually enable permissions in device settings or re-install the app. |
| Gradle build stuck downloading | Configure Android Studio proxy or run `./gradlew --refresh-dependencies`. |

---

## 6. Mobile-Specific Features

* **Capacitor Plugins**
  * `@capacitor/geolocation` – precise GPS for check-ins.
  * `@capacitor/camera` – capture photos/videos directly in the post composer.
  * `@capacitor/status-bar` & `@capacitor/splash-screen` for branded UX.
* **Bottom Navigation** – touch-friendly tab bar (Map / Profile / Admin / Logout).
* **Floating Action Button** – quick “center on my location”.
* **Media Thumbnails** – instant preview of captured media before upload.
* **Offline-friendly** – web assets served locally; network plugin monitors connectivity.

---

## 7. Recommended Development Workflow

1. **Backend first**  
   Run `npm run dev` in `/backend` (nodemon) so API reloads fast.

2. **Web component iterations**  
   `npm start` in `/frontend` for blazing hot-reload. Most UI changes work in mobile unchanged.

3. **Mobile preview**  
   ```
   npm run android:build
   npm run android:run  # quick test
   ```
   Add the `-l --external` flags for live-reload.

4. **Plugin experiments**  
   When adding a new Capacitor plugin:  
   ```bash
   npm install @capacitor/<plugin>
   npm run android:sync
   ```

5. **Version control**  
   Commit only `android/` Gradle configuration you change manually. Generated files (`android/app/src/main/assets/public`) are ignored by default.

6. **Release build**  
   * Generate keystore (`keytool`)  
   * Set signing in `android/app/gradle.properties`  
   * `./gradlew assembleRelease` → upload `app-release.apk` to Google Play or sideload.

---

### 📱 Happy mapping & see you around the globe!
