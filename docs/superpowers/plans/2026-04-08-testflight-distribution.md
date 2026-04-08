# TestFlight Distribution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare the Cyprus Water app for TestFlight distribution via Xcode Cloud, matching the matrix app's proven pattern.

**Architecture:** Update bundle ID, add EAS config, add Xcode Cloud CI scripts, un-ignore the native iOS directory so it's committed to git. The privacy manifest already exists.

**Tech Stack:** Expo SDK 55, EAS CLI, Xcode Cloud, CocoaPods

**Spec:** `docs/superpowers/specs/2026-04-08-testflight-distribution-design.md`

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `app.json` | Modify | Bundle ID update (iOS + Android) |
| `package.json` | Modify | Add `prebuild:ios` script |
| `eas.json` | Create | EAS build profiles |
| `.gitignore` | Modify | Un-ignore `/ios` directory |
| `ci_scripts/ci_post_clone.sh` | Create | Root CI: npm install |
| `ios/ci_scripts/ci_post_clone.sh` | Create | iOS CI: Node, cmake, pods |
| `ios/ci_scripts/ci_pre_xcodebuild.sh` | Create | iOS CI: clean stale bundles |

**Already exists (no action needed):** `ios/CyprusWater/PrivacyInfo.xcprivacy` — already has correct content matching matrix app.

---

### Task 1: Update Bundle Identifier

**Files:**
- Modify: `app.json:19` (ios.bundleIdentifier)
- Modify: `app.json:22-25` (android section — add package)

- [ ] **Step 1: Update iOS bundle identifier in app.json**

Change `ios.bundleIdentifier` from `com.anonymous.cyprus-water` to `com.andrii.melnykov.cyprus-water`, and add `package` to the android section:

```json
"ios": {
  "supportsTablet": true,
  "bundleIdentifier": "com.andrii.melnykov.cyprus-water"
},
"android": {
  "adaptiveIcon": {
    "foregroundImage": "./assets/adaptive-icon.png",
    "backgroundColor": "#0A0F1E"
  },
  "package": "com.andrii.melnykov.cypruswater"
},
```

Note: Android package names cannot contain hyphens, so use `cypruswater` (no hyphen).

- [ ] **Step 2: Verify the JSON is valid**

Run: `node -e "JSON.parse(require('fs').readFileSync('app.json','utf8')); console.log('Valid JSON')"`
Expected: `Valid JSON`

- [ ] **Step 3: Commit**

```bash
git add app.json
git commit -m "chore: update bundle identifier to com.andrii.melnykov.cyprus-water"
```

---

### Task 2: Add EAS Configuration

**Files:**
- Create: `eas.json`

- [ ] **Step 1: Create eas.json**

```json
{
  "cli": {
    "version": ">= 15.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "buildConfiguration": "Release"
      }
    },
    "production": {
      "ios": {
        "buildConfiguration": "Release"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {}
    }
  }
}
```

- [ ] **Step 2: Verify the JSON is valid**

Run: `node -e "JSON.parse(require('fs').readFileSync('eas.json','utf8')); console.log('Valid JSON')"`
Expected: `Valid JSON`

- [ ] **Step 3: Commit**

```bash
git add eas.json
git commit -m "chore: add EAS build configuration"
```

---

### Task 3: Add prebuild:ios Script

**Files:**
- Modify: `package.json:5-9` (scripts section)

- [ ] **Step 1: Add prebuild:ios to package.json scripts**

Add to the `scripts` object:

```json
"scripts": {
  "start": "expo start",
  "android": "expo run:android",
  "ios": "expo run:ios",
  "web": "expo start --web",
  "prebuild:ios": "npx expo prebuild --platform ios --clean"
},
```

- [ ] **Step 2: Verify the JSON is valid**

Run: `node -e "JSON.parse(require('fs').readFileSync('package.json','utf8')); console.log('Valid JSON')"`
Expected: `Valid JSON`

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore: add prebuild:ios script"
```

---

### Task 4: Create Xcode Cloud CI Scripts

**Files:**
- Create: `ci_scripts/ci_post_clone.sh`
- Create: `ios/ci_scripts/ci_post_clone.sh`
- Create: `ios/ci_scripts/ci_pre_xcodebuild.sh`

- [ ] **Step 1: Create root-level ci_scripts/ci_post_clone.sh**

```sh
#!/bin/sh
set -e

