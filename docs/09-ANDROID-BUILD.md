# 09 — Building the Android APK

The dev sandbox can't build the APK (no Android SDK, and the egress policy blocks
`dl.google.com` and `api.expo.dev`). Here are three ways to get one, all free.

## A. GitHub Actions (recommended — zero local setup)

A workflow (`.github/workflows/android-apk.yml`) builds an installable APK on a
GitHub runner. It does two things with the result:

1. **Commits the APK to the repo root** as `app-release.apk`. Because the repo is
   public, that gives a **direct, no-login, phone-installable** URL:
   `https://github.com/DevDhapodkar/kyapehnu.shop/raw/<branch>/app-release.apk`
   (the auto-commit carries `[skip ci]` so it doesn't re-trigger the build).
2. Uploads it as the **`kyapehnu-android-apk`** build artifact (30-day retention).

> The workflow builds an **arm64-v8a-only** APK (~55–65 MB). A universal APK is
> ~135 MB — over GitHub's 100 MB per-file limit, so it can't be committed to the
> repo. arm64 covers every modern phone; for x86 emulators or a universal build,
> use EAS (below). Committing the APK still grows git history each build, so a
> GitHub **Release** asset is cleaner long-term.

1. Push to a `claude/**` branch (or push a `v*` tag), **or** open the repo's
   **Actions** tab → **Android APK** → **Run workflow**.
2. When the run finishes, open it and download the **`kyapehnu-android-apk`**
   artifact (a zip containing `app-release.apk`).
3. Copy the APK to an Android phone and install (allow "install from unknown
   sources").

The APK is a release build signed with the default debug keystore — fine for
testing and pilot sideloading. For a Play Store upload you need a real upload key
(see EAS below, or configure a release keystore).

## B. EAS Build (Expo's free cloud builder)

```bash
npm i -g eas-cli
cd customer-app
eas login                       # free Expo account
eas build -p android --profile preview
```

`eas.json`'s `preview` (and `production`) profiles are set to
`android.buildType: "apk"`, so this produces an APK you download from the build
page. EAS also manages signing keys for you.

## C. Local build (needs Android Studio / SDK + JDK 17)

```bash
cd customer-app
npm install
npx expo install --fix
npx expo prebuild --platform android
cd android && ./gradlew :app:assembleRelease
# → android/app/build/outputs/apk/release/app-release.apk
```

## Before the app is fully functional in a build

The APK compiles and installs without these, but for a working build set:

- **`expo.extra.apiBaseUrl`** (app.json) → your deployed backend URL (not
  `localhost`, which points at the phone itself). Use your machine's LAN IP for
  local testing or the hosted backend URL.
- **`expo.extra.firebase`** → your Firebase web config (for real sign-in).
- **Google Maps API key** for `react-native-maps` (live tracking screen) — add an
  Android Maps key; without it the map tiles are blank but the app still runs.
- Optional: `CLOUDINARY_*` on the backend for image uploads.

## Notes

- `android.package` is `com.dhapodkardev.kyapehnu`, `versionCode` starts at 1.
- Bump `expo.android.versionCode` for each new build you distribute.
