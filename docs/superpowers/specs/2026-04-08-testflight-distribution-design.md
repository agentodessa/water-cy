# TestFlight Distribution — Design Spec

**Date:** 2026-04-08
**Status:** Approved
**Approach:** Full EAS + Local Xcode + Xcode Cloud CI (mirroring matrix app)

## Overview

Prepare the Cyprus Water app for TestFlight distribution by adding EAS build configuration, Xcode Cloud CI scripts, a privacy manifest, and updating the bundle identifier — matching the proven pattern from the matrix (Eisenhower) app.

## 1. Bundle ID & App Config

Update `app.json`:
- `ios.bundleIdentifier`: `com.andrii.melnykov.cyprus-water`
- `android.package`: `com.andrii.melnykov.cypruswater` (no hyphens — Android requirement)

No other app.json changes needed — name, version, slug, splash, icon are already set.

## 2. EAS Configuration

New file `eas.json`:

```json
{
  "cli": { "version": ">= 15.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": { "simulator": true }
    },
    "preview": {
      "distribution": "internal",
      "ios": { "buildConfiguration": "Release" }
    },
    "production": {
      "ios": { "buildConfiguration": "Release" }
    }
  },
  "submit": {
    "production": {
      "ios": {}
    }
  }
}
```

- **development**: Simulator builds for local dev
- **preview**: Ad-hoc internal distribution for device testing
- **production**: TestFlight / App Store release builds

## 3. Package.json Script

Add to `scripts`:

```json
"prebuild:ios": "npx expo prebuild --platform ios --clean"
```

Regenerates the native iOS project from Expo config with a clean slate.

## 4. Xcode Cloud CI Scripts

### `ci_scripts/ci_post_clone.sh`

Root-level post-clone hook. Runs `npm ci` to install dependencies. No env vars needed (the water app has no secrets — it calls a public API).

```sh
#!/bin/sh
set -e
cd "$CI_PRIMARY_REPOSITORY_PATH"
npm ci
```

### `ios/ci_scripts/ci_post_clone.sh`

iOS-specific post-clone. Sets up the Node.js build environment:

```sh
#!/bin/sh
set -e

echo ">>> Installing Node.js via nvm"
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm install 22
nvm use 22

echo ">>> Installing cmake (required by Hermes)"
brew install cmake

echo ">>> Installing npm dependencies"
cd "$CI_PRIMARY_REPOSITORY_PATH"
npm install

echo ">>> Installing CocoaPods"
cd "$CI_PRIMARY_REPOSITORY_PATH/ios"
pod install
```

### `ios/ci_scripts/ci_pre_xcodebuild.sh`

Cleans stale JS bundle outputs to prevent EPERM errors on re-builds:

```sh
#!/bin/sh
set -e

echo ">>> Cleaning stale bundle outputs to avoid EPERM on re-write"

DERIVED_DATA="${CI_DERIVED_DATA_PATH:-/Volumes/workspace/DerivedData}"
BUNDLE_OUTPUT="$DERIVED_DATA/Build/Intermediates.noindex/ArchiveIntermediates/CyprusWater/BuildProductsPath/Release-iphoneos/main.jsbundle"

if [ -f "$BUNDLE_OUTPUT" ]; then
  echo "Removing existing main.jsbundle"
  rm -f "$BUNDLE_OUTPUT"
fi

echo ">>> Ensuring DerivedData build products directory is writable"
BUILD_PRODUCTS_DIR="$DERIVED_DATA/Build/Intermediates.noindex/ArchiveIntermediates/CyprusWater/BuildProductsPath/Release-iphoneos"
if [ -d "$BUILD_PRODUCTS_DIR" ]; then
  chmod -R u+w "$BUILD_PRODUCTS_DIR" 2>/dev/null || true
fi
```

Note: Archive intermediate path uses `CyprusWater` (matching the Xcode target name), not the matrix app's `EisenhowerMatrixProductivity`.

## 5. Privacy Manifest

New file `ios/CyprusWater/PrivacyInfo.xcprivacy` — declares required API usage categories for App Store compliance:

| API Category | Reason Codes | Why |
|---|---|---|
| FileTimestamp | C617.1, 0A2A.1, 3B52.1 | Metro bundler, Expo file ops |
| UserDefaults | CA92.1 | AsyncStorage, Expo settings |
| DiskSpace | E174.1, 85F4.1 | Expo runtime checks |
| SystemBootTime | 35F9.1 | Reanimated / Hermes timing |

Also declares: no tracking (`NSPrivacyTracking: false`), no collected data types.

## 6. Native Project Strategy

The native `ios/` directory is **committed to git** (same as the matrix app). This means:

- The privacy manifest, CI scripts, and any manual Xcode changes persist across commits
- `prebuild --clean` is only run when upgrading Expo SDK or making major config changes (it will wipe and regenerate `ios/CyprusWater/`)
- For this task: run `npx expo prebuild --platform ios --clean` once to regenerate with the new bundle ID, then add the privacy manifest and CI scripts, then commit everything

After the initial prebuild, day-to-day workflow does **not** re-run prebuild — just open the workspace in Xcode and build.

## 7. TestFlight Deployment Flow

After implementation:

1. Bump version in `app.json` if needed
2. `npm run prebuild:ios`
3. Open `ios/CyprusWater.xcworkspace` in Xcode
4. Select signing team (Apple Developer account)
5. Select "Any iOS Device (arm64)" target
6. Product → Archive
7. Xcode Organizer → Distribute App → TestFlight & App Store
8. Wait for processing (~15-30 min)
9. Enable build in App Store Connect for testers

## Files Changed

| File | Action |
|---|---|
| `app.json` | Update bundle ID |
| `eas.json` | Create |
| `package.json` | Add `prebuild:ios` script |
| `ci_scripts/ci_post_clone.sh` | Create |
| `ios/ci_scripts/ci_post_clone.sh` | Create |
| `ios/ci_scripts/ci_pre_xcodebuild.sh` | Create |
| `ios/CyprusWater/PrivacyInfo.xcprivacy` | Create |

## Out of Scope

- Push notification entitlements (deferred per user request)
- EAS Build cloud builds (using local Xcode + Xcode Cloud instead)
- App Store submission (TestFlight only for now)
- Android distribution