# Install dependencies
cd "$CI_PRIMARY_REPOSITORY_PATH"
npm ci
```

- [ ] **Step 2: Create ios/ci_scripts/ci_post_clone.sh**

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

- [ ] **Step 3: Create ios/ci_scripts/ci_pre_xcodebuild.sh**

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

- [ ] **Step 4: Make all scripts executable**

Run: `chmod +x ci_scripts/ci_post_clone.sh ios/ci_scripts/ci_post_clone.sh ios/ci_scripts/ci_pre_xcodebuild.sh`

- [ ] **Step 5: Verify scripts are executable**

Run: `ls -la ci_scripts/ci_post_clone.sh ios/ci_scripts/ci_post_clone.sh ios/ci_scripts/ci_pre_xcodebuild.sh`
Expected: All three show `-rwxr-xr-x` permissions.

- [ ] **Step 6: Commit**

```bash
git add ci_scripts/ ios/ci_scripts/
git commit -m "chore: add Xcode Cloud CI scripts"
```

---

### Task 5: Regenerate Native iOS Project with New Bundle ID

**Files:**
- Modify: `.gitignore:40-41` (remove `/ios` from ignore list)
- Regenerate: `ios/` directory (via prebuild)

- [ ] **Step 1: Remove /ios from .gitignore**

Edit `.gitignore` — remove the `/ios` line from the "generated native folders" section. Keep `/android` ignored:

```
# generated native folders
/android
```

- [ ] **Step 2: Run prebuild to regenerate with new bundle ID**

Run: `npm run prebuild:ios`

This regenerates `ios/` with the updated `com.andrii.melnykov.cyprus-water` bundle identifier. Answer "yes" if prompted to overwrite existing files.

Expected: Clean exit with output showing the CyprusWater Xcode project was generated.

- [ ] **Step 3: Verify the bundle ID was applied**

Run: `grep -r "com.andrii.melnykov.cyprus-water" ios/CyprusWater.xcodeproj/project.pbxproj | head -3`
Expected: Multiple lines showing `PRODUCT_BUNDLE_IDENTIFIER = com.andrii.melnykov.cyprus-water`

- [ ] **Step 4: Verify the privacy manifest still exists**

Run: `cat ios/CyprusWater/PrivacyInfo.xcprivacy | head -5`
Expected: XML plist header. If the file was deleted by prebuild, re-create it from the spec (Section 5).

- [ ] **Step 5: Re-add CI scripts if prebuild removed ios/ci_scripts/**

Check: `ls ios/ci_scripts/`
If missing, re-create `ios/ci_scripts/ci_post_clone.sh` and `ios/ci_scripts/ci_pre_xcodebuild.sh` from Task 4 steps 2-3, then `chmod +x` them again.

- [ ] **Step 6: Install pods**

Run: `cd ios && pod install && cd ..`
Expected: Clean exit, `Podfile.lock` updated.

- [ ] **Step 7: Verify Xcode project builds**

Run: `xcodebuild -workspace ios/CyprusWater.xcworkspace -scheme CyprusWater -configuration Debug -sdk iphonesimulator -destination 'platform=iOS Simulator,name=iPhone 16' build 2>&1 | tail -5`
Expected: `** BUILD SUCCEEDED **`

- [ ] **Step 8: Commit the native iOS project**

```bash
git add .gitignore ios/
git commit -m "chore: commit native iOS project with updated bundle ID for TestFlight"
```

---

### Task 6: Verify Existing Tests Still Pass

- [ ] **Step 1: Run the test suite**

Run: `npx jest`
Expected: All 10 tests pass (5 suites). No regressions from config changes.

- [ ] **Step 2: If tests fail, diagnose and fix**

Config-only changes should not break tests. If failures occur, check whether jest mocks need updating for any new modules.

---

## Deployment Checklist (Manual — Not Automated)

After all tasks are complete, the developer should:

1. Register `com.andrii.melnykov.cyprus-water` in the Apple Developer portal
2. Open `ios/CyprusWater.xcworkspace` in Xcode
3. Select the signing team under Signing & Capabilities
4. Select "Any iOS Device (arm64)" as build target
5. Product → Archive
6. Distribute via Xcode Organizer → TestFlight & App Store
7. Wait for App Store Connect processing (~15-30 min)
8. Enable the build for TestFlight testers
